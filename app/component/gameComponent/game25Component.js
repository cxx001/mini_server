/**
 * Date: 2020/3/2
 * Author: admin
 * Description: 拼十
 */
'use strict';
let pomelo = require('pomelo');
var lodash = require('lodash');
let util = require('util');
let Component = require('../component');
let consts = require('../../common/consts');
let GameLogic = require('./game25Logic');

let BankerDt = 5.5;       	  //抢庄倒计时
let BettingDt = 1.5 + 5.5; 	  //下注倒计时(抢庄特效时间1.5)
let ShowCardDt = 10.5;  	  //明牌倒计时

let Game25Component = function (entity) {
    Component.call(this, entity);
};

util.inherits(Game25Component, Component);
module.exports = Game25Component;

let pro = Game25Component.prototype;

pro.init = function (opts) {
	this.playwayCfg = {};
	this.gameParameter = {};
	this.bankerUser = consts.INVALID_CHAIR;
	this.dtime = 0; // 计时器倒计时
	this.gameStep = 0; // 游戏阶段 0:游戏未开始 1:等待抢庄阶段 2:等待下注阶段 3:等待明牌阶段
	this.stuCompareCard = {}; // 记录玩家牌型数据
	this.handCardData = []; // 玩家手牌
};

pro.onSendParameter = function (user, playwayCfg) {
	this.playwayCfg = playwayCfg;
	let gameParameter = playwayCfg.gameParameter;
    let param = {
		bLowerPlayerCount: gameParameter.bLowerPlayerCount,
        bPlayerCount: gameParameter.bPlayerCount,
        bGameCount: gameParameter.bGameCount,
    }
    this.gameParameter = param;
	this.entity.setChairCount(this.gameParameter.bPlayerCount);
	this.entity.setGameCount(this.gameParameter.bGameCount);
	this.entity.sendMessage(user.uid, 'onSendParameter', this.playwayCfg);
};

pro.onSendGameScene = function(user, gameStatus) {
	let sceneData = null;
	let wChairID = this.entity.getPlayerChairID(user.uid)
	if (wChairID != 0 && !wChairID) {
		wChairID = consts.INVALID_CHAIR;
	}

	if (gameStatus == consts.TableStatus.START) {
		let tempHandCardData = [];
		if (wChairID != consts.INVALID_CHAIR) {
			// 中途加入玩家没有手牌
			if (!this.isHalfJoin(user.uid)) {
				tempHandCardData = this.handCardData[wChairID].slice(0);
				if (user.openid.indexOf("robot_") == -1 && this.gameStep != 3 ) {
					tempHandCardData[4] = 0;
				}
			}
		}
		sceneData = {
			gameStatus: gameStatus,
			tableId: this.entity.id,
            players: this.entity.getDataPlayers(),          // 入座但没有玩当前局的玩家准备状态为未准备
            gameCount: this.entity.gameCount,
			currentCount: this.entity.currentCount,
			wChairID: wChairID,                             // 没有wChairID为旁观用户
			bankerUser: this.bankerUser,
			dtime: Math.floor(this.dtime),
			gameStep: this.gameStep,
			stuCompareCard: this.stuCompareCard,
			handCardData: tempHandCardData,                // 中途加入玩家没有手牌数据
		};
	} else {
		sceneData = {
			gameStatus: gameStatus,
			tableId: this.entity.id,
            players: this.entity.getDataPlayers(),
            gameCount: this.entity.gameCount,
			currentCount: this.entity.currentCount,
			wChairID: wChairID,
		}
	}
	this.entity.sendMessage(user.uid, 'onSendGameScene', sceneData);
};

// 是否是中途加入的玩家
pro.isHalfJoin = function (uid) {
	let wChairID = this.entity.getPlayerChairID(uid);
	if (this.handCardData[wChairID]) {
		return false;
	}
	return true;
};

