/**
 * Date: 2019/8/19
 * Author: admin
 * Description: 游戏服框架(公共部分)
 */
'use strict';
let pomelo = require('pomelo');
let util = require('util');
let consts = require('../common/consts');
let messageService = require('../services/messageService');
let entityManager = require('../services/entityManager');
let utils = require('../util/utils');
let dispatcher = require('../util/dispatcher');
let Entity = require('./entity');
let TableUser = require('../entity/tableUser');
let TableReplay = require('../entity/tableReplay');

let Table = function (opts) {
	opts = opts || {};
	Entity.call(this, opts);
	this.serverId = pomelo.app.get('serverId');
	this.gameId = Number(this.serverId.split("-")[1]);
	if (!this.gameId) {
		this.logger.error('server gameId config error!');
	}
	this.gameCom = this['game' + this.gameId];
    this.initTable();
	// 创建回放对象
	this.tableReplay = new TableReplay(this);
};

util.inherits(Table, Entity);
module.exports = Table;

let pro = Table.prototype;

// 初始化桌子 
pro.initTable = function () {
	this.gameCom.init();
	this.tableOwnerID = 0;  //桌子创建者ID
	this.createTableTime = 0; //创建桌子时间
    this.gameStatus = consts.TableStatus.FREE; //桌子状态
	this.chairCount = 0; //桌子人数
	this.gameCount = 0; //游戏总局数
	this.currentCount = 0; //当前游戏局数
	this.players = []; //牌桌玩家列表
	this.lookPlayers = {}; //旁观玩家列表
	this.remainDissolveTime = 0; //剩余解散时间
	this.playwayCfg = {}; //桌子配置
	this.clubId = 0; //俱乐部ID
	this.playwayId = '0'; //玩法ID
	this.gameMode = 0;  //游戏模式 0普通场 1积分厅
	this.payMode = 0;  //0不扣 1大赢家 2所有赢家 3AA制
	this.payLimit = 0; //大于多少扣房费
	this.payCount = 0; // 扣房费数量
	this.isPercentage = false; // 是否百分比扣
	this._clearSchedulTime();
	this.tmpCurReplayCode = 0; //记录当前局回放码
};

// 创建桌子
pro.createTable = function (user, playwayCfg) {
	this.initTable()
	this.logger.info('创建桌子:%o', playwayCfg);
	this.tableOwnerID = user.uid;
	this.createTableTime =  Date.now();
	this.gameStatus = consts.TableStatus.READY;
	this.playwayCfg = playwayCfg;
	this.clubId = playwayCfg.clubId;
	this.playwayId = playwayCfg.id;
	this.gameMode = playwayCfg.gameMode;
	this.payMode = playwayCfg.payMode;
	this.payLimit = playwayCfg.payLimit;
	this.payCount = playwayCfg.payCount;
	this.isPercentage = playwayCfg.isPercentage;
	this.setChairCount(playwayCfg.gameParameter.bPlayerCount);
	this.addPlayer(user);
};

// 回收桌子
pro.clearTable = function () {
	if (this.gameStatus == consts.TableStatus.FREE) {
        this.logger.warn('桌子[%d]已经回收!', this.id);
		return;
	}

	let self = this;
	// 删除auth全局记录
	for (const i in this.players) {
		if (this.players.hasOwnProperty(i)) {
			let player = this.players[i];
			pomelo.app.rpc.auth.authRemote.removeGameInfo(null, player.uid, null);
			pomelo.app.rpc.connector.entryRemote.onClearTable.toServer(player.sid, player.uid, null);
		}
	}
	for (const i in this.lookPlayers) {
		if (this.lookPlayers.hasOwnProperty(i)) {
			let player = this.lookPlayers[i];
			pomelo.app.rpc.auth.authRemote.removeGameInfo(null, player.uid, null);
			pomelo.app.rpc.connector.entryRemote.onClearTable.toServer(player.sid, player.uid, null);
		}
	}

	// 移除亲友圈桌子
	let sid = dispatcher.clubmap(this.clubId);
	this.logger.info('移除亲友圈桌子:', this.clubId, sid);
	pomelo.app.rpc.club.clubRemote.removeClubTable.toServer(sid, {
		clubId: self.clubId,
		tableId: self.id,
	}, null);

	// 回收桌子
	pomelo.app.tableList.add(this.id);
	this.logger.info("剩余空闲房间数量: %d", pomelo.app.tableList.size);

	// 重置回放数据
    this.tableReplay.reset();
    
    // 重置桌子数据
    this.initTable();
};

