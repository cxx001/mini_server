/**
 * Date: 2019/8/14
 * Author: admin
 * Description: 俱乐部管理对象
 */
'use strict';
let pomelo = require('pomelo');
let logger = require('pomelo-logger').getLogger('game', 'clubStub');
let consts = require('../common/consts');
let messageService = require('../services/messageService');
let Club = require('../entity/club');

const AUTO_SAVE_TICK = 20 * 1000;  // 存盘间隔

let ClubStub = function (app) {
	this.app = app;
	this.db = pomelo.app.db.getModel('Club');
	this.clubByCid = {};

	this.cidsWaitToUpdateDB = new Set();  // 待更新的club集合
	this.dbTimer = setInterval(function () {
        this.save();
    }.bind(this), AUTO_SAVE_TICK);  // 自动存盘
};

module.exports = ClubStub;
let pro = ClubStub.prototype;

pro.save = function () {
    if (this.cidsWaitToUpdateDB.size === 0)
        return;
    let entry;
    for (let cid of this.cidsWaitToUpdateDB) {
        entry = this.clubByCid[cid];
        this.db.update({_id: cid}, this._filterDBEntry(entry), {upsert: true}, function (err, raw) {
            if (err) {
                logger.error(cid + " save db error: " + err);
            }
        })
    }
    this.cidsWaitToUpdateDB.clear();
};

pro._filterDBEntry = function (entry) {
	let playways = [];
	for (let i = 0; i < entry["playways"].length; i++) {
		let playway = entry["playways"][i];
		playways.push(playway.filterDBPlayway());
	}

	let members = [];
	for (let i = 0; i < entry["members"].length; i++) {
		let mem = entry["members"][i];
		members.push(mem.filterDBMember());
	}

    return {
		_id: entry["id"],
		createTime: entry["createTime"],
		leaderId: entry["leaderId"],
		clubName: entry["clubName"],
		leaderName: entry["leaderName"],
		leaderUrl: entry["leaderUrl"],
		clubMode: entry["clubMode"],
		clubAntiLimit: entry["clubAntiLimit"],
		members: members,
		playways: playways,
    };
};

// 处理可能玩家已经离线
pro._saveClubIdToAvatar = function (uid, clubId) {
	pomelo.app.db.find("Avatar", {"_id": uid}, null, null, function (err, docs) {
        if (err) {
            logger.error("db find avatar error" + err);
            return;
        }
        if (docs.length == 0) {
			logger.error("db find avatar[%d] no exist.", uid);
			return;
        } else {
			// 更新入数据库
			let clubList = docs[0].clubList || [];
			clubList.push(clubId);
			let avatar = pomelo.app.db.getModel("Avatar");
			let options = {upsert: true};
			avatar.update({_id: uid}, {clubList: clubList}, options, function (err, product) {
				if (err) {
					logger.error("db update avatar error: " + err);
					return;
				}
				logger.info("db avatar update success. clubList = ", clubList);
			});
		}
	})
};

// 获取entry
pro.getEntry = function (cid, createData, isCreate, asyncUserInfo) {
	let self = this;
    return new Promise(function (resolve, reject) {
		let entry = self.clubByCid[cid];
        if (entry) {
			if (asyncUserInfo) {
				entry.updateMemInfo(asyncUserInfo);
				self.cidsWaitToUpdateDB.add(cid);
			}
            resolve(entry);
        }
        else {
            self.db.findById(cid, function (err, doc) {
                if (err) {
                    logger.error("db find cid club info error: " + err);
                    return;
                }
                // 新用户
                let entry = null;
                if (!doc && isCreate) {
                    entry = new Club(self, createData);
                    self.cidsWaitToUpdateDB.add(cid);
                    self.clubByCid[cid] = entry;
                }
                else if (doc){
					entry = new Club(self, doc);
					if (asyncUserInfo) {
						entry.updateMemInfo(asyncUserInfo);
						self.cidsWaitToUpdateDB.add(cid);
					}
                    self.clubByCid[cid] = entry;
                }
                resolve(entry);
            })
        }
    })
};

// 进入俱乐部
pro.enterClub = async function (uid, clubId, userInfo, cb) {
	let entry = await this.getEntry(clubId, null, null, userInfo);
	if (!entry) {
		cb({code: consts.ClubCode.CLUB_NO_EXIST});
		logger.warn('亲友圈[%d]不存在.', clubId);
		return;
	}

	let player = entry.getMemberByUid(uid);
	if (!player) {
		cb({code: consts.ClubCode.CLUB_PLAYER_NO_EXIST});
		logger.warn('玩家[%d]不在亲友圈[%d]中.', uid, clubId);
		return;
	}

	pomelo.app.rpc.auth.authRemote.getUid2Sid(null, uid, function (sid) {
		if (sid) {
			entry.addToChannel(uid, sid);
		} else {
			logger.info('玩家[%d]已离线.', uid);
		}
	});

	let cludData = entry.filterClubData(uid);
	cb({
		code: consts.ClubCode.OK,
		clubInfo: cludData
	});
};

