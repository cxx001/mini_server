/**
 * Date: 2019/8/15
 * Author: admin
 * Description: 俱乐部类
 */
'use strict';
let pomelo = require('pomelo');
let logger = require('pomelo-logger').getLogger('game', 'club');
let ClubMember = require('../entity/clubMember');
let ClubPlayway = require('../entity/clubPlayway');
let consts = require('../common/consts');
let utils = require('../util/utils');

let Club = function (stub, doc) {
	this.stub = stub;
	this.id = doc._id;
	this.createTime = doc.createTime || Date.now();
	this.clubName = doc.clubName;
	this.leaderId = doc.leaderId;
	this.leaderName = doc.leaderName;
	this.leaderUrl = doc.leaderUrl;
	this.clubMode = doc.clubMode || 3;   // 0 普通模式 1 积分固定分成模式 2 积分玩法分成模式 3 沉迷值固定分成模式 4 沉迷值玩法分成模式
	this.clubAntiLimit = doc.clubAntiLimit || 0;   //亲友圈沉迷值限制
	this.members = [];
	for (let mem of doc.members || []) {
		this.addMember(mem);
	}
	this.playways = [];
	for (let playway of doc.playways || []) {
		this.addPlayway(playway);
	}

	this.channel = pomelo.app.get('channelService').getChannel(this.id, true);
	this.applyList = [];
	this.tableInfos = [];
};

module.exports = Club;
let pro = Club.prototype;

pro.filterClubData = function (uid) {
	//公告 0:盟主  1: 上级  2: 自己
	let announts = ["", "", ""];
	let leader = this.getMemberByUid(this.leaderId);
	let oneself = this.getMemberByUid(uid);
	let laster = this.getMemberByUid(oneself.lastId);
	announts[0] = leader.getAnnouncement();
	announts[1] = laster ? laster.getAnnouncement() : "";
	announts[2] = oneself.getAnnouncement();

	return {
		clubId: this.id,
		leaderId: this.leaderId,
		clubName: this.clubName,
		leaderName: this.leaderName,
		leaderUrl: this.leaderUrl,
		clubMode: this.clubMode,
		clubAntiLimit: this.clubAntiLimit,
		onlinePlayerNum: this.getPlayerOnlineCount(),
		totalPlayerNum: this.members.length,
        oneselfInfo: oneself.filterDBMember(),
		announcements: announts,
	}
};

pro.addToChannel = function (uid, sid) {
	if(this.channel) {
		this.leaveToChannel(uid);
		this.channel.add(uid, sid);
	}
};

pro.leaveToChannel = function (uid) {
	if(this.channel) {
		let mem = this.channel.getMember(uid);
		if (mem) {
			this.channel.leave(uid, mem.sid);
		}
	}
};

pro.sendChannelMessage = function (route, msg) {
	if(this.channel) {
		this.channel.pushMessage(route, msg);
	}
};

pro.refreshPlayerOnlineState = function (uid, lastOfflineTime) {
	for (const i in this.members) {
		if (this.members.hasOwnProperty(i)) {
			let mem = this.members[i];
			if (mem.uid == uid) {
				this.members[i].lastOfflineTime = lastOfflineTime;
				this.stub.cidsWaitToUpdateDB.add(this.id);
				logger.info('更新俱乐部[%d]玩家[%d]在线状态:%d.', this.id, uid, lastOfflineTime);
				if (lastOfflineTime != 0) {
					this.leaveToChannel(uid);
				}
				break;
			}
		}
	}
};

pro.getPlayerOnlineCount = function () {
	let count = 0;
	for (const i in this.members) {
		if (this.members.hasOwnProperty(i)) {
			const mem = this.members[i];
			if (mem.lastOfflineTime == 0) {
				count = count + 1;
			}
		}
	}
	return count;
};

