/**
 * Date: 2019/9/25
 * Author: admin
 * Description:
 */

'use strict';
let pomelo = require('pomelo');
let utils = require('../util/utils');
let entityMgr = require('../services/entityManager');
let logger = require('pomelo-logger').getLogger('game', __filename);
let consts = require('../common/consts');

var pro = module.exports;

pro.retUpdateLogin = function (app, agent, msg, cb) {
	if (msg.canLogin) {
		app.set('canLogin', true);
	}
	else {
		app.set('canLogin', false);
	}
	utils.invokeCallback(cb, null);
};

pro.retKick = function (app, agent, msg, cb) {
	let uid = msg.uid;
	let kickList = [];
	if (!uid) {
		let avatars = entityMgr.getEntitiesByClass('Avatar');
		for (let avatar of avatars) {
			kickList.push(avatar.id);
			avatar.kickOffline();
		}
	}
	else {
		let entity = entityMgr.getEntity(uid);
		if (entity) {
			kickList.push(uid);
			entity.kickOffline();
		}
	}
	cb(null, kickList);
};

pro.retSendProps = function (app, agent, msg, cb) {
	let avatar = entityMgr.getEntity(msg.id);
	if (avatar) {
		if (msg.proptype == 0) {
			// 元宝
			// let sum = avatar.gold + parseInt(msg.nums);
			// let num = sum > 0 ? sum : 0;
			// avatar.updataUserGold(num);
		}
	}
	utils.invokeCallback(cb, null);
};

pro.retCreateClub = function (app, agent, msg, cb) {
	msg = msg.data;
	let avatar = entityMgr.getEntity(msg.uid);
	if (avatar) {
		avatar.club.createClub(msg.clubName, function (error, resp) {
			utils.invokeCallback(cb, resp);
		});
	} else {
		logger.warn('创建亲友圈角色必须是在线状态!');

		// app.db.find("Avatar", {"_id": msg.uid}, null, null, function (err, docs) {
		// 	if (err) {
		// 		logger.error("db find avatar error" + err);
		// 		return;
		// 	}
		// 	if (docs.length == 0) {
		// 		logger.info("avatar[%d] no exist.", msg.uid);
		// 		return;
		// 	}
	
		// 	let doc = docs[0];
		// 	let userInfo = {
		// 		uid: msg.uid,
		// 		name: doc.name,
		// 		gender: doc.gender,
		// 		avatarUrl: doc.avatarUrl,
		// 		gold: doc.gold,
		// 		lastOfflineTime: doc.lastOfflineTime
		// 	}	
		// 	pomelo.app.rpc.club.clubRemote.createClub(null, msg.uid, msg.clubName, userInfo, function (resp) {
		// 		utils.invokeCallback(cb, resp);
		// 	});
		// });
	}
};

pro.retSetClubPlayway = function (app, agent, msg, cb) {
	let clubId = msg.data.clubId;
	app.clubStub.setClubPlayway(null, clubId, msg.data, function (resp) {
		utils.invokeCallback(cb, resp);
	});
};

pro.retDissolveGame = function (app, agent, msg, cb) {
	let tableId = msg.tableId;
	if (tableId == 0) {
		let tables = entityMgr.getEntitiesByClass('Table');
		let list = [];
		for (let table of tables) {
			if (table.gameStatus == consts.TableStatus.FREE) {
				continue;
			}
			table.dissolveGame(function (err, resp) {
				list.push(resp);
			});
		}
		cb(null, list);
	} else {
		let table = entityMgr.getEntity(tableId);
		if (table) {
			table.dissolveGame(function (err, resp) {
				cb(null, resp);
			});
		} else {
			cb(tableId + '桌子不存在.');
		}
	}
};