// 返回大厅
pro.returnLobby = async function(uid, clubId, cb) {
	let entry = await this.getEntry(clubId);
	if (!entry) {
		cb({code: consts.ClubCode.CLUB_NO_EXIST});
		logger.warn('亲友圈[%d]不存在.', clubId);
		return;
	}

	let player = entry.getMemberByUid(uid);
	if (!player) {
		cb({code: consts.ClubCode.CLUB_PLAYER_NO_EXIST});
		logger.warn('玩家[%d]不在亲友圈[%d]中.', uid, clubId);
		return;
	}

	entry.leaveToChannel(uid);
	cb({code: consts.ClubCode.OK});
};

// 创建俱乐部
pro.createClub = async function (uid, clubId, clubName, userInfo, cb) {
	if (!clubName || clubName == "") {
		cb({code: consts.ClubCode.CLUB_NAME_ERROR});
		return;
	}

	let createData = {
		_id: clubId,
		clubName: clubName,
		leaderId: userInfo.uid,
		leaderName: userInfo.name,
		leaderUrl: userInfo.avatarUrl,
	}
	let entry = await this.getEntry(clubId, createData, true);
	entry.addMember(userInfo, consts.AddClubMemType.CREATE_INVATE_CODE);
	this.cidsWaitToUpdateDB.add(entry.id);
	let clubData = entry.filterClubData(uid);
	cb({
		code: consts.ClubCode.OK,
		clubInfo: clubData
    });
    
    pomelo.app.rpc.auth.authRemote.getUid2Sid(null, uid, (sid) => {
        if (sid) {
            pomelo.app.rpc.connector.entryRemote.onAddClubId.toServer(sid, uid, clubId, null);
        } else {
			this._saveClubIdToAvatar(uid, clubId);
		}
    });
};

// 加入俱乐部
pro.joinClub = async function (uid, clubId, userInfo, cb) {
	let entry = await this.getEntry(clubId);
	if (!entry) {
		cb({code: consts.ClubApplyCode.APPLY_NO_EXIST});
		return;
	}
	let code = entry.addMemApplyList(userInfo);
	cb(code);
};

// 邀请码加入
pro.joinClubByCode = async function (uid, clubId, invateCode, userInfo, cb) {
    let entry = await this.getEntry(clubId);
	if (!entry) {
		cb({code: consts.ClubCode.CLUB_NO_EXIST});
		return;
    }

    if (entry.getMemberByUid(uid)) {
        cb({code: consts.ClubCode.CLUB_MEM_EXIST});
		return;
    }

    let lastID = entry.bindInvateCode(uid, invateCode);
    if (!lastID) {
        cb({code: consts.ClubCode.CLUB_NO_EXIST});
		return;
    }

    entry.addMember(userInfo, consts.AddClubMemType.BIND_LAST_ID, lastID);
	this.cidsWaitToUpdateDB.add(entry.id);
	cb({
		code: consts.ClubCode.OK,
		clubInfo: entry.filterClubData(uid)
	});

	pomelo.app.rpc.auth.authRemote.getUid2Sid(null, uid, (sid) => {
        if (sid) {
            pomelo.app.rpc.connector.entryRemote.onAddClubId.toServer(sid, uid, clubId, null);
        } else {
            this._saveClubIdToAvatar(uid, clubId);
        }
    });
};

// 获取俱乐部玩家申请列表
pro.getClubCheckList = async function (uid, clubId, cb) {
	let entry = await this.getEntry(clubId);
	if (!entry) {
		cb({code: consts.ClubCode.CLUB_NO_EXIST});
		return;
	}

	let applyList = entry.getApplyList();
	cb({
		code: consts.ClubCode.OK,
		applyList: applyList
	});
};

// 申请列表同意或拒绝加入俱乐部
pro.setClubCheckResult = async function (uid, clubId, targetId, isAgree, cb) {
	let entry = await this.getEntry(clubId);
	if (!entry) {
		cb({code: consts.ClubApplyCode.APPLY_NO_EXIST});
		return;
	}

	let targetInfo = entry.removeMemApplyList(targetId);
	if (!targetInfo) {
		logger.warn('apply list no exit member = ', targetId);
		cb({code: consts.ClubApplyCode.APPLY_MEMBER_NO_EXIST});
		return;
	}
	cb(consts.ClubApplyCode.OK);

	if (isAgree) {
		entry.addMember(targetInfo);
		this.cidsWaitToUpdateDB.add(entry.id);
		pomelo.app.rpc.auth.authRemote.getUid2Sid(null, targetId, (sid) => {
			if (sid) {
				pomelo.app.rpc.connector.entryRemote.onAddClubId.toServer(sid, targetId, clubId, null);
				// 通知申请人
				let clubInfo = entry.filterClubData(uid);
				let route = "onJoinClubResult";
				let msg = {
					isAgree: isAgree,
					clubInfo: clubInfo
				}
				messageService.pushMessageToPlayer({
					uid: targetId,
					sid: sid
				}, route, msg);
			} else {
				this._saveClubIdToAvatar(targetId, clubId);
			}
		});
	}
};