// 接收消息
pro.onMessage = function (funcName, next, ...args) {
	// 桌子还没初始化,空闲状态
	if (this.gameStatus == consts.TableStatus.FREE) {
		this.logger.warn('桌子[%d]已经回收.', this.id);
		next(null, {code: consts.ERROR.TABLE_RECYCLED});
		return;
	}

	let fn = pro[funcName];
	if (fn) {
		fn.call(this, next, ...args);
	} else {
		let comFn = this.gameCom[funcName];
		if (comFn) {
			comFn.call(this.gameCom, next, ...args);
		} else {
			this.logger.warn('[%s]消息接口不存在!', funcName);
		}
	}
};

// 发信息给客户端
pro.sendMessage = function (uid, route, msg) {
	if (!uid) {
		// 群发
		for (const key in this.players) {
			if (this.players.hasOwnProperty(key)) {
				const user = this.players[key];
				messageService.pushMessageToPlayer({
					uid: user.uid,
					sid: user.sid
				}, route, msg);
			}
		}

		for (const key in this.lookPlayers) {
			if (this.lookPlayers.hasOwnProperty(key)) {
				const user = this.lookPlayers[key];
				messageService.pushMessageToPlayer({
					uid: user.uid,
					sid: user.sid
				}, route, msg);
			}
		}
	} else {
		// 单发
		let user = this.getPlayerByUid(uid);
		if (!user) {
			user = this.getLookPlayerByUid(uid);
		}
		messageService.pushMessageToPlayer({
			uid: uid,
			sid: user.sid
		}, route, msg);
	}
};

// 发送回放数据
pro.sendReplay = function (route, msg) {
	this.tableReplay.appendGameCommand(route, msg);
};

// 设置游戏人数
pro.setChairCount = function (wChairCount) {
	if (this.gameStatus == consts.TableStatus.START) {
		return;
	}
	this.chairCount = wChairCount;
};

// 得到游戏人数
pro.getChairCount = function () {
	return this.chairCount;	
};

// 已经加入人数
pro.getPlayerCount = function () {
	let length = 0;
	for (const key in this.players) {
		if (this.players.hasOwnProperty(key)) {
			const element = this.players[key];
			if (element && element != "undefined") {
				length = length + 1;
			}
		}
	}
	return length;	
};

// 设置游戏总局数
pro.setGameCount = function (bGameCount) {
	this.gameCount = bGameCount;
};

// 玩家是否已经在房间
pro.isPlayerInRoom = function (uid) {
	for (const i in this.players) {
		if (this.players.hasOwnProperty(i)) {
			let player = this.players[i];
			if (player.uid == uid) {
				return player;
			}
		}
	}
	return null;
};

// 获取玩家进入牌桌的chairID
pro.getAddPlayerIndex = function () {
	for (let i = 0; i < this.players.length; i++) {
		const element = this.players[i];
		if (!element || element == "undefined") {
			return i;
		}
	}
	return this.players.length;
};

// 添加旁观玩家
pro.setLookPlayer = function (user) {
	this.lookPlayers[user.uid] = user;
};

// 获取旁观玩家
pro.getLookPlayer = function (uid) {
	return this.lookPlayers[uid];
};

// 移除旁观玩家
pro.removeLookPlayer = function (uid) {
	if (this.getLookPlayer(uid)) {
		delete this.lookPlayers[uid];
	}
};