pro.onGameStart = function () {
	//混乱扑克
	let cardData = GameLogic.RandCardList();

	//分发扑克
	var handCardData = [];
	var pos = 0;
	var curSendCount = 5;
	let players = this.entity.getPlayers();
	for (const key in players) {
		if (players.hasOwnProperty(key)) {
			const user = players[key];
			let wChairID = user.getUserChairId();
			let carditem = cardData.slice(pos, pos + curSendCount);
			handCardData[wChairID] = carditem.slice(0);
			pos = pos + curSendCount;
			this.handCardData[wChairID] = carditem.slice(0);
		}
	}
	this.entity.logger.info('玩家手牌数据:', handCardData);

	// 通知发牌
	for (const i in players) {
		let user = players[i];
		let wChairID = user.getUserChairId();
		let msg = {
			cbCardData: handCardData[wChairID],
			wChairID: wChairID
		}
		if (!user.isRobot()) {
			msg.cbCardData[4] = 0;
		}
		this.entity.sendMessage(user.uid, 'onStartGame', msg);
		this.entity.sendReplay('onStartGame', msg);
	}
	let lookPlayers = this.entity.lookPlayers;
	for (const key in lookPlayers) {
		if (lookPlayers.hasOwnProperty(key)) {
			const user = lookPlayers[key];
			this.entity.sendMessage(user.uid, 'onStartGame', {});
		}
	}

	// 抢庄倒计时
	this.gameStep = 1;
	this._startSchedule(BankerDt, function () {
		for (const i in players) {
			let user = players[i];
			if (this.isHalfJoin(user.uid)) continue;
			if (user.getMultiple() == -1) {
				user.setMultiple(0);
				let msg = {
					wChairID: user.getUserChairId(),
					bMultiple: 0,
				}
				this.entity.sendMessage(null, 'onGrabBanker', msg);
			}
		}
		this.confirmBanker();
	}.bind(this));
};

pro._startSchedule = function(dt, cb) {
	this.dtime = dt;
	this._stopSchedule();
	this._schedule = setInterval(function () {
		this.dtime = this.dtime - 0.5;
		if (this.dtime <= 0) {
			this.dtime = 0;
			this._stopSchedule();
			cb();
		}
    }.bind(this), 500);
};

pro._stopSchedule = function() {
	if (this._schedule) {
		clearInterval(this._schedule);
		this._schedule = null;
	}
};

// 牛牛抢庄
pro.grabBanker = function (next, uid, bMultiple) {
	let user = this.entity.getPlayerByUid(uid);
	if (!user) {
		next(null, {code: consts.GrabBankerCode.USER_NO_EXIST});
		return;
	}

	if (typeof bMultiple !== 'number' || bMultiple > 3 || bMultiple < 0) {
		next(null, {code: consts.GrabBankerCode.SET_Multiple_ERROR});
		return;
	}

	if (user.getMultiple() != -1) {
		next(null, {code: consts.GrabBankerCode.REPEAT_SETTING});
		return;
	}

	if (this.isHalfJoin(user.uid)) {
		next(null, {code: consts.GrabBankerCode.HALF_JOIN_GAME});
		return;
	}

	user.setMultiple(bMultiple);
	next(null, {code: consts.GrabBankerCode.OK});
	let msg = {
		wChairID: this.entity.getPlayerChairID(uid),
		bMultiple: bMultiple,
	}
	this.entity.sendMessage(null, 'onGrabBanker', msg);

	// 是否都已经设置
	let isAllControl = true;
	let players = this.entity.getPlayers();
	for (const i in players) {
		let user = players[i];
		if (this.isHalfJoin(user.uid)) continue;
		if (user.getMultiple() == -1) {
			isAllControl = false;
			break;
		}
	}

	if (isAllControl) {
		this._stopSchedule();
		this.confirmBanker();
	}
};

// 确定庄家
pro.confirmBanker = function () {
	let maxVal = -1;
	let maxValUser = [];
	let players = this.entity.getPlayers();
	let multipleList = {};
	for (const i in players) {
		let user = players[i];
		if (this.isHalfJoin(user.uid)) continue;
		multipleList[user.chairID] = user.getMultiple();
		if (user.getMultiple() > maxVal) {
			maxVal = user.getMultiple();
			maxValUser = [];
			maxValUser.push(user);
		} else if(user.getMultiple() == maxVal) {
			maxValUser.push(user);
		}
	}

	// 倍数最大相同中随机一个坐庄
	let randUser = lodash.sample(maxValUser);
	multipleList[randUser.chairID] = (multipleList[randUser.chairID] == 0) ? 1:multipleList[randUser.chairID];
	randUser.setMultiple(multipleList[randUser.chairID]);
	this.bankerUser = randUser.chairID;
	let msg = {
		wBankerUser: this.bankerUser,
		multipleList: multipleList,
	}
	this.entity.sendMessage(null, 'onConfirmBanker', msg);
	this.entity.sendReplay('onConfirmBanker', msg);
	
	// 下注倒计时
	this.gameStep = 2;
	this._startSchedule(BettingDt, function () {
		for (const i in players) {
			let user = players[i];
			if (this.isHalfJoin(user.uid)) continue;
			if (user.getBetting() == 0) {
				user.setBetting(1);
				let msg = {
					wChairID: user.getUserChairId(),
					bBetting: 1,
				}
				this.entity.sendMessage(null, 'onBetting', msg);
			}
		}
		this.achieveBetting();
	}.bind(this));
};

