/**
 * Date: 2019/8/16
 * Author: admin
 * Description: 俱乐部成员类
 */
'use strict';
var pomelo = require('pomelo');
var lodash = require('lodash');
var logger = require('pomelo-logger').getLogger('game', 'clubMember');
var utils = require('../util/utils');

var ClubMember = function (club, doc) {
	this.club = club;
	this.uid = doc.uid;
	this.name = doc.name;
	this.avatarUrl = doc.avatarUrl;
	this.wxId = doc.wxId || "";
	this.qqId = doc.qqId || "";
	this.joinTime = doc.joinTime || Date.now();
	this.lastOfflineTime = doc.lastOfflineTime || Date.now();
    this.invateCode = doc.invateCode || 0;
    this.lastId = doc.lastId || 0;
	this.nextMemList = doc.nextMemList || [];
    this.nextPartnerList = doc.nextPartnerList || [];
	this.recordList = doc.recordList || [];
	this.ratioValue = doc.ratioValue || 0;  //分成比例(0-100)
	this.announcement = doc.announcement || "";
	this.safeboxScore = doc.safeboxScore || 0; //保险箱存储积分
	this.money = doc.money || 0;  //用户积分(福卡)
	this.antiValue = doc.antiValue || 0;  //沉迷值
	this.antiLimit = doc.antiLimit || 0;  //沉迷值限制
	this.antiLimitTime = doc.antiLimitTime || 0; //达到沉迷值下限时间
	this.antiValueList = doc.antiValueList || []; //7天沉迷值刷新统计
};

module.exports = ClubMember;
var pro = ClubMember.prototype;

pro.filterDBMember = function () {
    return {
		uid: this.uid,
		name: this.name,
		avatarUrl: this.avatarUrl,
		wxId: this.wxId,
		qqId: this.qqId,
		joinTime: this.joinTime,
		lastOfflineTime: this.lastOfflineTime,
        invateCode: this.invateCode,
		lastId: this.lastId,
		ratioValue: this.ratioValue,
		announcement: this.announcement,
		nextMemList: this.nextMemList,
        nextPartnerList: this.nextPartnerList,
		recordList: this.recordList,
		safeboxScore: this.safeboxScore,
		money: this.money,
		antiValue: this.antiValue,
		antiLimit: this.antiLimit,
		antiValueList: this.antiValueList,
    };
};

pro.updateMemberData = function (data) {
	for (let key in data) {
		if (this[key]) {
			this[key] = data[key];
		}
    }
};

pro.setInvateCode = function (dwCode) {
	if (!dwCode) {
		this._createRandomCode();
	} else {
		this.invateCode = dwCode;
	}
};

// 0:群主 1:管理员 2:合伙人 3:普通成员
pro.getOffer = function () {
	if (this.lastId == 0) {
		return 0;
	} else if(false) {
		return 1;
	} else if(this.invateCode != 0) { 
		return 2;
	} else {
		return 3;
	}
};

pro.addUserToNextPartner = function (nextPartnerID) {
	this.nextPartnerList.push(nextPartnerID);
    logger.info('用户[%d]绑定下级合伙人[%d].', this.uid, nextPartnerID);
};

pro._createRandomCode = function () {
	let self = this;
	let findCount = 0;
	let generateRandomFunc = function () {
		findCount = findCount + 1;
        let tempCode = 10000 + lodash.random(1, 90000);
        tempCode = self.club.id * 100000 + tempCode;
		pomelo.app.db.find("Club", {"members.invateCode": tempCode}, null, null, function (err, docs) {
			if (err) {
				logger.error("Club db find invateCode error" + err);
				return;
			}
			if (docs.length == 0) {
				self.invateCode = tempCode;
				logger.info('用户[%d]生成邀请码: [%d]', self.uid, tempCode);
			} else {
				logger.info('用户[%d]查找次数: [%d]', self.uid, findCount);
				if (findCount > 10) {
					logger.warn('生成邀请码失败!');
					return;
				}
				generateRandomFunc();
			}
		});
	}
	generateRandomFunc();
};

pro.addUserToNextList = function (nextID) {
    this.nextMemList.push(nextID);
    logger.info('用户[%d]绑定下级[%d].', this.uid, nextID);
};

pro.setLastUserID = function (lastID) {
    this.lastId = lastID;
    logger.info('用户[%d]绑定上级[%d].', this.uid, lastID);
};

pro.isPartner = function () {
	return (this.invateCode != 0);
};