// 玩家进入
pro.addPlayer = function (user, seatId) {
	if (this.isLookPlayerEnter(user)) {
		this.logger.info('旁观玩家进入.');
		return;
	}

	let player = this.isPlayerInRoom(user.uid);
    if (!player) {
		// 人数已满
		if (this.getPlayerCount() >= this.getChairCount()) {
			this.logger.error('房间人数已满:', user.uid, this.id);
			return;
		}

		if (typeof seatId == 'number' && this.checkIsCharId(seatId)) {
			// 指定了seatId
			player = new TableUser(this, user);
			player.setUserChairID(seatId);
			this.players[seatId] = player;
		} else {
			// 系统指定
			let index = this.getAddPlayerIndex();
			player = new TableUser(this, user);
			player.setUserChairID(index);
			this.players[index] = player;
		}
	} else {
		// 更新players缓存对象
		player.setUserInfo(user);
	}

	//绑定tableId
	pomelo.app.rpc.connector.entryRemote.onEnterTable.toServer(player.sid, player.uid, this.serverId, this.id, null);

    // 发送玩法配置
    this.logger.info('加入桌子:', this.playwayCfg);
    this.gameCom.onSendParameter(user, this.playwayCfg);
    
    // 发送牌桌场景
	this.gameCom.onSendGameScene(user, this.gameStatus);

	// 广播玩家加入消息
	this.sendMessage(null, 'onUserEntryRoom', player.filterPlayerInfo());
	
	// 刷新俱乐部桌子信息
	this.refreshClubTable();

	// 记录当前服务器信息
	let gameInfo = {
		sid: this.serverId,
		tableId: this.id,
		clubId: this.clubId,
		playwayId: this.playwayId,
		gameId: this.gameId
	}
	pomelo.app.rpc.auth.authRemote.recordGameInfo(null, user.uid, gameInfo, null);

	// 重连解散状态
	if (this.remainDissolveTime > 0) {
		let msg = {
			clubId: this.clubId,
			tableId: this.id,
			dissolveData: this._getDissolveInfoData(),
			autoRemainTime: this.remainDissolveTime
		}
		this.sendMessage(null, 'onDissolveRoom', msg);
	}
};

// 旁观玩家进入
pro.isLookPlayerEnter = function (user) {
	let player = this.getLookPlayer(user.uid);
	if (player) {
		// 更新lookPlayers缓存对象
		this.setLookPlayer(user);

		//绑定tableId
		pomelo.app.rpc.connector.entryRemote.onEnterTable.toServer(player.sid, player.uid, this.serverId, this.id, null);

		// 发送玩法配置
		this.logger.info('旁观玩家加入桌子:', this.playwayCfg);
		this.gameCom.onSendParameter(user, this.playwayCfg);
		
		// 发送牌桌场景
		this.gameCom.onSendGameScene(user, this.gameStatus);

		// 记录当前牌桌信息
		let gameInfo = {
			sid: this.serverId,
			tableId: this.id,
			clubId: this.clubId,
			playwayId: this.playwayId,
			gameId: this.gameId
		}
		pomelo.app.rpc.auth.authRemote.recordGameInfo(null, user.uid, gameInfo, null);

		// 重连解散状态
		if (this.remainDissolveTime > 0) {
			let msg = {
				clubId: this.clubId,
				tableId: this.id,
				dissolveData: this._getDissolveInfoData(),
				autoRemainTime: this.remainDissolveTime
			}
			this.sendMessage(null, 'onDissolveRoom', msg);
		}
	}
	return player;
};

pro._filterPlayersInfo = function () {
	let playerList = [];
	for (const key in this.players) {
		if (this.players.hasOwnProperty(key)) {
			const player = this.players[key];
			playerList.push({
				uid: player.uid,
				name: player.name,
				avatarUrl: player.avatarUrl,
				sorce: player.sorce,
				curWinCount: player.curWinCount,
				curFailCount: player.curFailCount,
				curBombCount: player.curBombCount,
			})
		}
	}
	return playerList;
};

pro.filterLocalPlayersInfo = function (scores) {
	let playerList = [];
	for (const key in this.players) {
		if (this.players.hasOwnProperty(key)) {
			const player = this.players[key];
			const chairId = player.getUserChairId();
			playerList.push({
				uid: player.uid,
				name: player.name,
				avatarUrl: player.avatarUrl,
				sorce: scores[chairId],
				totalSorce: player.sorce,
			})
		}
	}
	return playerList;
};

// 刷新俱乐部桌子信息
pro.refreshClubTable = function () {
	let self = this;
	let sid = dispatcher.clubmap(this.clubId);
	this.logger.info('刷新亲友圈桌子:', this.clubId, sid);
	pomelo.app.rpc.club.clubRemote.refreshClubTable.toServer(sid, {
		sid: self.serverId,
		clubId: self.clubId,
		gameId: self.gameId,
		tableId: self.id,
		gameCount: self.gameCount,
		currentCount: self.currentCount,
		chairCount: self.chairCount,
		playwayId: self.playwayId,
		playwayName: self.playwayCfg.playwayName,
		gameMode: self.gameMode,
		lowerLimit: self.playwayCfg.lowerLimit,
		players: self._filterPlayersInfo(),
		playwayCfg: self.playwayCfg,
		gameStatus: self.gameStatus,
	}, null);
};