// 牛牛下注
pro.betting = function(next, uid, bBetting) {
	let user = this.entity.getPlayerByUid(uid);
	if (!user) {
		next(null, {code: consts.BettingCode.USER_NO_EXIST});
		return;
	}

	if (typeof bBetting !== 'number' || bBetting > 4 || bBetting < 1) {
		next(null, {code: consts.BettingCode.SET_BETTING_ERROR});
		return;
	}

	if (user.getBetting() != 0) {
		next(null, {code: consts.BettingCode.REPEAT_SETTING});
		return;
	}

	let wChairID = this.entity.getPlayerChairID(uid);
	if (wChairID == this.bankerUser) {
		next(null, {code: consts.BettingCode.ROOMBANKER_NO_COTROLE});
		return;
	}

	if (this.isHalfJoin(user.uid)) {
		next(null, {code: consts.BettingCode.HALF_JOIN_GAME});
		return;
	}

	user.setBetting(bBetting);
	next(null, {code: consts.BettingCode.OK});
	let msg = {
		wChairID: wChairID,
		bBetting: bBetting,
	}
	this.entity.sendMessage(null, 'onBetting', msg);

	// 是否都已经操作
	let isAllControl = true;
	let players = this.entity.getPlayers();
	for (const i in players) {
		let user = players[i];
		if (this.isHalfJoin(user.uid)) continue;
		if (user.getBetting() == 0 && user.getUserChairId() != this.bankerUser) {
			isAllControl = false;
			break;
		}
	}

	if (isAllControl) {
		this._stopSchedule();
		this.achieveBetting();
	}
};

// 下注完成
pro.achieveBetting = function () {
	// 发最后一张牌
	let players = this.entity.getPlayers();
	for (const i in players) {
		let user = players[i];
		if (this.isHalfJoin(user.uid)) {
			this.entity.sendMessage(user.uid, 'onSendLastCard', {});
			continue;
		}
		let wChairID = user.getUserChairId();
		let msg = {
			cbCardData: this.handCardData[wChairID],
			wChairID: wChairID
		}
		this.entity.sendMessage(user.uid, 'onSendLastCard', msg);
	}

	let lookPlayers = this.entity.lookPlayers;
	for (const key in lookPlayers) {
		if (lookPlayers.hasOwnProperty(key)) {
			const user = lookPlayers[key];
			this.entity.sendMessage(user.uid, 'onSendLastCard', {});
		}
	}

	// 明牌阶段
	this.gameStep = 3;
	this._startSchedule(ShowCardDt, function () {
		for (const i in players) {
			let user = players[i];
			if (this.isHalfJoin(user.uid)) continue;
			if (!user.getShowCard()) {
				user.setShowCard(true);
				let wChairID = user.getUserChairId();
				this._broadcastShowCard(wChairID);
			}
		}
		this.settleSorces();
	}.bind(this));
};

// 明牌请求
pro.showCard = function (next, uid) {
	let user = this.entity.getPlayerByUid(uid);
	if (!user) {
		next(null, {code: consts.ShowCardCode.USER_NO_EXIST});
		return;
	}

	if (user.getShowCard()) {
		next(null, {code: consts.ShowCardCode.USER_SHOWCARDED});
		return;
	}

	if (this.isHalfJoin(user.uid)) {
		next(null, {code: consts.ShowCardCode.HALF_JOIN_GAME});
		return;
	}

	user.setShowCard(true);
	next(null, {code: consts.ShowCardCode.OK});

	// 向所有人推送
	let wChairID = this.entity.getPlayerChairID(uid);
	this._broadcastShowCard(wChairID);

	// 是否都已经操作
	let isAllControl = true;
	let players = this.entity.getPlayers();
	for (const i in players) {
		let user = players[i];
		if (this.isHalfJoin(user.uid)) continue;
		if (!user.getShowCard()) {
			isAllControl = false;
			break;
		}
	}

	if (isAllControl) {
		this._stopSchedule();
		this.settleSorces();
	}
};