// 设置俱乐部玩法
pro.setClubPlayway = async function (uid, clubId, playwayCfg, cb) {
	let entry = await this.getEntry(clubId);
	if (!entry) {
		cb({code: consts.ClubCode.CLUB_NO_EXIST});
		return;
	}

	let msg = {code: consts.ClubCode.FAIL};
	if (playwayCfg.setType == 1) {
		let playway = entry.addPlayway(playwayCfg);
		msg = {
			code: consts.ClubCode.OK,
			setType: playwayCfg.setType,
			playwayCfg: playway,
		}
	} else if (playwayCfg.setType == 2) {
		entry.removePlayway(playwayCfg.playwayId);
		msg = {
			code: consts.ClubCode.OK,
			setType: playwayCfg.setType,
			playwayId: playwayCfg.playwayId,
		}
	} else if (playwayCfg.setType == 3) {
		let playway = entry.modifyPlayway(playwayCfg);
		msg = {
			code: consts.ClubCode.OK,
			setType: playwayCfg.setType,
			playwayCfg: playway,
		}
	} else {
		msg = {code: consts.ClubCode.FAIL}
		logger.warn('setClubPlayway type[%s] no exist!', playwayCfg.setType);
	}
	this.cidsWaitToUpdateDB.add(entry.id);
	cb(msg);
	// 广播亲友圈所有人
	entry.sendChannelMessage('onSetClubPlayway', msg);
};

// 获的俱乐部玩法
pro.getClubPlayway = async function (uid, clubId, gameMode, gameId, playwayId, cb) {
	let entry = await this.getEntry(clubId);
	if (!entry) {
		cb({code: consts.ClubCode.CLUB_NO_EXIST});
		return;
	}

	let tempPlayways = [];
	for (let i = 0; i < entry["playways"].length; i++) {
		let playway = entry["playways"][i];
		if ((gameMode == playway.getGameMode()) && (gameId == 0 || playway.getGameId() == gameId) && 
			(playwayId == "0" || playway.getPlaywayId() == playwayId)) {
			tempPlayways.push(playway.filterDBPlayway());
		}
	}

	cb({
		code: consts.ClubCode.OK,
		playways: tempPlayways,
	});
};

// 获取俱乐部某个玩法
pro.getClubSinglePlayway = async function (uid, clubId, playwayId, cb) {
	let entry = await this.getEntry(clubId);
	if (!entry) {
		cb({code: consts.ClubCode.CLUB_NO_EXIST});
		return;
	}

	let playway = await entry.getPlayWayInfo(playwayId);
	if (!playway) {
		cb({code: consts.ClubCode.CLUB_PLAYWAY_NO_EXIST});
		return;
	}

	cb({
		code: consts.ClubCode.OK,
		playway: playway,
	});
};

// 获取俱乐部信息
pro.getClubInfo = async function (uid, clubId, playwayId, cb) {
	let entry = await this.getEntry(clubId);
	if (!entry) {
		cb({code: consts.ClubCode.CLUB_NO_EXIST});
		return;
	}

	let player = entry.getMemberByUid(uid);
	if (!player) {
		cb({code: consts.ClubCode.CLUB_PLAYER_NO_EXIST});
		return;
	}

	let playwayInfo = null;
	if (playwayId) {
		playwayInfo = await entry.getPlayWayInfo(playwayId);
	}

	let data = entry.filterClubData(uid);
	cb({
		code: consts.ClubCode.OK,
		clubInfo: data,
		playwayInfo: playwayInfo,
	});
};

// 刷新俱乐部桌子
pro.refreshClubTable = async function (tableInfo, cb) {
	let entry = await this.getEntry(tableInfo.clubId);
	if (!entry) {
		cb({code: consts.ClubCode.CLUB_NO_EXIST});
		return;
	}
	entry.sendChannelMessage('onRefreshClubTable', tableInfo);
	entry.addTableInfo(tableInfo);
	cb({code: consts.ClubCode.OK});
};

// 删除俱乐部桌子
pro.removeClubTable = async function (tableInfo, cb) {
	let entry = await this.getEntry(tableInfo.clubId);
	if (!entry) {
		cb({code: consts.ClubCode.CLUB_NO_EXIST});
		return;
	}
	entry.sendChannelMessage('onRemoveClubTable', tableInfo);
	entry.removeTableInfo(tableInfo.tableId);
	cb({code: consts.ClubCode.OK});
};