// 玩家离开
pro.removePlayer = function (uid) {
	for (const i in this.players) {
		if (this.players.hasOwnProperty(i)) {
			let player = this.players[i];
			if (player.uid == uid) {
				// this.players.splice(i, 1);
				delete this.players[i];  //这种删除数组索引不变
				return;
			}
		}
	}
	this.logger.warn('[%s] removePlayer no existed!', uid);
};

pro.getPlayerByUid = function (uid) {
	for (const i in this.players) {
		if (this.players.hasOwnProperty(i)) {
			let player = this.players[i];
			if (player.uid == uid) {
				return player;
			}
		}
	}
};

pro.getLookPlayerByUid = function (uid) {
	for (const i in this.lookPlayers) {
		if (this.lookPlayers.hasOwnProperty(i)) {
			let lookPlayer = this.lookPlayers[i];
			if (lookPlayer.uid == uid) {
				return lookPlayer;
			}
		}
	}
};

pro.getPlayerChairID = function (uid) {
	let player = this.getPlayerByUid(uid);
	if (player) {
		return player.chairID;
	}
	return null;
};

pro.getPlayers = function () {
	return this.players;	
};

pro.getDataPlayers = function () {
	let players = [];
	for (const i in this.players) {
		if (this.players.hasOwnProperty(i)) {
			let player = this.players[i];
			players.push(player.filterPlayerInfo());
		}
	}
	return players;
};

pro.getBaseDataPlayers = function () {
	let players = [];
	for (const i in this.players) {
		if (this.players.hasOwnProperty(i)) {
			let player = this.players[i];
			players.push(player.filterBasePlayerInfo());
		}
	}
	return players;
};

pro.getPlayerReadyCount = function () {
	let count = 0;
	for (const i in this.players) {
		if (this.players.hasOwnProperty(i)) {
			let player = this.players[i];
			if (player.readyState == consts.ReadyState.Ready_Yes) {
				count = count + 1;
			}
		}
	}
	return count;
};

// 检查charid是否可用
pro.checkIsCharId = function (charid) {
	if (!(charid >= 0 && charid < this.chairCount)) {
		return false;
	}

	for (const i in this.players) {
		if (this.players.hasOwnProperty(i)) {
			let user = this.players[i];
			if (user.getUserChairId() == charid) {
				return false;
			}
		}
	}
	return true;
};

// 小结算
pro.concludeGame = function (winer, scores, dataEx) {
    this.gameStatus = consts.TableStatus.READY;
	for (const i in this.players) {
		let player = this.players[i];
		let uid = player.getUserUid();
		let chairId = player.getUserChairId();
		if (player.readyState == consts.ReadyState.Ready_No) continue;  // 中途加入
		player.readyState = consts.ReadyState.Ready_No;

		// 统计
		let isWin = false;
		if (winer) {
			if (winer == chairId) {
				player.concludeCurWinCount();
				isWin = true;
			} else {
				player.concludeCurFailCount();
				isWin = false;
			}
		} else {
			if (scores[chairId] > 0) {
				player.concludeCurWinCount();
				isWin = true;
			} else {
				player.concludeCurFailCount();
				isWin = false;
			}
		}
		pomelo.app.rpc.connector.entryRemote.onUpdateGameCount.toServer(player.sid, uid, isWin, null);
		
		// 特殊游戏统计
		if (dataEx) {
			// 跑得快炸弹数量
			if (dataEx.bombTotal) {
				player.concludeCurBombCount(dataEx.bombTotal[i]);
			}
		}

		// 更新数据
		if (this.gameMode == 0) {
			// 普通厅
			let sorce = scores[chairId];
			player.concludeScore(sorce);
			let sid = dispatcher.clubmap(this.clubId);
            pomelo.app.rpc.club.clubRemote.addGameRecord.toServer(sid, uid, this.clubId, isWin, sorce, 0, null);
		} else {
			// 积分厅
			let sorce = scores[chairId];
            let payRoomNum = this.getRoomCharge(sorce);
			player.concludeScore(sorce);
			let sid = dispatcher.clubmap(this.clubId);
            pomelo.app.rpc.club.clubRemote.addGameRecord.toServer(sid, uid, this.clubId, isWin, sorce, payRoomNum, null);
		}
	}

	// 扣房卡(打完一局就扣房卡)
	if (this.currentCount == 1) {
		this._payRoomCardByLeader();
	}

	// 回放数据保存
	let commandInfo = this.tableReplay.getCommandInfo(scores);
	if (commandInfo) {
		this.tmpCurReplayCode = commandInfo.replayCode;
		this.tableReplay.replayList.push(this.tmpCurReplayCode);
		pomelo.app.rpc.record.recordRemote.addReplayInfo(null, this.tmpCurReplayCode, commandInfo, null);
		this.tableReplay.resetGameCommand();
    }
    
    // 大结算
    if (this.currentCount >= this.gameCount) {
		this.bigSettleGame();
    };
};