pro.addMember = function (userInfo, addType, ex) {
    if (this.getMemberByUid(userInfo.uid)) {
        logger.warn('addMember [%d] existed!', member.uid);
        return;
    }

	let member = new ClubMember(this, userInfo);
	this.members.push(member);
	if (addType == consts.AddClubMemType.CREATE_INVATE_CODE) {
		// 盟主
		member.setInvateCode();
        member.setRatioValue(100);
        member.modifyUserMoney(10000000);
	} else if(addType == consts.AddClubMemType.BIND_LAST_ID) {
		// 邀请码拉人
        member.setLastUserID(ex);
    }

	pomelo.app.rpc.auth.authRemote.getUid2Sid(null, member.uid, function (sid) {
		if (sid) {
			this.addToChannel(member.uid, sid);
		} else {
			logger.info('玩家[%d]已离线.', member.uid);
		}
	}.bind(this));
};

pro.removeMember = function (uid) {
	for (const i in this.members) {
		if (this.members.hasOwnProperty(i)) {
			let member = this.members[i];
			if (member.uid == uid) {
				this.members.splice(i, 1);
				break;
			}
		}
	}
};

pro.getMemberByUid = function (uid) {
	for (const i in this.members) {
		if (this.members.hasOwnProperty(i)) {
			let member = this.members[i];
			if (member.uid == uid) {
				return member;
			}
		}
	}
	return null;
};

pro.updateMemInfo = function (userInfo) {
	for (const i in this.members) {
		if (this.members.hasOwnProperty(i)) {
			let member = this.members[i];
			if (member.uid == userInfo.uid) {
				member.updateMemberData(userInfo);
				break;
			}
		}
	}
};

pro.addPlayway = function (cfg) {
	let playway = new ClubPlayway(this, cfg);
	this.playways.push(playway);
	return playway.filterDBPlayway();
};

pro.removePlayway = function (playwayId) {
	for (const i in this.playways) {
		if (this.playways.hasOwnProperty(i)) {
			let playway = this.playways[i];
			if (playway.id == playwayId) {
				this.playways.splice(i, 1);
				return;
			}
		}
	}
	logger.warn('[%s] removePlayway no existed!', playwayId);
};

pro.modifyPlayway = function (cfg) {
	for (const i in this.playways) {
		if (this.playways.hasOwnProperty(i)) {
			let playway = this.playways[i];
			if (playway.id == cfg.playwayId) {
				playway.setPlaywayCfg(cfg);
				return playway.filterDBPlayway();
			}
		}
	}
	logger.warn('[%s] modifyPlayway no existed!', cfg.playwayId);
};

pro.getPlayWayInfo = function (playwayId) {
	for (const i in this.playways) {
		if (this.playways.hasOwnProperty(i)) {
			let playway = this.playways[i];
			if (playway.id == playwayId) {
				return playway.filterDBPlayway();
			}
		}
	}
	logger.warn('[%s] removePlayway no existed!', playwayId);
	return null;
};

pro.getApplyList = function () {
	return this.applyList;
};

pro.addMemApplyList = function (userInfo) {
	for (const i in this.applyList) {
		if (this.applyList.hasOwnProperty(i)) {
			let user = this.applyList[i];
			if (user.uid == userInfo.uid) {
				return {code: consts.ClubApplyCode.APPLY_USER_APPLYED};
			}
		}
	}
	this.applyList.push(userInfo);
	return {code: consts.ClubApplyCode.OK};
};

pro.removeMemApplyList = function (uid) {
	for (const i in this.applyList) {
		if (this.applyList.hasOwnProperty(i)) {
			let user = utils.clone(this.applyList[i]);
			if (user.uid == uid) {
				this.applyList.splice(i, 1);
				return user;
			}
		}
	}
	return null;
};

pro.getClubTable = function (gameMode, gameId, playwayId) {
	gameMode = gameMode || 0;
	gameId = gameId || 0;
	playwayId = playwayId || 0;

	let tempInfos = [];
	for (const i in this.tableInfos) {
		const info = this.tableInfos[i];
		if (info.gameMode == gameMode && (gameId == 0 || info.gameId == gameId) && (playwayId == 0 || info.playwayId == playwayId)) {
			tempInfos.push(info);
		}
	}
	return tempInfos;
};

