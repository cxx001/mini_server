/**
 * Date: 2019/8/12
 * Author: admin
 * Description: 通过clubId要映射对应服务器, 实现club服务器的负载均衡
 */
'use strict';
let pomelo = require('pomelo');
let util = require('util');
let Component = require('../component');
let consts = require('../../common/consts');
let dispatcher = require('../../util/dispatcher');
let logger = require('pomelo-logger').getLogger('game', __filename);
let lodash = require('lodash');

let ClubComponent = function (entity) {
    Component.call(this, entity);
};

util.inherits(ClubComponent, Component);
module.exports = ClubComponent;

let pro = ClubComponent.prototype;

pro.init = function (opts) {
	this.db = pomelo.app.db.getModel('Club');
	this._bindEvent();
};

pro._bindEvent = function () {
    this.entity.safeBindEvent("EventLogin", this._onLogin.bind(this));
    this.entity.safeBindEvent("EventLogout", this._onLogout.bind(this));
    this.entity.safeBindEvent("EventReconnect", this._onReconnect.bind(this));
};

pro._onLogin = function (entity) {
	for (const clubId of entity.clubList || []) {
        let sid = dispatcher.clubmap(clubId);
		pomelo.app.rpc.club.clubRemote.refreshPlayerOnlineState.toServer(sid, entity.id, clubId, 0, null);
    }
};

pro._onLogout = function (entity) {
	for (const clubId of entity.clubList || []) {
		let sid = dispatcher.clubmap(clubId);
		pomelo.app.rpc.club.clubRemote.refreshPlayerOnlineState.toServer(sid, entity.id, clubId, Date.now(), null);
    }
};

pro._onReconnect = function (entity) {
	for (const clubId of entity.clubList || []) {
		let sid = dispatcher.clubmap(clubId);
		pomelo.app.rpc.club.clubRemote.refreshPlayerOnlineState.toServer(sid, entity.id, clubId, 0, null);
    }
};

// 远程调用接口
pro._callRemote = function (funcName, clubId, ...args) {
	let sid = dispatcher.clubmap(clubId);
	pomelo.app.rpc.club.clubRemote[funcName].toServer(sid, this.entity.id, clubId, ...args);
};

// 筛选角色数据
pro._filterAvatarData = function () {
	return {
		uid: this.entity.id,
		name: this.entity.name,
		gender: this.entity.gender,
		avatarUrl: this.entity.avatarUrl,
		lastOfflineTime: 0
	}
};

pro.generateClubId = function () {
    return new Promise(function (resolve, reject) {
		let findCount = 0;
		let generateClubIdFunc = function () {
			findCount = findCount + 1;
			let tempClubId = 100 + lodash.random(1, 900);
			pomelo.app.db.find("Club", {"_id": tempClubId}, null, null, function (err, docs) {
				if (err) {
					logger.error("Club db find error" + err);
					return;
				}
				if (docs.length == 0) {
					logger.info('生成俱乐部ID: [%d]', tempClubId);
					resolve(tempClubId);
				} else {
					logger.info('俱乐部查找次数: [%d]', findCount);
					if (findCount > 30) {
						logger.error('生成俱乐部ID失败!');
						return;
					}
					generateClubIdFunc();
				}
			});
		}
		generateClubIdFunc();
	})
};

pro.recursiveClubList = function () {
	let tempList = [];
	let index = this.entity.clubList.length;
	return new Promise((resolve, reject) => {
		let recursiveFunc = () => {
			index = index - 1;
			const clubId = this.entity.clubList[index];
			this._callRemote("getClubInfo", clubId, null, (resp) => {
				if (resp.code == 0) {
					tempList.push(resp.clubInfo)
				} else {
					this.entity.clubList.splice(index, 1);
				}

				if (index <= 0) {
					resolve(tempList);
				} else {
					recursiveFunc();
				}
			});
		}
		recursiveFunc();
	})
};

