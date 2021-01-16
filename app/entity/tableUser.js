/**
 * Date: 2019/8/20
 * Author: admin
 * Description: 牌桌玩家类
 */
'use strict';
var pomelo = require('pomelo');
var logger = require('pomelo-logger').getLogger('game', 'tableUser');
let consts = require('../common/consts');

var TableUser = function (table, user, oldUser) {
    oldUser = oldUser || {};
    this.table = table;
	this.user = user;
	this.uid = user.uid;
	this.sid = user.sid;
	this.name = user.name;
	this.gender = user.gender;
	this.avatarUrl = user.avatarUrl;
	this.gameCount = user.gameCount;  //总游戏次数
	this.winCount = user.winCount;
	this.failCount = user.failCount;
    this.chairID = oldUser.chairID || consts.INVALID_CHAIR;
	this.dissolveState = oldUser.dissolveState || consts.DissolveState.Diss_Init;
	this.readyState = oldUser.readyState || consts.ReadyState.Ready_No;
	
	// 当前房间统计
	this.sorce = oldUser.sorce || 0;  // 当前总分数
	this.curWinCount = oldUser.curWinCount || 0; 
	this.curFailCount = oldUser.curFailCount || 0;
	this.curBombCount = oldUser.curBombCount || 0;

	// 牛牛操作
	this.bMultiple = oldUser.bMultiple || -1;  // 抢庄倍率 -1:没有操作 0:不抢 1-3倍率
	this.bBetting = oldUser.bBetting || 0;  // 下注倍数 0:还没有下注  1-4倍
	this.isShowCard = oldUser.isShowCard || false; // 是否已经明牌
};

module.exports = TableUser;
var pro = TableUser.prototype;

pro.resetNNData = function() {
	this.bMultiple = -1;
	this.bBetting = 0;
	this.isShowCard = false;
};

pro.filterPlayerInfo = function () {
	return {
		uid: this.uid,
		name: this.name,
		gender: this.gender,
		avatarUrl: this.avatarUrl,
		gameCount: this.gameCount,
		winCount: this.winCount,
		failCount: this.failCount,
		chairID: this.chairID,
		dissolveState: this.dissolveState,
		readyState: this.readyState,
		sorce: this.sorce,
		curWinCount: this.curWinCount,
		curFailCount: this.curFailCount,
		curBombCount: this.curBombCount,
		multiple: this.bMultiple,
		betting: this.bBetting,
		isShowCard: this.isShowCard,
	}
};

pro.filterBasePlayerInfo = function () {
	return {
		uid: this.uid,
		name: this.name,
	}
};

pro.setUserInfo = function (user) {
	this.uid = user.uid;
	this.sid = user.sid;
	this.name = user.name;
	this.gender = user.gender;
	this.avatarUrl = user.avatarUrl;
	this.gameCount = user.gameCount;
	this.winCount = user.winCount;
	this.failCount = user.failCount;
};

pro.isRobot = function () {
	let openid = this.user.openid;
	if (openid.indexOf("robot_") != -1) {
		return true;
	}
	return false;
};

pro.getUserUid = function () {
	return this.uid;
};

pro.getUserSid = function () {
	return this.sid;
};

pro.setUserSid = function (sid) {
	this.sid = sid;
};

pro.setUserChairID = function (chairId) {
	this.chairID = chairId;
};

pro.getUserChairId = function () {
	return this.chairID;
};

pro.setPlayerReadyState = function (state) {
	this.readyState = state;
};

pro.getPlayerReadyState = function () {
	return this.readyState;
};

pro.setPlayerDissolveState = function (state) {
	this.dissolveState = state;
};

pro.concludeScore = function (sorce) {
	this.sorce = this.sorce + sorce;
};

pro.concludeCurWinCount = function () {
    this.gameCount++;
    this.winCount++;
    this.curWinCount++;
};

pro.concludeCurFailCount = function () {
    this.gameCount++;
    this.failCount++;
    this.curFailCount++;
};

pro.concludeCurBombCount = function (curBombCount) {
	this.curBombCount = this.curBombCount + curBombCount;
};

pro.setMultiple = function (bMultiple) {
	this.bMultiple = bMultiple;
};

pro.getMultiple = function () {
	return this.bMultiple;
};

pro.setBetting = function (bBetting) {
	this.bBetting = bBetting;
};

pro.getBetting = function () {
	return this.bBetting;
};

pro.setShowCard = function (isShowCard) {
	this.isShowCard = isShowCard;
};

pro.getShowCard = function () {
	return this.isShowCard;	
};