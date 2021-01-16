'use strict';
var pomelo = require('pomelo');
var entityFactory = require('../../../entity/entityFactory');
var entityManager = require('../../../services/entityManager');
var consts = require('../../../common/consts');
var logger = require('pomelo-logger').getLogger('game', __filename);
var dispatcher = require('../../../util/dispatcher');

module.exports = function(app) {
    return new Remote(app);
};

let Remote = function(app) {
    this.app = app;
};

let pro = Remote.prototype;

pro.enter = async function (msg, cb) {
    let user = msg.user;  //用户信息
    let clubId = msg.clubId; // 俱乐部id
	let playwayId = msg.playwayId; // 创建牌桌
	let tableId = msg.tableId; // 加入牌桌
	let isLookPlayer = msg.isLookPlayer; // 是否是旁观玩家

    if (isLookPlayer) {
		this.joinTable(user, tableId, isLookPlayer, cb);
		return;
	}

	// 是否已经在牌桌
	let resp = await this.isCheckGameing(user.uid);
	if (resp.code == consts.GameStatus.GAME_PLAYING) {
		tableId = resp.gameInfo.tableId;
		this.joinTable(user, tableId, isLookPlayer, cb);
	} else {
		//创房
		if (!tableId || tableId == 0) {
			if (this.app.tableList.size <= 0) {
				logger.warn('serverId[%s] is full! please add new server.', app.get('serverId'));
				cb({code: consts.EnterTableCode.GAME_TABLE_FULL});
				return;
			}
			
			// 获取玩法配置
			let resp = await this.getClubPlaywayInfo(user.uid, clubId, playwayId);
			if (resp.code != consts.ClubCode.OK) {
				logger.error('获取不到玩法配置信息!', clubId, playwayId);
				return;
			}

			let playwayCfg = resp.playway;
			// 随机分配空桌子
			let index = Math.floor(Math.random() * 10000) % this.app.tableList.size;
			let tableId = [...this.app.tableList][index];
			this.app.tableList.delete(tableId);
			let tableEntity = entityManager.getEntity(tableId);
			if (!tableEntity) {
				logger.error('createTable fail! no exist table Entity = %d', tableId);
				return;
			}
			cb({
				code: consts.EnterTableCode.OK,
				tableId: tableId
			});
			tableEntity.createTable(user, playwayCfg);
			logger.info('avatar[%d] create table[%d] success.', user.uid, tableId);
		} else {
			this.joinTable(user, tableId, isLookPlayer, cb);
		}
	}
};

pro.joinTable = async function (user, tableId, isLookPlayer, cb) {
	let tableEntity = entityManager.getEntity(tableId);
	if (!tableEntity || tableEntity.gameStatus == consts.TableStatus.FREE) {
		cb({code: consts.EnterTableCode.NO_EXIST_ROOM});
		return;
	}

	isLookPlayer = isLookPlayer || tableEntity.getLookPlayer(user.uid);
	if (!isLookPlayer) {
		let player = tableEntity.isPlayerInRoom(user.uid);
		if (!player) {
			if (tableEntity.getPlayerCount() >= tableEntity.getChairCount()) {
				cb({code: consts.EnterTableCode.FULL_PLAYER_ROOM});
				return;
			}
		}
	} else {
		tableEntity.setLookPlayer(user);
	}
	
	cb({
		code: consts.EnterTableCode.OK,
		tableId: tableId
	});
	tableEntity.addPlayer(user);
	logger.info('avatar[%d] join table[%d] success.', user.uid, tableId);
};

// 是否已经在游戏中
pro.isCheckGameing = function (uid) {
    return new Promise(function (resolve, reject) {
		pomelo.app.rpc.auth.authRemote.getGameInfo(null, uid, (resp) => {
			resolve(resp);
		})
    })
};

// 获取俱乐部某玩法信息
pro.getClubPlaywayInfo = function (uid, clubId, playwayId) {
	return new Promise(function (resolve, reject) {
		let sid = dispatcher.clubmap(clubId);
		pomelo.app.rpc.club.clubRemote.getClubSinglePlayway.toServer(sid, uid, clubId, playwayId, (resp) => {
			resolve(resp);
		});
    })
};