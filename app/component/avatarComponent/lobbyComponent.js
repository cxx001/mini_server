/**
 * Date: 2019/2/14
 * Author: admin
 * Description:
 */
'use strict';
let pomelo = require('pomelo');
let util = require('util');
let Component = require('../component');
let consts = require('../../common/consts');
let messageService = require('../../services/messageService');
let dispatcher = require('../../util/dispatcher');
let utils = require('../../util/utils');

let LobbyComponent = function (entity) {
    Component.call(this, entity);
};

util.inherits(LobbyComponent, Component);
module.exports = LobbyComponent;

let pro = LobbyComponent.prototype;

pro.init = function (opts) {
	this.rank = {
		list: [],
		atRank: 0,
        atTime: 0
    };
};

// 获取排行榜 rankType 0:金币榜(TODO:暂时不做)
pro.getRankList = function (rankType, pageIdx, pageNum, next) {
	pageIdx = pageIdx || 1;
	pageNum = pageNum || 5;
	let self = this;
	if (rankType == 0) {
		let nowTime = Date.now();
		if (self.rank.list.length <= 0 || nowTime - self.rank.atTime >= 1000 * 60 * 5) {
			pomelo.app.db.find("Avatar", { coin: { $gt: 0 } }, ["_id", "name", "avatarUrl", "coin"], { sort: { coin: -1 }, limit: 50 }, function (err, docs) {
				if (err) {
					next(null, {code: consts.RankListCode.RANK_OTHER});
					self.entity.logger.error("db find avatar rank error" + err);
					return;
				}
				self.rank.list = [];
				self.rank.atRank = 0;
				self.rank.atTime = nowTime;
				let index = 0;
				for (const key in docs) {
					const doc = docs[key];
					self.rank.list.push({
						name: doc.name,
						avatarUrl: doc.avatarUrl,
						coin: doc.coin
					});
					index = index + 1;
					if (doc._id == self.entity.id) {
						self.rank.atRank = index;
					}
				}

				let startIdx = (pageIdx - 1) * pageNum;
				let endIdx = startIdx + pageNum;
				let splitList = self.rank.list.slice(startIdx, endIdx);
				next(null, {
					code: consts.RankListCode.OK, 
					list: splitList,
					myRank: self.rank.atRank,
					totalNum: self.rank.list.length
				});
			})
		} else {
			let startIdx = (pageIdx - 1) * pageNum;
			let endIdx = startIdx + pageNum;
			let splitList = self.rank.list.slice(startIdx, endIdx);
			next(null, {
				code: consts.RankListCode.OK, 
				list: splitList,
				myRank: self.rank.atRank,
				totalNum: self.rank.list.length
			});
		}
	} else {
		next(null, {code: consts.RankListCode.RANK_TYPE_NULL});
	}
};

pro._IsCheckGameing = function (uid) {
    return new Promise(function (resolve, reject) {
		pomelo.app.rpc.authGlobal.authRemote.getGameInfo(1, uid, (resp) => {
			resolve(resp);
		})
    })
};

// 检测是否在游戏中
pro.checkIsPlaying = async function (uid, next) {
    let resp = await this._IsCheckGameing(uid);
    next(null, resp);
};

pro._remoteConnector = function (uid, sid) {
    return new Promise(function (resolve, reject) {
		pomelo.app.rpc.game1.entryRemote.onFindUserInfo.toServer(sid, uid, (resp) => {
			resolve(resp);
		});
    })
};

pro.findUserInfo = async function (targetId, next) {
	// 先缓存查找
	let connectors = pomelo.app.getServersByType('game1');
	for (const key in connectors) {
		const server = connectors[key];
		let userInfo = await this._remoteConnector(targetId, server.id);
		if (userInfo) {
			next(null, {
				code: consts.Code.OK,
				userInfo: userInfo
			})
			return;
		}
	}
	
	// 然后数据库查找
	let self = this;
	pomelo.app.db.find("Avatar", {"_id": targetId}, null, null, function (err, docs) {
        if (err) {
            self.entity.logger.error("db find avatar error" + err);
            return;
        }
        if (docs.length == 0) {
            // 用户不存在
			next(null, {code: consts.Code.FAIL})
        } else {
			let userInfo = {
				uid: targetId,
				name: docs[0].name,
				gender: docs[0].gender,
				avatarUrl: docs[0].avatarUrl,
				roomCardNum: docs[0].roomCardNum,
				lastOfflineTime: 0
			}
			next(null, {
				code: consts.Code.OK,
				userInfo: userInfo
			})
		}
	})
};