// 获取俱乐部桌子信息
pro.getClubTable = async function (uid, clubId, gameMode, gameId, playwayId, formerSid, cb) {
	let entry = await this.getEntry(clubId);
	if (!entry) {
		cb({code: consts.ClubCode.CLUB_NO_EXIST});
		return;
	}
	
	let tables = entry.getClubTable(gameMode, gameId, playwayId);
	//桌子排序
	tables.sort((a, b) => {
		return this.getSortIndex(a) - this.getSortIndex(b);
	});

	let tableNum = tables.length;
	let pageNum = Math.ceil(tableNum / 100);
	for (let i = 0; i < pageNum; i++) {
		let start = i * 100;
		let end = start + 100;
		end = (end > tableNum) ? tableNum : end;
		let splitList = tables.slice(start, end);
		let msg = {
			isFinish: (i + 1) >= pageNum,
			tableList: splitList
		}
		messageService.pushMessageToPlayer({
			uid: uid,
			sid: formerSid
		}, "onSliceClubTable", msg);
	}

	// cb回复先于pushMessage到达
	cb({
		code: consts.ClubCode.OK,
		tableNum: tableNum
	});
};

// 优先没满人的，然后满人的
pro.getSortIndex = function (tableInfo) {
	if (tableInfo.chairCount > tableInfo.players.length && tableInfo.currentCount < 1) {
		return -1;
	} else {
		return 999;
	}
};

// 更新俱乐部玩家在线状态
pro.refreshPlayerOnlineState = async function (uid, clubId, lastOfflineTime, cb){
	let entry = await this.getEntry(clubId);
	if (!entry) {
		logger.warn('[refreshPlayerOnlineState] clubId[%d] no exist!', clubId);
		cb({code: consts.ClubCode.CLUB_NO_EXIST});
		return;
	}
	cb({code: consts.ClubCode.OK});
	entry.refreshPlayerOnlineState(uid, lastOfflineTime);
};

// 获取名下成员
pro.getClubMember = async function (uid, clubId, pageIdx, pageNum, isOutPartner, targetId, isOutMyself, cb) {
	let entry = await this.getEntry(clubId);
	if (!entry) {
		cb({code: consts.ClubCode.CLUB_NO_EXIST});
		return;
	}

	let memberArr = entry.getClubMember(uid, pageIdx, pageNum, isOutPartner, targetId, isOutMyself);
	cb({
		code: consts.ClubCode.OK,
		members: memberArr[0],
		totalNum: memberArr[1],
		totalGameCount: memberArr[2],
		totalPayNum: memberArr[3],
		totalScore: memberArr[4]
	});
};

// 设置合伙人
pro.setClubPartner = async function (uid, clubId, targetId, cb) {
	let entry = await this.getEntry(clubId);
	if (!entry) {
		cb({code: consts.ClubCode.CLUB_NO_EXIST});
		return;
	}

	let sMem = entry.getMemberByUid(uid);
	let tMem = entry.getMemberByUid(targetId);
	if (!(sMem && tMem)) {
		cb({code: consts.ClubCode.CLUB_PLAYER_NO_EXIST});
		return;
	}

	if (!sMem.isPartner() || tMem.isPartner()) {
		cb({code: consts.ClubCode.CLUB_PERMISSION_ERROR});
		return;
	}
	tMem.setInvateCode();
	sMem.addUserToNextPartner(tMem.uid);
	cb({code: consts.ClubCode.OK});
	this.cidsWaitToUpdateDB.add(entry.id);
};

pro.getClubPartner = async function (uid, clubId, pageIdx, pageNum, userId, cb) {
	let entry = await this.getEntry(clubId);
	if (!entry) {
		cb({code: consts.ClubCode.CLUB_NO_EXIST});
		return;
	}

	let partnerArr = entry.getClubPartner(uid, pageIdx, pageNum, userId);
	cb({
		code: consts.ClubCode.OK,
		partners: partnerArr[0],
		totalNum: partnerArr[1],
		totalGameCount: partnerArr[2],
		totalPayNum: partnerArr[3]
	});
};

pro.addGameRecord = async function (uid, clubId, isWiner, settleSorce, payRoomNum, cb) {
    let entry = await this.getEntry(clubId);
	if (!entry) {
		cb({code: consts.ClubCode.CLUB_NO_EXIST});
		return;
    }
    logger.info('小结算:',uid, payRoomNum, settleSorce);
    entry.addGameRecord(uid, isWiner, settleSorce, payRoomNum);
    this.cidsWaitToUpdateDB.add(entry.id);
    cb({code: consts.ClubCode.OK});
};