pro.addTableInfo = function (newTableInfo) {
	for (const i in this.tableInfos) {
		if (this.tableInfos.hasOwnProperty(i)) {
			let info = this.tableInfos[i];
			if (info.tableId == newTableInfo.tableId) {
				this.tableInfos[i] = newTableInfo;
				return;
			}
		}
	}
	this.tableInfos.push(newTableInfo);
};

pro.removeTableInfo = function (tableId) {
	for (const i in this.tableInfos) {
		if (this.tableInfos.hasOwnProperty(i)) {
			let info = this.tableInfos[i];
			if (info.tableId == tableId) {
				this.tableInfos.splice(i, 1);
				return;
			}
		}
	}
};

pro.bindInvateCode = function (uid, invateCode) {
    for (let mem of this.members || []) {
		if (mem.invateCode == invateCode) {
            mem.addUserToNextList(uid);
            return mem.uid;
        }
    }
    return null;
};

// 成员数据
pro.filterMemberData = function (member, ratioValue) {
	let recording = member.getGameRecord(0) || {};
	let recorded = member.getGameRecord(1) || {};
	recorded.totalPayNum = recorded.totalPayNum || 0;
	recording.totalPayNum = recording.totalPayNum || 0;
	return {
		uid: member.uid,
		name: member.name,
		avatarUrl: member.avatarUrl,
		lastOfflineTime: member.lastOfflineTime,
		totalMoney: member.money,
		totalWinCount: recorded.winCount || 0,
		totalGameCount: recorded.gameCount || 0,
		totalPayNum: Math.floor((recorded.totalPayNum * ratioValue * 0.01) * 100) / 100,    //昨日积分消耗
		totalPayNuming: Math.floor((recording.totalPayNum * ratioValue * 0.01) * 100) / 100,  //今天积分消耗
	}
};

pro.getClubMember = function (uid, pageIdx, pageNum, isOutPartner, targetId, isOutMyself) {
	targetId = (targetId && targetId != 0) ? targetId : uid;
	let oneselfInfo = this.getMemberByUid(uid);
	let ratioValue = oneselfInfo.ratioValue;
	let memList = [];
	for (const i in this.members) {
		if (this.members.hasOwnProperty(i)) {
			let member = this.members[i];
			if ((isOutPartner && member.isPartner()) || (isOutMyself && member.uid == targetId)) {
				continue;
			}

			if (member.lastId == targetId) {
				memList.push(this.filterMemberData(member, ratioValue));
			} else if(member.uid == targetId) {
				// 把自己插入头部
				memList.unshift(this.filterMemberData(member, ratioValue));
			}
		}
	}

	// 排序
	if (isOutPartner) {
		memList.sort(function(a, b){
			return b.totalPayNum - a.totalPayNum;
		});
	} else {
		memList.sort(function(a, b){
			return a.lastOfflineTime - b.lastOfflineTime;
		});
	}
	let temp = null;
	for (const i in memList) {
		let member = memList[i];
		if(member.uid == targetId) {
			temp = member;
			memList.splice(i, 1);
			break;
		}
	}
	if (temp) {
		memList.unshift(temp);
	}

	// 求和统计
	let totalGameCount = 0;
	let totalPayNum = 0;
	let totalScore = 0;
	for (const mem of memList) {
		totalGameCount = totalGameCount + mem.totalGameCount;
		totalPayNum = totalPayNum + mem.totalPayNum;
		totalScore = totalScore + mem.totalMoney;
	}
	totalPayNum = Math.floor(totalPayNum * 100) / 100;

	let start = (pageIdx - 1) * pageNum;
	let end = start + pageNum;
	let splitList = memList.slice(start, end);
	return [splitList, memList.length, totalGameCount, totalPayNum, totalScore];
};