// 获得俱乐部列表
pro.getClubList = async function (next) {
	if (this.entity.clubList.length <= 0) {
		next(null, {code: consts.ClubCode.CLUB_LIST_NULL});
		return;
	}

	let clubList = await this.recursiveClubList();
	next(null, {
		code: consts.ClubCode.OK,
		clubList: clubList
	});
};

// 进入俱乐部
pro.enterClub = function (clubId, next) {
	if (!clubId || clubId == 0) {
		next(null, {code: consts.ClubCode.CLUB_ID_ERROR});
		return;
	}

	// 每次进入俱乐部前同步一下用户信息
	let userInfo = this._filterAvatarData();
	this._callRemote("enterClub", clubId, userInfo, function (resp) {
        next(null, resp);
    });
};

// 返回大厅
pro.returnLobby = function (clubId, next) {
	if (!clubId || clubId == 0) {
		next(null, {code: consts.ClubCode.CLUB_ID_ERROR});
		return;
	}

	this._callRemote("returnLobby", clubId, function (resp) {
        next(null, resp);
    });
};

// 创建俱乐部
pro.createClub = async function (clubName, next) {
	let userInfo = this._filterAvatarData();
	let clubId = await this.generateClubId();
	this._callRemote("createClub", clubId, clubName, userInfo, function (resp) {
        next(null, resp);
    });
};

// 加入俱乐部
pro.joinClub = function (clubId, next) {
	if (!clubId || clubId == 0) {
		next(null, {code: consts.ClubCode.CLUB_ID_ERROR});
		return;
	}

	let userInfo = this._filterAvatarData();
	this._callRemote("joinClub", clubId, userInfo, function (resp) {
        next(null, resp);
    });
};

// 邀请码加入
pro.joinClubByCode = function (invateCode, next) {
    if (!invateCode || invateCode == 0) {
		next(null, {code: consts.ClubCode.CLUB_ID_ERROR});
		return;
	}

	let clubId = Number(String(invateCode).substring(0, 3));
	let userInfo = this._filterAvatarData();
	this._callRemote("joinClubByCode", clubId, invateCode, userInfo, function (resp) {
        next(null, resp);
    });
};

// 获得俱乐部玩法
pro.getClubPlayway = function (clubId, gameMode, gameId, playwayId, next) {
	if (!clubId || clubId == 0) {
		next(null, {code: consts.ClubCode.CLUB_ID_ERROR});
		return;
	}

	this._callRemote("getClubPlayway", clubId, gameMode, gameId, playwayId, function (resp) {
        next(null, resp);
    });
};

// 获得俱乐部某个玩法
pro.getClubSinglePlayway = function (clubId, playwayId, next) {
	if (!clubId || clubId == 0) {
		next(null, {code: consts.ClubCode.CLUB_ID_ERROR});
		return;
	}

	this._callRemote("getClubSinglePlayway", clubId, playwayId, function (resp) {
        next(null, resp);
    });
};

// 获取俱乐部玩家申请列表
pro.getClubCheckList = function (clubId, next) {
	if (!clubId || clubId == 0) {
		next(null, {code: consts.ClubCode.CLUB_ID_ERROR});
		return;
	}

	this._callRemote("getClubCheckList", clubId, function (resp) {
        next(null, resp);
    });
};

// 申请列表同意或拒绝加入俱乐部
pro.setClubCheckResult = function (clubId, targetId, isAgree, next) {
	if (!clubId || clubId == 0) {
		next(null, {code: consts.ClubCode.CLUB_ID_ERROR});
		return;
	}

	this._callRemote("setClubCheckResult", clubId, targetId, isAgree, function (resp) {
        next(null, resp);
    });
};

// 获取俱乐部所有桌子信息
pro.getClubTable = function (clubId, gameMode, gameId, playwayId, next) {
	if (!clubId || clubId == 0) {
		next(null, {code: consts.ClubCode.CLUB_ID_ERROR});
		return;
	}

	this._callRemote("getClubTable", clubId, gameMode, gameId, playwayId, this.entity.serverId, function (resp) {
        next(null, resp);
    });
};