// 群主消耗房卡
pro._payRoomCardByLeader = function () {
	let payRoomCardNum = this.playwayCfg.roomCardNum;
	let sid = dispatcher.clubmap(this.clubId);
	pomelo.app.rpc.club.clubRemote.getClubInfo.toServer(sid, this.players[0].uid, this.clubId, null, function (resp) {
		if (resp.code == consts.ClubCode.OK) {
			let leaderId = resp.clubInfo.leaderId;
			pomelo.app.rpc.auth.authRemote.getUid2Sid(null, leaderId, function (sid) {
				if (sid) {
					pomelo.app.rpc.connector.entryRemote.onUpdateRoomCardNum.toServer(sid, leaderId, -payRoomCardNum, (roomCardNum) => {
						// 群主刷新房卡变化
						messageService.pushMessageToPlayer({
							uid: leaderId,
							sid: sid
						}, "onRefreshRoomCard", {roomCardNum: roomCardNum});
					});
				} else {
					pomelo.app.rpc.connector.entryRemote.onUpdateRoomCardNum(null, leaderId, -payRoomCardNum, null);
				}
			});
		} else {
			this.logger.error('获取俱乐部信息失败, 扣卡失败!');
		}
	});
};

// 大结算 settleType: 正常结算 65535  解散结算 charid
pro.bigSettleGame = function (settleType) {
	// 回放总计
	this._WriteReplayTotal();

	if (settleType != 0) {
        settleType = settleType || consts.INVALID_CHAIR;
    }
	this.sendMessage(null, 'onBigSettleGame', {
		code: consts.Code.OK,
		data: {
			settleType: settleType,
			roomId: this.id,
			currentCount: this.currentCount,
			totalCount: this.gameCount,
			playwayName: this.playwayCfg.playwayName,
			time: Date.now(),
			players: this._filterPlayersInfo(),
		}
	});
	this.clearTable()
};

pro._WriteReplayTotal = function () {
	// 回放合计总数据
	// let replayCode = this.tmpCurReplayCode;
	// if (replayCode == 0) {
	// 	return;
	// }

	// for (const i in this.players) {
	// 	if (this.players.hasOwnProperty(i)) {
	// 		let player = this.players[i];
	// 		let uid = player.getUserUid();
	// 		let user = entityManager.getEntity(uid);
	// 		if (user) {
	// 			user.replayList = this._getReplayList(user.replayList, replayCode);
	// 		} else {
	// 			pomelo.app.db.find("Avatar", {"_id": uid}, null, null, (err, docs) => {
	// 				if (err) {
	// 					console.error("db find user error" + err);
	// 					return;
	// 				}
	// 				if (docs.length == 0) {
	// 					console.error("db find user[%d] no exist.", uid);
	// 					return;
	// 				} else {
	// 					let replayList = docs[0].replayList || [];
	// 					replayList = this._getReplayList(replayList, replayCode);
	// 					let user = pomelo.app.db.getModel("user");
	// 					user.update({_id: uid}, {replayList: replayList}, {upsert: true}, (err, product) => {
	// 						if (err) {
	// 							console.error("db update user error: " + err);
	// 							return;
	// 						}
	// 						console.info("db user add replayCode[%d] success.", replayCode);
	// 					});
	// 				}
	// 			})
	// 		}
	// 	}
	// }
};