pro._getNextMemberTotal = function (member, ratioValue) {
	let totalPayNuming = 0;
	let totalWinCount = 0;
	let totalGameCount = 0;
    let totalPayNum = 0;
    
    let index = 0;
    for (const m in this.members) {
        let mem = this.members[m];
        if (mem.uid == member.uid || (!mem.isPartner() && member.nextMemList.indexOf(mem.uid) > -1)) {
            let recording = mem.getGameRecord(0);  // 今天数据
            let recorded = mem.getGameRecord(1);   // 昨天数据
            if (recording) {
                totalPayNuming = totalPayNuming + recording.totalPayNum * ratioValue * 0.01;
            }
            if (recorded) {
                totalWinCount = totalWinCount + recorded.winCount;
                totalGameCount = totalGameCount + recorded.gameCount;
                totalPayNum = totalPayNum + recorded.totalPayNum * ratioValue * 0.01;
            }
            index++;

            if (index >= member.nextMemList.length + 1) {
                break;
            }
        }
	}
	
	totalPayNuming = Math.floor(totalPayNuming * 100) / 100;
	totalPayNum = Math.floor(totalPayNum * 100) / 100;
	return {
		totalPayNuming: totalPayNuming,
		totalWinCount: totalWinCount,
		totalGameCount: totalGameCount,
		totalPayNum: totalPayNum,
	}
}

// 合伙人数据
pro.filterPartnerData = function (partner, ratioValue) {
	let totalPayNuming = 0;
	let totalWinCount = 0;
	let totalGameCount = 0;
	let totalPayNum = 0;

    // 下属成员带来收益
    let tempRatio = ratioValue - partner.getRatioValue();
	let total = this._getNextMemberTotal(partner, tempRatio);
	totalPayNuming = total.totalPayNuming;
	totalWinCount = total.totalWinCount;
	totalGameCount = total.totalGameCount;
	totalPayNum = total.totalPayNum;
	
	// 下属合伙人带来收益
	let tempPartner = partner;
	while (true) {
		if (tempPartner.nextPartnerList.length <= 0) {
			break;
		}
		for (const i in tempPartner.nextPartnerList) {
			const uid = tempPartner.nextPartnerList[i];
			let mem = this.getMemberByUid(uid);
			if (mem) {
				let total = this._getNextMemberTotal(mem, tempRatio);
				totalPayNuming = totalPayNuming + total.totalPayNuming;
				totalWinCount = totalWinCount + total.totalWinCount;
				totalGameCount = totalGameCount + total.totalGameCount;
				totalPayNum = totalPayNum + total.totalPayNum;
				tempPartner = mem;
			}
		}
	}

	// 上级点位
	let lastMem = this.getMemberByUid(partner.lastId);
	let lastRatioValue = lastMem.ratioValue;

	return {
		uid: partner.uid,
		name: partner.name,
		avatarUrl: partner.avatarUrl,
		ratioValue: partner.ratioValue,
		lastRatioValue: lastRatioValue,
		totalPayNuming: totalPayNuming,
		totalWinCount: totalWinCount,
		totalGameCount: totalGameCount,
		totalPayNum: totalPayNum,
	}
};

pro.getClubPartner = function (uid, pageIdx, pageNum, userId) {
    userId = (userId && userId != 0) ? userId : uid;
    let oneselfInfo = this.getMemberByUid(uid);
	let ratioValue = oneselfInfo.ratioValue;
	let memList = [];
	for (const i in this.members) {
		if (this.members.hasOwnProperty(i)) {
			let member = this.members[i];
			if (member.isPartner() && member.lastId == userId) {
				memList.push(this.filterPartnerData(member, ratioValue));
			}
		}
	}

	// 排序
	memList.sort(function(a, b){
		return b.totalPayNum - a.totalPayNum;
	});

	// 求和统计
	let totalGameCount = 0;
	let totalPayNum = 0;
	for (const mem of memList) {
		totalGameCount = totalGameCount + mem.totalGameCount;
		totalPayNum = totalPayNum + mem.totalPayNum;
	}

	let start = (pageIdx - 1) * pageNum;
	let end = start + pageNum;
	let splitList = memList.slice(start, end);
	return [splitList, memList.length, totalGameCount, totalPayNum];
};