// 获取成员
pro.getClubMember = function (clubId, pageIdx, pageNum, isOutPartner, targetId, isOutMyself, next) {
	if (!clubId || clubId == 0) {
		next(null, {code: consts.ClubCode.CLUB_ID_ERROR});
		return;
	}

	pageIdx = pageIdx || 1;
	pageNum = pageNum || 10;
	isOutPartner = isOutPartner || false;
	isOutMyself = isOutMyself || false;
	this._callRemote("getClubMember", clubId, pageIdx, pageNum, isOutPartner, targetId, isOutMyself, function (resp) {
        next(null, resp);
    });
};

// 设置合伙人
pro.setClubPartner = function (clubId, targetId, next) {
	if (!clubId || clubId == 0) {
		next(null, {code: consts.ClubCode.CLUB_ID_ERROR});
		return;
	}

	if (!targetId || targetId < 100000) {
		next(null, {code: consts.ClubCode.CLUB_PLAYER_ID_ERROR});
		return;
	}

	this._callRemote("setClubPartner", clubId, targetId, function (resp) {
        next(null, resp);
    });
};

pro.getClubPartner = function (clubId, pageIdx, pageNum, userId, next) {
	if (!clubId || clubId == 0) {
		next(null, {code: consts.ClubCode.CLUB_ID_ERROR});
		return;
	}

	pageIdx = pageIdx || 1;
	pageNum = pageNum || 10;
	this._callRemote("getClubPartner", clubId, pageIdx, pageNum, userId, function (resp) {
        next(null, resp);
    });
};

pro.getGameRecord = function (clubId, timeIdx, pageIdx, pageNum, next) {
	if (!clubId || clubId == 0) {
		next(null, {code: consts.ClubCode.CLUB_ID_ERROR});
		return;
	}

	pageIdx = pageIdx || 1;
	pageNum = pageNum || 5;
	this._callRemote("getGameRecord", clubId, timeIdx, pageIdx, pageNum, function (resp) {
        next(null, resp);
    });
};

pro.findGameRecord = function (clubId, targetId, timeIdx, next) {
	if (!clubId || clubId == 0) {
		next(null, {code: consts.ClubCode.CLUB_ID_ERROR});
		return;
	}

	this._callRemote("findGameRecord", clubId, targetId, timeIdx, function (resp) {
        next(null, resp);
    });
};

pro.findClubPlayer = function (clubId, srcUserId, targetId, findType, next) {
	if (!clubId || clubId == 0) {
		next(null, {code: consts.ClubCode.CLUB_ID_ERROR});
		return;
	}

	findType = findType || 0;
	this._callRemote("findClubPlayer", clubId, srcUserId, targetId, findType, function (resp) {
        next(null, resp);
    });
};

pro.setPartnerRatioValue = function (clubId, targetId, ratioValue, next) {
	if (!clubId || clubId == 0) {
		next(null, {code: consts.ClubCode.CLUB_ID_ERROR});
		return;
	}

	this._callRemote("setPartnerRatioValue", clubId, targetId, ratioValue, function (resp) {
        next(null, resp);
    });
};

pro.quitClub = function (clubId, next) {
	if (!clubId || clubId == 0) {
		next(null, {code: consts.ClubCode.CLUB_ID_ERROR});
		return;
	}

	this._callRemote("quitClub", clubId, function (resp) {
        next(null, resp);
    });
};

pro.setClubAnnouncement = function (clubId, content, next) {
	if (!clubId || clubId == 0) {
		next(null, {code: consts.ClubCode.CLUB_ID_ERROR});
		return;
	}

	this._callRemote("setClubAnnouncement", clubId, content, function (resp) {
        next(null, resp);
    });
};

