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

// 获取战绩 recordType 0:当天 1:昨天  2:前天
pro.getRecordList = function (recordType, next) {
	let tmpList = [];
	for (let i = 0; i < this.entity.replayList.length; i++) {
        const element = this.entity.replayList[i];
        if (utils.judgeTime(element.dtime) == recordType) {
			tmpList = element.list;
            break;
        }
    }

	if (tmpList.length <= 0) {
		// 没有记录
		next(null, {code: consts.Code.FAIL});
		return;
	}

	pomelo.app.rpc.record.recordRemote.getRecordList(null, tmpList, (resp) => {
		next(null, resp);
	});
};

// 获取战绩里面每小局详情
pro.getRecordDetails = function (recordList, next) {
	if (!recordList || recordList.length <= 0) {
		// 没有记录
		next(null, {code: consts.Code.FAIL});
		return;
	}

	pomelo.app.rpc.record.recordRemote.getRecordList(null, recordList, (resp) => {
		next(null, resp);
	});
};

// 通过回放码获取战绩信息
pro.getRecordInfo = function (recordCode, next) {
	if (!recordCode) {
		next(null, {code: consts.Code.FAIL});
		return;
	}

	pomelo.app.rpc.record.recordRemote.getRecordList(null, [recordCode], (resp) => {
		next(null, resp);
	});
};

// 创建房间负载分配sid
pro._getTableSidByGameId = function (gameId) {
    let tables = pomelo.app.getServersByType('table');
    if (!tables || tables.length === 0) {
        return null;
	}

	let gameServers = [];
	for (let i = 0; i < tables.length; i++) {
		const table = tables[i];
		let id = Number(table.id.split("-")[1]);
		if (id == gameId) {
			gameServers.push(table);
		}
	}

	if (gameServers.length === 0) {
        return null;
	}

	let res = dispatcher.dispatch(this.entity.id, gameServers);
	return res.id;
};

// 已经有sid
pro._getTableSidByTableId = function (tableId) {
    let tableIdStr = tableId.toString();
    let gameId = Number(tableIdStr.slice(0, 2));
    let index = Number(tableIdStr.slice(2, 3)) + 1;
    let sid = 'table-{0}-{1}'.format(gameId, index);
    return sid;
};

pro._IsCheckGameing = function (uid) {
    return new Promise(function (resolve, reject) {
		pomelo.app.rpc.authGlobal.authRemote.getGameInfo(null, uid, (resp) => {
			resolve(resp);
		})
    })
};

// 检测是否在游戏中
pro.checkIsPlaying = async function (uid, next) {
    let resp = await this._IsCheckGameing(uid);
    next(null, resp);
};

// 获取俱乐部信息
pro.getClubInfo = function (clubId, uid, playwayId) {
	return new Promise(function (resolve, reject) {
		let sid = dispatcher.clubmap(clubId);
		pomelo.app.rpc.club.clubRemote.getClubInfo.toServer(sid, uid, clubId, playwayId, function (resp) {
			resolve(resp);
		});
    })
};

// 进入牌桌
pro.enterGame = async function (uid, msg, next) {
    // 是否在牌桌
    let data = await this._IsCheckGameing(uid);
    if (data.code == consts.GameStatus.GAME_PLAYING) {
        let gameInfo = data.gameInfo;
        let param = {
            user: this.entity.getUserInfo(),
            clubId: gameInfo.clubId,
            gameId: gameInfo.gameId,
            playwayId: gameInfo.playwayId,
            tableId: gameInfo.tableId,
            isLookPlayer: gameInfo.isLookPlayer,
        }
        pomelo.app.rpc.table.tableRemote.enter.toServer(gameInfo.sid, param, (resp) => {
			if (resp.code == consts.EnterTableCode.OK) {
				let sid = dispatcher.clubmap(gameInfo.clubId);
				pomelo.app.rpc.club.clubRemote.leaveToChannel.toServer(sid, this.entity.id, gameInfo.clubId, null);
			}
			next(null, resp);
		})
    } else {
       	// 创建或加入牌桌
        let param = {
            user: this.entity.getUserInfo(),
            clubId: msg.clubId,
            gameId: msg.gameId,
            playwayId: msg.playwayId,
            tableId: msg.tableId,
            isLookPlayer: msg.isLookPlayer,
		}
		
		// 判断钱是否充足
		let resp = await this.getClubInfo(msg.clubId, this.entity.uid, msg.playwayId);
		if (resp.code != consts.ClubCode.OK) {
			this.entity.logger.warn('获取亲友圈信息失败. code=', resp.code);
			next(null, {code: consts.EnterTableCode.OTHER_FAIL});
		} else {
			let clubInfo = resp.clubInfo;
			let playwayInfo = resp.playwayInfo;
			await this.findUserInfo(clubInfo.leaderId, (error, ret) => {
				if (ret.code != consts.Code.OK) {
					this.entity.logger.warn('获取个人信息失败. code=', ret.code);
					next(null, {code: consts.EnterTableCode.OTHER_FAIL});
					return;
				}

				let leaderInfo = ret.userInfo;
				if (leaderInfo.roomCardNum < playwayInfo.roomCardNum) {
					next(null, {code: consts.EnterTableCode.LEADER_NOFULL_MONEY});
					return;
				}

				let clubMode = clubInfo.clubMode;
				let oneselfInfo = clubInfo.oneselfInfo;
				let clubAntiLimit = clubInfo.clubAntiLimit;
				if (clubMode != 0) {
					if (clubMode == 3 || clubMode == 4) {
						// 福卡判断
						if (oneselfInfo.money < playwayInfo.lowerLimit) {
							next(null, {code: consts.EnterTableCode.PLAYER_NOFULL_MONEY});
							return;
						}

						// 沉迷值判断
						if (oneselfInfo.antiValue <= clubAntiLimit || oneselfInfo.antiValue <= oneselfInfo.antiLimit) {
							next(null, {code: consts.EnterTableCode.PLAYER_NOFULL_ANIT});
							return;
						}
					} else {
						next(null, {code: consts.EnterTableCode.PLAYER_NOFULL_MONEY});
						return;
					}
				}
			});
		}

        let sid = null;
        if (param.tableId) {
            sid = this._getTableSidByTableId(param.tableId);
        } else {
            sid = this._getTableSidByGameId(param.gameId);
        }
        pomelo.app.rpc.table.tableRemote.enter.toServer(sid, param, (resp) => {
			if (resp.code == consts.EnterTableCode.OK) {
				let sid = dispatcher.clubmap(param.clubId);
				pomelo.app.rpc.club.clubRemote.leaveToChannel.toServer(sid, this.entity.id, param.clubId, null);
			}
			next(null, resp);
		})
    }
};

pro._remoteConnector = function (uid, sid) {
    return new Promise(function (resolve, reject) {
		pomelo.app.rpc.connector.entryRemote.onFindUserInfo.toServer(sid, uid, (resp) => {
			resolve(resp);
		});
    })
};

pro.findUserInfo = async function (targetId, next) {
	// 先缓存查找
	let connectors = pomelo.app.getServersByType('connector');
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