pro.getGameRecord = async function (uid, clubId, timeIdx, pageIdx, pageNum, cb) {
    let entry = await this.getEntry(clubId);
	if (!entry) {
		cb({code: consts.ClubCode.CLUB_NO_EXIST});
		return;
    }
    let recordInfo = entry.getGameRecord(uid, timeIdx, pageIdx, pageNum);
    cb({
        code: consts.ClubCode.OK,
        records: recordInfo[0],
		totalNum: recordInfo[1]
    });
};

pro.findGameRecord = async function (uid, clubId, targetId, timeIdx, cb) {
	let entry = await this.getEntry(clubId);
	if (!entry) {
		cb({code: consts.ClubCode.CLUB_NO_EXIST});
		return;
	}
	
	let srcMem = entry.getMemberByUid(uid);
	let targetMem = entry.getMemberByUid(targetId);
	if (!srcMem || !targetMem) {
		cb({code: consts.ClubCode.CLUB_PLAYER_NO_EXIST});
		return;
	}

	if (targetMem.lastId != uid) {
		cb({code: consts.ClubCode.CLUB_NOT_MY_PLAYER});
		return;
	}

	let record = targetMem.getGameRecord(timeIdx);
	if (record) {
		cb({
			code: consts.ClubCode.OK,
			record: record
		})
	} else {
		cb({code: consts.ClubCode.FAIL})
	}
};

pro.findClubPlayer = async function (uid, clubId, srcUserId, targetId, findType, cb) {
	let entry = await this.getEntry(clubId);
	if (!entry) {
		cb({code: consts.ClubCode.CLUB_NO_EXIST});
		return;
	}
	
	srcUserId = (srcUserId && srcUserId != 0) ? srcUserId : uid;
	let sMem = entry.getMemberByUid(srcUserId);
	if (!sMem) {
		cb({code: consts.ClubCode.FAIL});
		logger.error('俱乐部[%d]中查找源玩家[%d]不存在!', clubId, srcUserId);
		return;
	}

	if (findType == 1) {
		// 查找合伙人
		let nextPartnerList = sMem.nextPartnerList;
		let isExist = false;
		for (const id of nextPartnerList) {
			if (id == targetId) {
				isExist = true;
				break;
			}
		}

		if (!isExist) {
			cb({code: consts.ClubCode.CLUB_PLAYER_NO_EXIST});
			return;
		}
		let tMem = entry.getMemberByUid(targetId);
		let targetInfo = entry.filterPartnerData(tMem);
		cb({
			code: consts.ClubCode.OK,
			targetInfo: targetInfo
		});

	} else {
		// 查找名下玩家
		let nextMemList = sMem.nextMemList;
		let isExist = false;
		for (const id of nextMemList) {
			if (id == targetId) {
				isExist = true;
				break;
			}
		}

		if (!isExist) {
			cb({code: consts.ClubCode.CLUB_PLAYER_NO_EXIST});
			return;
		}

		let tMem = entry.getMemberByUid(targetId);
		let targetInfo = entry.filterMemberData(tMem, sMem.getRatioValue());
		cb({
			code: consts.ClubCode.OK,
			targetInfo: targetInfo
		});
	}
};

pro.setPartnerRatioValue = async function (uid, clubId, targetId, ratioValue, cb) {
	let entry = await this.getEntry(clubId);
	if (!entry) {
		cb({code: consts.ClubCode.CLUB_NO_EXIST});
		return;
	}
	
	let srcMem = entry.getMemberByUid(uid);
	let targetMem = entry.getMemberByUid(targetId);
	// 目标是否是其名下合伙人
	let nextPartnerList = srcMem.nextPartnerList;
	let isExist = false;
	for (const id of nextPartnerList) {
		if (id == targetId) {
			isExist = true;
			break;
		}
	}
	if (!isExist) {
		cb({code: consts.ClubCode.CLUB_PLAYER_NO_EXIST});
		return;
	}
	
	// 点位取值合法判断
	let srcRatioValue = srcMem.getRatioValue();
	let targetRatioValue = targetMem.getRatioValue();
	if (ratioValue <= srcRatioValue && ratioValue >= targetRatioValue) {
		targetMem.setRatioValue(ratioValue);
		cb({
			code: consts.ClubCode.OK,
			targetData: entry.filterPartnerData(targetMem)
		});
		this.cidsWaitToUpdateDB.add(entry.id);
	} else {
		cb({
			code: consts.ClubCode.FAIL,
			srcRatioValue: srcRatioValue,
			targetRatioValue: targetRatioValue,
		});
	}
};