pro.setPostCardInfo = function (clubId, wxId, qqId, next) {
	if (!clubId || clubId == 0) {
		next(null, {code: consts.ClubCode.CLUB_ID_ERROR});
		return;
	}

	this._callRemote("setPostCardInfo", clubId, wxId, qqId, function (resp) {
        next(null, resp);
    });
};

pro.getPostCardInfo = function (clubId, targetId, next) {
	if (!clubId || clubId == 0) {
		next(null, {code: consts.ClubCode.CLUB_ID_ERROR});
		return;
	}

	this._callRemote("getPostCardInfo", clubId, targetId, function (resp) {
        next(null, resp);
    });
};

pro.getTableInfo = function (clubId, tableId, next) {
	if (!clubId || clubId == 0) {
		next(null, {code: consts.ClubCode.CLUB_ID_ERROR});
		return;
	}

	this._callRemote("getTableInfo", clubId, tableId, function (resp) {
        next(null, resp);
    });
};

pro.getSafeboxInfo = function (clubId, next) {
	if (!clubId || clubId == 0) {
		next(null, {code: consts.ClubCode.CLUB_ID_ERROR});
		return;
	}

	this._callRemote("getSafeboxInfo", clubId, function (resp) {
        next(null, resp);
    });
};

pro.modifySafebox = function (clubId, score, next) {
	if (!clubId || clubId == 0) {
		next(null, {code: consts.ClubCode.CLUB_ID_ERROR});
		return;
	}
	
	this._callRemote("modifySafebox", clubId, score, function (resp) {
        next(null, resp);
    });
};

pro.modifyPlayerScore = function (clubId, targetId, score, next) {
	if (!clubId || clubId == 0) {
		next(null, {code: consts.ClubCode.CLUB_ID_ERROR});
		return;
	}
	
	this._callRemote("modifyPlayerScore", clubId, targetId, score, function (resp) {
        next(null, resp);
    });
};

pro.getPlayerScoreLog = function (clubId, targetId, logType, splitValue, pageNum, next) {
	if (!clubId || clubId == 0) {
		next(null, {code: consts.ClubCode.CLUB_ID_ERROR});
		return;
	}

	this._callRemote("getPlayerScoreLog", clubId, targetId, logType, splitValue, pageNum, function (resp) {
        next(null, resp);
    });
};

pro.addClubMember = function (clubId, targetInfo, next) {
	if (!clubId || clubId == 0) {
		next(null, {code: consts.ClubCode.CLUB_ID_ERROR});
		return;
	}

	this._callRemote("addClubMember", clubId, targetInfo, function (resp) {
        next(null, resp);
    });
};

pro.setClubAntiLimit = function (clubId, antiLimit, next) {
	if (!clubId || clubId == 0) {
		next(null, {code: consts.ClubCode.CLUB_ID_ERROR});
		return;
	}

	this._callRemote("setClubAntiLimit", clubId, antiLimit, function (resp) {
        next(null, resp);
    });
};

pro.setClubMemberAntiLimit = function (clubId, targetId, antiLimit, next) {
	this._callRemote("setClubMemberAntiLimit", clubId, targetId, antiLimit, function (resp) {
        next(null, resp);
    });
};

pro.refreshMemberAntiValue = function (clubId, targetId, next) {
	this._callRemote("refreshMemberAntiValue", clubId, targetId, function (resp) {
        next(null, resp);
    });
};

pro.getClubAntiMemList = function (clubId, targetId, type, pageIdx, pageNum, beginIdx, endIdx, next) {
	this._callRemote("getClubAntiMemList", clubId, targetId, type, pageIdx, pageNum, beginIdx, endIdx, function (resp) {
        next(null, resp);
    });
};

pro.getMemberAntiLog = function (clubId, targetId, splitValue, pageNum, next) {
	this._callRemote("getMemberAntiLog", clubId, targetId, splitValue, pageNum, function (resp) {
        next(null, resp);
    });
};