pro.setRatioValue = function (percent) {
	this.ratioValue = percent;
};

pro.getRatioValue = function () {
	return this.ratioValue;
};

pro.addGameRecord = function (isWiner, settleSorce, payRoomNum) {
    logger.info('用户[%d]游戏记录:',this.uid, isWiner, settleSorce, payRoomNum);
    let firstCeil = this.recordList[0];
    if (!firstCeil || utils.judgeTime(firstCeil.lastTime) != 0) {
        this.recordList.unshift({
            winCount: isWiner ? 1: 0,
            gameCount: 1,
			totalSorce: settleSorce,
			totalPayNum: payRoomNum,
            lastTime: Date.now(),
        });
    } else {
        if (isWiner) {
            firstCeil.winCount++;
		}
		firstCeil.gameCount++;
		firstCeil.totalSorce = firstCeil.totalSorce + settleSorce;
		firstCeil.totalPayNum = firstCeil.totalPayNum + payRoomNum;
    }

    // 保存5天游戏记录
    if (this.recordList.length > 5) {
        this.recordList.splice(5, this.recordList.length-5);
	}
};

// timeIdx:0-4 今天，昨天，前天，前两天，前三天
pro.getGameRecord = function (timeIdx) {
    for (let i = 0; i < this.recordList.length; i++) {
        const element = this.recordList[i];
        if (utils.judgeTime(element.lastTime) == timeIdx) {
            let recordList = utils.clone(element);
            recordList.uid = this.uid;
            recordList.name = this.name;
            recordList.avatarUrl = this.avatarUrl;
            return recordList;
        }
    }
    return null;
};

// 设置公告
pro.setAnnouncement = function (content) {
	this.announcement = content;
};

// 得到公告
pro.getAnnouncement = function () {
	return this.announcement;
};

// 设置名片信息
pro.setPostCardInfo = function (wxId, qqId) {
	this.wxId = wxId;
	this.qqId = qqId;
};

// 修改用户积分
pro.modifyUserMoney = function (score) {
    this.money = this.money + score;
};

// 修改保险分
pro.modifyScoreSafebox = function (score) {
	let tempScore = this.safeboxScore + score;
	let tempMoney = this.money - score;
	if (score >= 0) {
		if (tempMoney < 0) {
			score = this.money;
		}
	} else {
		if (tempScore < 0) {
			score = -this.safeboxScore;
		}
	}
	this.safeboxScore = this.safeboxScore + score;
	this.money = this.money - score;
	return score;
};

// 修改用户沉迷值
pro.modifyUserAnti = function (antiValue) {
	this.antiValue = this.antiValue + antiValue;
	// 记录低于限制值时时间
	let limitValue = (this.club.clubAntiLimit < this.antiLimit) ? this.club.clubAntiLimit : this.antiLimit;
	if (this.antiValue < limitValue) {
		this.antiLimitTime = Date.now();
	} else {
		this.antiLimitTime = 0;
	}
};

// 设置沉迷值限制
pro.setAntiLimit = function (antiLimit) {
	this.antiLimit = antiLimit;
};

// 刷新用户沉迷值
pro.refreshUserAnti = function () {
    this.addAntiValueRecord(this.antiValue);
	this.antiValue = 0;
    this.antiLimitTime = 0;
};

pro.addAntiValueRecord = function (refreshValue) {
    if (refreshValue == 0) {
        return;
    }

    let firstCeil = this.antiValueList[0];
    if (!firstCeil || utils.judgeTime(firstCeil.lastTime) != 0) {
        this.antiValueList.unshift({
			totalValue: refreshValue,
            lastTime: Date.now(),
        });
    } else {
		firstCeil.totalValue = firstCeil.totalValue + refreshValue;
    }

    // 保存5天游戏记录
    if (this.antiValueList.length > 7) {
        this.antiValueList.splice(7, this.antiValueList.length-7);
	}
};

// timeIdx:0-6 今天，昨天，前天，前两天，前三天, 前四天, 前五天
pro.getAntiValueRecord = function (beginIdx, endIdx) {
	let totalValue = 0;
    for (let i = 0; i < this.antiValueList.length; i++) {
        const element = this.antiValueList[i];
        if (utils.judgeTime(element.lastTime) <= beginIdx && utils.judgeTime(element.lastTime) >= endIdx) {
            totalValue = totalValue + element.totalValue;
        }
    }
    return totalValue;
};