pro.quitClub = async function (uid, clubId, cb) {
	let entry = await this.getEntry(clubId);
	if (!entry) {
		cb({code: consts.ClubCode.CLUB_NO_EXIST});
		return;
	}

	// 上下级关系转移
	let myMem = entry.getMemberByUid(uid);
	if (myMem.lastId == 0) {
		cb({code: consts.ClubCode.CLUB_LEADER_NO_LEAVE});
		return;
	}
	let lastMem = entry.getMemberByUid(myMem.lastId);
	for (const memId of myMem.nextMemList) {
		lastMem.addUserToNextList(memId);
		let nextMem = entry.getMemberByUid(memId);
		nextMem.setLastUserID(myMem.lastId);
	}
	for (const partnerId of myMem.nextPartnerList) {
		lastMem.addUserToNextPartner(partnerId);
	}

	//　亲友圈成员列表中移除
	entry.removeMember(uid);
	pomelo.app.rpc.auth.authRemote.getUid2Sid(null, uid, (sid) => {
        if (sid) {
			pomelo.app.rpc.connector.entryRemote.onRemoveClubId.toServer(sid, uid, clubId, () => {
				cb({code: consts.ClubCode.OK});
			});
        } else {
			cb({code: consts.ClubCode.FAIL});
		}
	});
	this.cidsWaitToUpdateDB.add(entry.id);
};

pro.setClubAnnouncement = async function (uid, clubId, content, cb) {
	let entry = await this.getEntry(clubId);
	if (!entry) {
		cb({code: consts.ClubCode.CLUB_NO_EXIST});
		return;
	}

	let memInfo = entry.getMemberByUid(uid);
	if (!memInfo) {
		cb({code: consts.ClubCode.FAIL});
		logger.error('玩家[%d]不在俱乐部[%d]中.', uid, clubId);
		return;
	}

	if (!memInfo.isPartner()) {
		cb({code: consts.ClubCode.CLUB_PERMISSION_ERROR});
		return;
	}

	if (content.length > 80) {
		cb({code: consts.ClubCode.CLUB_ACCOUNT_LENGTH_LIMIT});
		return;
	}

	memInfo.setAnnouncement(content);
	cb({code: consts.ClubCode.OK});
	this.cidsWaitToUpdateDB.add(entry.id);
};

pro.setPostCardInfo = async function (uid, clubId, wxId, qqId, cb) {
	let entry = await this.getEntry(clubId);
	if (!entry) {
		cb({code: consts.ClubCode.CLUB_NO_EXIST});
		return;
	}

	let memInfo = entry.getMemberByUid(uid);
	if (!memInfo) {
		cb({code: consts.ClubCode.FAIL});
		logger.error('玩家[%d]不在俱乐部[%d]中.', uid, clubId);
		return;
	}

	if (!memInfo.isPartner()) {
		cb({code: consts.ClubCode.CLUB_PERMISSION_ERROR});
		return;
	}

	memInfo.setPostCardInfo(wxId, qqId);
	cb({code: consts.ClubCode.OK});
	this.cidsWaitToUpdateDB.add(entry.id);
};

pro.getPostCardInfo = async function (uid, clubId, targetId, cb) {
	let entry = await this.getEntry(clubId);
	if (!entry) {
		cb({code: consts.ClubCode.CLUB_NO_EXIST});
		return;
	}

	targetId = (targetId && targetId != 0) ? targetId : uid;
	let memInfo = entry.getMemberByUid(targetId);
	if (!memInfo) {
		cb({code: consts.ClubCode.FAIL});
		logger.error('玩家[%d]不在俱乐部[%d]中.', uid, clubId);
		return;
	}

	cb({
		code: consts.ClubCode.OK,
		member: memInfo.filterDBMember()
	});
};

pro.getTableInfo = async function (uid, clubId, tableId, cb) {
	let entry = await this.getEntry(clubId);
	if (!entry) {
		cb({code: consts.ClubCode.CLUB_NO_EXIST});
		return;
	}

	let tableInfos = entry.getClubTable();
	for (const info of tableInfos) {
		if (info.tableId == tableId) {
			cb({
				code: consts.ClubCode.OK,
				tableInfo: info
			});
			return;
		}
	}
	cb({code: consts.ClubCode.CLUB_TABLE_NO_EXIST});
};

pro.getSafeboxInfo = async function (uid, clubId, cb) {
	let entry = await this.getEntry(clubId);
	if (!entry) {
		cb({code: consts.ClubCode.CLUB_NO_EXIST});
		return;
	}

	let player = entry.getMemberByUid(uid);
	if (!player) {
		cb({code: consts.ClubCode.CLUB_PLAYER_NO_EXIST});
		return;
	}

	let todayRecord = player.getGameRecord(0) || {};
	let yesterdayRecord = player.getGameRecord(1) || {};
	todayRecord.totalPayNum = todayRecord.totalPayNum || 0;
	yesterdayRecord.totalPayNum = yesterdayRecord.totalPayNum || 0;
	cb({
		code: consts.ClubCode.OK,
		ratioValue: player.ratioValue,
		safeboxScore: player.safeboxScore,
		money: player.money,
		yesterdayScore: yesterdayRecord.totalPayNum,
		todayScore: todayRecord.totalPayNum,
	});
};