pro._getReplayList = function (srcReplayList, replayCode) {
	if (!srcReplayList || replayCode == 0) {
		this.logger.warn(srcReplayList, replayCode);
		return null;
	}

	// 只保存3天数据(0-2 今天，昨天，前天)
	if (!srcReplayList[0] || !srcReplayList[0].dtime || utils.judgeTime(srcReplayList[0].dtime) != 0) {
		srcReplayList.unshift({
			dtime: Date.now(),
			list: [replayCode],
		});
	} else {
		srcReplayList[0].list.unshift(replayCode);
		if (srcReplayList[0].list.length > consts.ReplayMaxNum) {
			srcReplayList[0].list.splice(consts.ReplayMaxNum, srcReplayList[0].list.length - consts.ReplayMaxNum);
		}
	}
	if (srcReplayList.length > 3) {
		srcReplayList.splice(3, srcReplayList.length-3);
	}
	this.logger.info('添加大局回放码:', replayCode);
	return srcReplayList;
};

// 获取房费费用 0不扣 1大赢家 2所有赢家 3AA制
pro.getRoomCharge = function (sorce) {
	let roomValue = 0;
	if(this.payMode == 1 || this.payMode == 2) {
		if (sorce >= this.payLimit) {
			if (this.isPercentage) {
				roomValue = sorce * this.payCount * 0.01;
			} else {
				roomValue = this.payCount;
			}
		}
	} else if(this.payMode == 3) {
		roomValue = this.payCount;
	}
	return roomValue;
};

// 游戏准备
pro.readyGame = async function (next, uid) {
    if (this.gameStatus == consts.TableStatus.FREE) {
        next(null, {code: consts.ReadyGameCode.GAME_END});
        return;
	}
	
	if (this.gameStatus == consts.TableStatus.START) {
        next(null, {code: consts.ReadyGameCode.GAME_START});
        return;
    }

    let player = this.getPlayerByUid(uid);
    if (!player) {
        next(null, {code: consts.ReadyGameCode.USER_NO_EXIST});
        return;
    }

    if (player.getPlayerReadyState() == consts.ReadyState.Ready_Yes) {
        next(null, {code: consts.ReadyGameCode.GAME_READYED});
        return;
	}
	
    next(null, {code: consts.ReadyGameCode.OK});
    player.setPlayerReadyState(consts.ReadyState.Ready_Yes);
    let readyCount = this.getPlayerReadyCount();
    let playerCount = this.getChairCount();
    if (readyCount >= playerCount) {
        // 游戏开始
        this._iStartGame();
    } else{
        // 推送准备状态
        this.sendMessage(null, 'onReadyGame', {
            wChairID: player.chairID,
        });
    }
};

// 游戏开始
pro._iStartGame = function () {
	this.gameStatus = consts.TableStatus.START;
	this.currentCount = this.currentCount + 1;
	this.logger.info('当前局数:%d/%d.', this.currentCount, this.gameCount);
	this._removeNoReadyPlayer();
	this.refreshClubTable();
	this.tableReplay.createReplayCode();
	this.gameCom.onGameStart();
};

// 把玩家列表中没有准备的玩家移出
pro._removeNoReadyPlayer = function () {
	let players = this.getPlayers();
	for (const i in players) {
		let user = players[i];
		if (user.readyState != consts.ReadyState.Ready_Yes){
			let wChairID = user.getUserChairId();
			this.sendMessage(null, 'onLeaveRoom', {wChairID: wChairID});
			pomelo.app.rpc.auth.authRemote.removeGameInfo(null, user.uid, null);
			pomelo.app.rpc.connector.entryRemote.onClearTable.toServer(user.sid, user.uid, null);
			this.removePlayer(user.uid);
		}
	}
};

// 离开房间
pro.leaveRoom = function (next, uid) {
	let isLookPlayer = this.getLookPlayer(uid);
	if (isLookPlayer) {
		// 旁观玩家离开
		this.removeLookPlayer(uid);
		pomelo.app.rpc.auth.authRemote.removeGameInfo(null, uid, null);
		pomelo.app.rpc.connector.entryRemote.onClearTable.toServer(isLookPlayer.sid, isLookPlayer.uid, null);
		next(null, {code: consts.LeaveRoomCode.OK});

	} else {
		// 牌桌玩家离开
		let user = this.getPlayerByUid(uid);
		if ((this.gameStatus === consts.TableStatus.START && user.readyState == consts.ReadyState.Ready_Yes) || 
			(this.gameStatus == consts.TableStatus.READY && this.currentCount > 0 && this.gameId != 25)) {
			next(null, {code: consts.LeaveRoomCode.START_GAME_NO_LEAVE});
			return;
		}

		let wChairID = this.getPlayerChairID(uid);
		if (this.getPlayerCount() === 1) {
			// 房间只剩最后一人解散房间
			this.clearTable();
			next(null, {code: consts.LeaveRoomCode.LEAVE_ROOM_DISSOLVE});
		} else if(this.gameId == 25 && wChairID == 0) {
			// 25游戏房主离开结算解散房间
			this.bigSettleGame(0);
			next(null, {code: consts.LeaveRoomCode.LEADER_LEAVE_ROOM});
		} else {
			// 离开房间
			this.sendMessage(null, 'onLeaveRoom', {wChairID: wChairID});
			next(null, {code: consts.LeaveRoomCode.OK});
			pomelo.app.rpc.auth.authRemote.removeGameInfo(null, uid, null);
			pomelo.app.rpc.connector.entryRemote.onClearTable.toServer(user.sid, user.uid, null);
			this.removePlayer(uid);
			this.refreshClubTable();
		}
	}
};