pro.addGameRecord = function (uid, isWiner, settleSorce, payRoomNum) {
    for (const i in this.members) {
		if (this.members.hasOwnProperty(i)) {
			let member = this.members[i];
			if (member.uid == uid) {
				member.addGameRecord(isWiner, settleSorce, payRoomNum);
				//房费
				member.modifyUserMoney(-payRoomNum);
				this.writeMemberScoreLog(2, {
					targetId: member.uid,
					targetName: member.name,
					changeScoreNum: payRoomNum,
					targetRetainNum: member.money,
				});

				//对局消耗
				if (this.clubMode == 1 || this.clubMode == 2) {
					// 积分模式
					member.modifyUserMoney(settleSorce);
				} else if (this.clubMode == 3 || this.clubMode == 4) {
					// 沉迷值模式
					member.modifyUserAnti(settleSorce);
				}
				this.writeMemberScoreLog(3, {
					targetId: member.uid,
					targetName: member.name,
					changeScoreNum: settleSorce,
					targetRetainNum: member.money,
				});
				
				// 分成
				this._autoDistributeMoney(member, payRoomNum);
                return;
			}
		}
    }
    logger.warn('游戏记录玩家[%d]不存在！', uid);
};

pro._autoDistributeMoney = function (member, distributeMoney) {
    if (distributeMoney <= 0 || this.clubMode == 0) {
        return;
    }

    let curLastId = member.lastId;
    let ratioValue = 0;
    while (true) {
        let player = this.getMemberByUid(curLastId);
        ratioValue = player.getRatioValue() - ratioValue;
        let money = Math.floor((distributeMoney * ratioValue * 0.01) * 100) / 100;
		player.modifyUserMoney(money);
		// 下级带来收益
		this.writeMemberScoreLog(5, {
			operateId: member.uid,
			operateName: member.name,
			targetId: player.uid,
			targetName: player.name,
			changeScoreNum: money,
			targetRetainNum: player.money,
		});
        curLastId = player.lastId;
        if (curLastId == 0) {
            break;
        }
    }
};

pro.getGameRecord = function (uid, timeIdx, pageIdx, pageNum) {
	// 积分排序
	this.members.sort(function(a, b){
		let record1 = a.getGameRecord(timeIdx) || {};
		let record2 = b.getGameRecord(timeIdx) || {};
		let totalSorce1 = record1.totalSorce || 0;
		let totalSorce2 = record2.totalSorce || 0;
		return totalSorce2 - totalSorce1;
	});

    let recordList = [];
	for (const i in this.members) {
		if (this.members.hasOwnProperty(i)) {
            let member = this.members[i];
            let record = member.getGameRecord(timeIdx);
            if (!record) {
                continue;
            }
			if (member.lastId == uid) {
				recordList.push(record);
			} else if(member.uid == uid) {
				// 把自己插入头部
				recordList.unshift(record);
			}
		}
	}

	let start = (pageIdx - 1) * pageNum;
	let end = start + pageNum;
	let splitList = recordList.slice(start, end);
	return [splitList, recordList.length];
};

// 写积分日志
pro.writeMemberScoreLog = function (operateType, param) {
	if (this.clubMode == 0) {
		return;
	}

	if (!param.changeScoreNum || param.changeScoreNum == 0) {
		return;
	}

	let data = {
		operateType: operateType,  // 1:下分、上分 2:房费 3:对局消耗 4:保险箱存取 5:下级收益
		operateId: param.operateId || 0,
		operateName: param.operateName || "",
		targetId: param.targetId || 0,
		targetName: param.targetName || "",
		changeScoreNum: param.changeScoreNum || 0,
		operateRetainNum: param.operateRetainNum || 0,
		targetRetainNum: param.targetRetainNum || 0,
		time: Date.now(),
	}
	let db = pomelo.app.db.getModel('ScoreLog');
	db.update({_id: pomelo.app.db.genId()}, data, {upsert: true}, function (err, raw) {
		if (err) {
			logger.error(cid + " write scoreLog db error: " + err);
		}
	})
};