pro.modifySafebox = async function (uid, clubId, score, cb) {
	let entry = await this.getEntry(clubId);
	if (!entry) {
		cb({code: consts.ClubCode.CLUB_NO_EXIST});
		return;
	}

	let player = entry.getMemberByUid(uid);
	if (!player) {
		cb({code: consts.ClubCode.CLUB_PLAYER_NO_EXIST});
		return;
	}
	
	let modifyScore = player.modifyScoreSafebox(score);
	//保险箱存取
	entry.writeMemberScoreLog(4, {
		targetId: player.uid,
		targetName: player.name,
		changeScoreNum: modifyScore,
		targetRetainNum: player.money,
	});

	cb({
		code: consts.ClubCode.OK,
		modifyScore: modifyScore,
		safeboxScore: player.safeboxScore,
		money: player.money,
	});
};

pro.modifyPlayerScore = async function (uid, clubId, targetId, score, cb) {
	let entry = await this.getEntry(clubId);
	if (!entry) {
		cb({code: consts.ClubCode.CLUB_NO_EXIST});
		return;
	}

	let player = entry.getMemberByUid(targetId);
	if (!player) {
		cb({code: consts.ClubCode.CLUB_PLAYER_NO_EXIST});
		return;
	}

	if (player.lastId != uid) {
		cb({code: consts.ClubCode.CLUB_NOT_MY_PLAYER});
		return;
	}

	let laster = entry.getMemberByUid(uid);
	if (score >= 0) {
		// 增加分数
		if (laster.money < score) {
			cb({code: consts.ClubCode.FAIL});
			return;
		}
	} else {
		// 减少分数
		if (player.money < Math.abs(score)) {
			cb({code: consts.ClubCode.FAIL});
			return;
		}
	}

	player.modifyUserMoney(score);
	laster.modifyUserMoney(-score);
	// 上下分日志
	entry.writeMemberScoreLog(1, {
		operateId: laster.uid,
		operateName: laster.name,
		targetId: player.uid,
		targetName: player.name,
		changeScoreNum: score,
		operateRetainNum: laster.money,
		targetRetainNum: player.money,
	});

	cb({
		code: consts.ClubCode.OK,
		modifyScore: score,
		playerMoney: player.money,
		lasterMoney: laster.money,
	});
};

pro.getPlayerScoreLog = async function (uid, clubId, targetId, logType, splitValue, pageNum, cb) {
	let entry = await this.getEntry(clubId);
	if (!entry) {
		cb({code: consts.ClubCode.CLUB_NO_EXIST});
		return;
	}

	let player = entry.getMemberByUid(targetId);
	if (!player) {
		cb({code: consts.ClubCode.CLUB_PLAYER_NO_EXIST});
		return;
	}

	let conditions = {}
	if (logType == 0) {
		// 全部类型
		conditions = {$and:[{$or:[{"operateType":{$ne:5}},{"operateId":{$ne:targetId}}]}, {$or:[{"operateId":targetId}, {"targetId":targetId}]}], time: {$lt: splitValue}};
	} else {
		// 对应类型 1:下分、上分 2:房费 3:对局消耗 4:保险箱存取 5:下级收益
		conditions = {"operateType": logType, $or:[{"operateId": targetId}, {"targetId": targetId}], time: { $lt: splitValue }};
	}
	pomelo.app.db.find("ScoreLog", conditions, null, {sort: {time: -1}, limit: pageNum}, function (err, docs) {
		if (err) {
			logger.error('find ScoreLog error!');
			return;
		}
		
		cb({
			code: consts.ClubCode.OK,
			logList: docs
		});
	})
};

pro.leaveToChannel = async function (uid, clubId, cb) {
	let entry = await this.getEntry(clubId);
	if (!entry) {
		cb({code: consts.ClubCode.CLUB_NO_EXIST});
		return;
	}
	entry.leaveToChannel(uid);
	cb({code: consts.ClubCode.OK});
};

pro.addClubMember = async function (uid, clubId, targetInfo, cb) {
	let entry = await this.getEntry(clubId);
	if (!entry) {
		cb({code: consts.ClubCode.CLUB_NO_EXIST});
		return;
	}

	let srcMem = entry.getMemberByUid(uid);
	if (!srcMem || srcMem.invateCode == 0) {
		cb({code: consts.ClubCode.CLUB_PERMISSION_ERROR});
		return;
	}

	let targetId = targetInfo.uid;
	let targetMem = entry.getMemberByUid(targetId);
	if (targetMem) {
		cb({code: consts.ClubCode.CLUB_MEM_EXIST});
		return;
	}

	let lastID = entry.bindInvateCode(targetId, srcMem.invateCode);
    if (!lastID) {
        cb({code: consts.ClubCode.CLUB_NO_EXIST});
		return;
    }

    entry.addMember(targetInfo, consts.AddClubMemType.BIND_LAST_ID, lastID);
	this.cidsWaitToUpdateDB.add(entry.id);
	cb({code: consts.ClubCode.OK});
	
	pomelo.app.rpc.auth.authRemote.getUid2Sid(null, targetId, (sid) => {
        if (sid) {
			pomelo.app.rpc.connector.entryRemote.onAddClubId.toServer(sid, targetId, clubId, null);
			let route = "onInvitedClub";
			let msg = entry.filterClubData(targetId);
			messageService.pushMessageToPlayer({
				uid: targetId,
				sid: sid
			}, route, msg);
        } else {
            this._saveClubIdToAvatar(targetId, clubId);
        }
    });
};