// 后台客户端操作
pro.backDissolveGame = function (next) {
	let msg = {
		tableId: this.id,
		playwayId: this.playwayCfg.id,
		tableUsers: this.getBaseDataPlayers()
	};
	next(null, null, msg);

	this.sendMessage(null, 'onDissolveRoom', {
		clubId: this.clubId,
		tableId: this.id,
	});
	this.clearTable();
};

// 解散游戏
pro.dissolveGame = function (next, uid, dissolveType) {
	// 牌桌已经回收
	if (this.gameStatus == consts.TableStatus.FREE) {
		next(null, {code: consts.ERROR.TABLE_RECYCLED});
		return;
	}

	// 后台操作
	if (!uid) {
		this.backDissolveGame(next);
		return;
	}

	if (this.gameId == 25) {
		next(null, {code: consts.FAIL});
		return;
	}

	let isDissove = false;
	if (dissolveType == consts.DissolveState.Diss_Send) {
		//1 发起解散
		for (const key in this.players) {
			if (this.players.hasOwnProperty(key)) {
				const user = this.players[key];
				if (uid == user.uid ) {
					user.setPlayerDissolveState(consts.DissolveState.Diss_Send);
				} else{
					user.setPlayerDissolveState(consts.DissolveState.Diss_Undone);
				}
			}
		}
		this._startSchedulTime(consts.AutoDissolveTime);
	} else if(dissolveType == consts.DissolveState.Diss_Agree) {
		//2 同意
		isDissove = true;
		for (const key in this.players) {
			if (this.players.hasOwnProperty(key)) {
				const user = this.players[key];
				if (uid == user.uid ) {
					user.setPlayerDissolveState(consts.DissolveState.Diss_Agree);
				} else {
					if (user.dissolveState == consts.DissolveState.Diss_Undone) {
						isDissove = false;
					}
				}
			}
		}
		if (isDissove) {
			this._clearSchedulTime();
		}
	} else if(dissolveType == consts.DissolveState.Diss_Init) {
		//0 拒绝
		for (const key in this.players) {
			if (this.players.hasOwnProperty(key)) {
				const user = this.players[key];
				user.setPlayerDissolveState(consts.DissolveState.Diss_Init);
			}
		}
		this._clearSchedulTime();
	} else{
		// 未知情况
		this.logger.error('dissove dissolveType=%d no exist!', dissolveType);
		return;
	}
	next(null, {code: consts.OK});
	
	if (isDissove) {
		let sendUser = consts.INVALID_CHAIR;
		for (const key in this.players) {
			if (this.players.hasOwnProperty(key)) {
				const user = this.players[key];
				if (user.dissolveState == consts.DissolveState.Diss_Send) {
					sendUser = user.getUserChairId();
					break
				}
			}
		}
		this.bigSettleGame(sendUser);
	} else {
		let msg = {
			clubId: this.clubId,
			tableId: this.id,
			dissolveData: this._getDissolveInfoData(),
			autoRemainTime: this.remainDissolveTime
		}
		this.sendMessage(null, 'onDissolveRoom', msg);
	};
};