// 写刷新沉迷值日志
pro.writeRefreshAntiLog = function (param) {
	if (this.clubMode != 3 && this.clubMode != 4) {
		return;
	}

	if (!param.refreshValue || param.refreshValue == 0) {
		return;
	}

	let data = {
		operateId: param.operateId || 0,
		operateName: param.operateName || "",
		targetId: param.targetId || 0,
		targetName: param.targetName || "",
		refreshValue: param.refreshValue || 0,
		time: Date.now(),
	}
	let db = pomelo.app.db.getModel('AntiLog');
	db.update({_id: pomelo.app.db.genId()}, data, {upsert: true}, function (err, raw) {
		if (err) {
			logger.error(cid + " write AntiLog db error: " + err);
		}
	})
};

// 设置沉迷值限制
pro.setClubAntiLimit = function (antiLimit) {
	this.clubAntiLimit = antiLimit;
};

// 是否是关联玩家
pro.isRelation = function (lastId, nextId) {
	let tempLastId = nextId;
	while (true) {
		let mem = this.getMemberByUid(tempLastId);
		if (!mem || mem.lastId == 0) {
			return false;
		}

		if (mem.lastId == lastId) {
			return true;
		}
		tempLastId = mem.lastId;
	}
}

pro.filterAntiMemData = function (member, totalRefreshValue) {
	let lastId = (member.lastId == 0) ? member.uid : member.lastId
	let laster = this.getMemberByUid(lastId);
	return {
		uid: member.uid,
		name: member.name,
		avatarUrl: member.avatarUrl,
        offer: member.getOffer(),
        invateCode: member.invateCode,
		lastId: laster.uid,
		lastName: laster.name,
		antiValue: member.antiValue,
		totalRefreshValue: totalRefreshValue || 0,
	}
};

// type 1:沉迷列表 2 刷新统计 3 限制列表 4 异常列表
pro.getClubAntiMemList = function (type, targetId, pageIdx, pageNum, beginIdx, endIdx) {
	let memList = [];
	for (const i in this.members) {
		if (this.members.hasOwnProperty(i)) {
			let member = this.members[i];
			if (type == 1) {
				if (member.lastId == targetId) {
					memList.push(this.filterAntiMemData(member));
				} else if(member.uid == targetId) {
					memList.unshift(this.filterAntiMemData(member));
				}
			} else if(type == 2) {
				let totalRefreshValue = member.getAntiValueRecord(beginIdx, endIdx);
				if (member.lastId == targetId && totalRefreshValue != 0) {
                    memList.push(this.filterAntiMemData(member, totalRefreshValue));
                }
			} else if(type == 3) {
				let limitValue = (this.clubAntiLimit < member.antiLimit) ? this.clubAntiLimit : member.antiLimit;
				if (member.lastId == targetId && member.antiValue <= limitValue) {
					memList.push(this.filterAntiMemData(member));
				}
			} else if (type == 4) {
				let limitValue = (this.clubAntiLimit < member.antiLimit) ? this.clubAntiLimit : member.antiLimit;
				if (member.lastId == targetId && member.antiValue <= limitValue) {
					let limitTime = (Date.now() - member.antiLimitTime) / 1000;
					if (member.antiLimitTime != 0 && limitTime > 86400) {
						memList.push(this.filterAntiMemData(member));
					}
				}
			} else {
				break;
			}
		}
	}

	// 排序
	memList.sort(function(a, b){
		return b.invateCode - a.invateCode;
	});

	// 统计
	let totalValue = 0;
	for (const key in memList) {
		const element = memList[key];
		if (type == 2) {
			totalValue = totalValue + element.totalRefreshValue;
		} else {
			totalValue = totalValue + element.antiValue;
		}
	}

	let start = (pageIdx - 1) * pageNum;
	let end = start + pageNum;
	let splitList = memList.slice(start, end);
	return [splitList, memList.length, totalValue];
};