pro.setClubAntiLimit = async function (uid, clubId, antiLimit, cb) {
	let entry = await this.getEntry(clubId);
	if (!entry) {
		cb({code: consts.ClubCode.CLUB_NO_EXIST});
		return;
	}

	let user = entry.getMemberByUid(uid);
	if (!user || user.lastId != 0) {
		cb({code: consts.ClubCode.CLUB_PERMISSION_ERROR});
		return;
	}

	user.setClubAntiLimit(antiLimit);
	cb({
		code: consts.ClubCode.OK,
		clubAntiLimit: antiLimit
	});
};

pro.setClubMemberAntiLimit = async function (uid, clubId, targetId, antiLimit, cb) {
	let entry = await this.getEntry(clubId);
	if (!entry) {
		cb({code: consts.ClubCode.CLUB_NO_EXIST});
		return;
	}

	let user = entry.getMemberByUid(uid);
	if (!user || user.invateCode == 0) {
		cb({code: consts.ClubCode.CLUB_PERMISSION_ERROR});
		return;
	}

	let isRelation = entry.isRelation(uid, targetId);
	if (!isRelation) {
		cb({code: consts.ClubCode.CLUB_PERMISSION_ERROR});
		return;
	}

	let mem = entry.getMemberByUid(targetId);
	if (!mem) {
		cb({code: consts.ClubCode.CLUB_PLAYER_NO_EXIST});
		return;
	}

	mem.setAntiLimit(antiLimit);
	cb({
		code: consts.ClubCode.OK,
		antiLimit: antiLimit
	});
};

pro.refreshMemberAntiValue = async function (uid, clubId, targetId, cb) {
	let entry = await this.getEntry(clubId);
	if (!entry) {
		cb({code: consts.ClubCode.CLUB_NO_EXIST});
		return;
	}

	let user = entry.getMemberByUid(uid);
	if (!user || user.invateCode == 0) {
		cb({code: consts.ClubCode.CLUB_PERMISSION_ERROR});
		return;
	}

	let isRelation = entry.isRelation(uid, targetId);
	if (!isRelation) {
		cb({code: consts.ClubCode.CLUB_PERMISSION_ERROR});
		return;
	}

	let mem = entry.getMemberByUid(targetId);
	if (!mem) {
		cb({code: consts.ClubCode.CLUB_PLAYER_NO_EXIST});
		return;
	}

	let param = {
		operateId: uid,
		operateName: user.name,
		targetId: targetId,
		targetName: mem.name,
		refreshValue: mem.antiValue,
	}
	entry.writeRefreshAntiLog(param);
	mem.refreshUserAnti();
	cb({code: consts.ClubCode.OK});
};

pro.getClubAntiMemList = async function (uid, clubId, targetId, type, pageIdx, pageNum, beginIdx, endIdx, cb) {
	let entry = await this.getEntry(clubId);
	if (!entry) {
		cb({code: consts.ClubCode.CLUB_NO_EXIST});
		return;
	}

	let list = entry.getClubAntiMemList(type, targetId, pageIdx, pageNum, beginIdx, endIdx);
	cb({
		code: consts.ClubCode.OK,
		members: list[0],
		totalCount: list[1],
		totalValue: list[2],
	});
};

pro.getMemberAntiLog = async function (uid, clubId, targetId, splitValue, pageNum, cb) {
	let entry = await this.getEntry(clubId);
	if (!entry) {
		cb({code: consts.ClubCode.CLUB_NO_EXIST});
		return;
	}

	let player = entry.getMemberByUid(targetId);
	if (!player) {
		cb({code: consts.ClubCode.CLUB_PLAYER_NO_EXIST});
		return;
	}

	let conditions = {$or:[{"operateId": targetId}, {"targetId": targetId}], time: { $lt: splitValue }};
	pomelo.app.db.find("AntiLog", conditions, null, {sort: {time: -1}, limit: pageNum}, function (err, docs) {
		if (err) {
			logger.error('find AntiLog error!');
			return;
		}
		
		cb({
			code: consts.ClubCode.OK,
			logList: docs
		});
	})
};