// 自动解散定时器开启
pro._startSchedulTime = function (time) {
	let self = this;
    self._clearSchedulTime();
    self._setDissolveRemainTime(time);
	self.autoDissSchedule = setInterval(function () {
		time = time - 1;
		self._setDissolveRemainTime(time);
		if (time <= 0) {
			time = 0;
			self._clearSchedulTime();
			let sendUser = consts.INVALID_CHAIR;
			for (let i = 0; i < self.players.length; i++) {
				let user = self.players[i];
				if (user.dissolveState == consts.DissolveState.Diss_Send) {
					sendUser = i;
					break
				}
			}
			self.bigSettleGame(sendUser);
		}
	}, 1000);
};

// 清理定时器
pro._clearSchedulTime = function () {
	if (this.autoDissSchedule) {
		clearInterval(this.autoDissSchedule);
		this.autoDissSchedule = null;
		this._setDissolveRemainTime(0);
	}
};

// 设置解散剩余时间
pro._setDissolveRemainTime = function (remainTime) {
	this.remainDissolveTime = remainTime;
};

// 得到解散数据
pro._getDissolveInfoData = function () {
	let players = this.getDataPlayers();
	let data = [];
	for (let i = 0; i < players.length; i++) {
		const user = players[i];
		let dissData = {};
		dissData.uid = user.uid;
		dissData.name = user.name;
		dissData.avatarUrl = user.avatarUrl;
		dissData.chairID = user.chairID;
		dissData.dissolveState = user.dissolveState;
		data.push(dissData);
	}
	return data;
};

// 获取服务器配置信息
pro._getServerCfg = function () {
	// let tables = pomelo.app.getServersByType('table');
	// for (let i = 0; i < tables.length; i++) {
	// 	let res = tables[i];
	// 	if (res.id == this.serverId) {
	// 		return res;
	// 	}
	// }
	// return null;
};

// 聊天交互
pro.tableChat = function (next, uid, targetId, content) {
	let user = this.getPlayerByUid(uid);
	if (!user) {
		next(null, {code: consts.TableChatCode.USER_NO_EXIST});
		return;
	}

	if (content.length > 50) {
		next(null, {code: consts.TableChatCode.CONTENT_TOO_LONG});
		return;
	}
	next(null, {code: consts.TableChatCode.OK});
	
	this.sendMessage(null, 'onTableChat', {
		operateId: uid,
		targetId: targetId,
		content: content,
	});
};

// 获取人物信息
pro.getPersonInfo = function (next, targetId) {
	let user = this.getPlayerByUid(targetId);
	if (!user) {
		next(null, {code: consts.Code.FAIL});
		return;
	}

	next(null, {
		code: consts.Code.OK,
		info: {
			id: user.uid,
			name: user.name,
			gender: user.gender,
			avatarUrl: user.avatarUrl,
			gameCount: user.gameCount,
			winCount: user.winCount,
			failCount: user.failCount,
		}
	});
};

// 手动开始游戏(牛牛)
pro.handStartGame = function (next, uid) {
	if (this.gameStatus == consts.TableStatus.START) {
		next(null, {code: consts.HandStartGameCode.GAME_STARTING});
		return;
	}

	let user = this.getPlayerByUid(uid);
	if (!user) {
		next(null, {code: consts.HandStartGameCode.USER_NO_EXIST});
		return;
	}

	if (user.chairID != 0) {
		// 只有chairID为零的玩家才能手动开始
		next(null, {code: consts.HandStartGameCode.USER_PERMISSION_DENIED});
		return;
	}

	let readyCount = this.getPlayerReadyCount();
	let limitCount = this.playwayCfg.gameParameter.bLowerPlayerCount;
	if (readyCount < limitCount) {
		next(null, {code: consts.HandStartGameCode.CURRENT_LESS_PEOPLE});
		return;
	}

	next(null, {code: consts.HandStartGameCode.OK});
	this._iStartGame();
};

// 旁观玩家入座
pro.lookPlayerSeat = async function (next, uid, seatId) {
	let user = this.getLookPlayer(uid);
	if (!user) {
		next(null, {code: consts.LookPlayerCode.LOOKPLAYER_NO_EXIST});
		return;
	}

	// 人数已满
	if (this.getPlayerCount() >= this.getChairCount()) {
		next(null, {code: consts.LookPlayerCode.ROOM_FULL_PEOPLE});
		return;
	}

	// 座位号错误
	if (!this.checkIsCharId(seatId)) {
		next(null, {code: consts.LookPlayerCode.SEAT_ID_NO_USE});
		return;
	}

	this.removeLookPlayer(uid);
	this.addPlayer(user, seatId);
	next(null, {code: consts.LookPlayerCode.OK});
};