pro._broadcastShowCard = function (wChairID) {
	let stuCompareCard = GameLogic.AnalysebCardData(this.handCardData[wChairID]);
	this.stuCompareCard[wChairID] = stuCompareCard;
	let msg = {
		wChairID: wChairID,
		cbCardData: stuCompareCard.cbCardData,
		cbValueType: stuCompareCard.cbValueType,   // 牌型
		cbFanBei: stuCompareCard.cbFanBei,   // 牌型倍数
		cbMaxValue: stuCompareCard.cbMaxValue,
		cbLastCardData: stuCompareCard.cbLastCardData,
	}
	this.entity.sendMessage(null, 'onShowCard', msg);
};

// 结算
pro.settleSorces = function () {
	let scores = this._broadcastSettleSorce();
	this.entity.concludeGame(null, scores, null);
	this._resetCurrentData();
};

// 重置房间数据
pro._resetCurrentData = function () {
	this.bankerUser = consts.INVALID_CHAIR;
	this.dtime = 0; // 计时器倒计时
	this.gameStep = 0; // 游戏阶段 0:游戏未开始 1:发牌、抢庄阶段 2:下注、发剩余一张牌阶段 3:明牌、结算阶段
	this.stuCompareCard = {}; // 记录玩家牌型数据
	this.handCardData = []; //玩家手牌
	
	let players = this.entity.getPlayers();
	for (const key in players) {
		if (players.hasOwnProperty(key)) {
			const user = players[key];
			user.resetNNData();
		}
	}
};

// 结算分数计算
pro._broadcastSettleSorce = function () {
	let sorceCell = this.playwayCfg.sorceCell;
	let players = this.entity.getPlayers();
	let scores = {};
	
	// 算分
	let bankerStruct = this.stuCompareCard[this.bankerUser];
	let bankerUser = players[this.bankerUser];
	scores[this.bankerUser] = 0;
	for (const key in players) {
		const user = players[key];
		if (this.isHalfJoin(user.uid)) continue;
		let wChairID = user.getUserChairId();
		if (wChairID == this.bankerUser) continue;
		let nextStruct = this.stuCompareCard[wChairID];
		let betting = user.getBetting();
		let multiple = bankerUser.getMultiple();
		if (bankerStruct.cbValueType > nextStruct.cbValueType) {
			scores[wChairID] = -sorceCell * bankerStruct.cbFanBei * betting * multiple;
			scores[this.bankerUser] = scores[this.bankerUser] - scores[wChairID];
		} else if(bankerStruct.cbValueType == nextStruct.cbValueType) {
			let bankerCardValue = bankerStruct.cbMaxValue&0x0F;
			let bankerCardColor = bankerStruct.cbMaxValue&0xF0;
			let nextCardValue = nextStruct.cbMaxValue&0x0F;
			let nextCardColor = nextStruct.cbMaxValue&0xF0;
			if (bankerCardValue > nextCardValue || ((bankerCardValue == nextCardValue) && (bankerCardColor > nextCardColor))) {
				scores[wChairID] = -sorceCell * bankerStruct.cbFanBei * betting * multiple;
				scores[this.bankerUser] = scores[this.bankerUser] - scores[wChairID];
			} else {
				scores[wChairID] = sorceCell * nextStruct.cbFanBei * betting * multiple;
				scores[this.bankerUser] = scores[this.bankerUser] - scores[wChairID];
			}
		} else {
			scores[wChairID] = sorceCell * nextStruct.cbFanBei * betting * multiple;
			scores[this.bankerUser] = scores[this.bankerUser] - scores[wChairID];
		}
	}
	
	// 广播
	this.entity.sendMessage(null, 'onSettlement', scores);
	this.entity.sendReplay('onSettlement', scores);
	
	return scores;
};