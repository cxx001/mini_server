/**
 * Date: 2019/2/11
 * Author: admin
 * Description:
 */
'use strict';
module.exports = function (app) {
    return new Remote(app);
}

var Remote = function (app) {
    this.app = app;
}

var pro  = Remote.prototype

// 登录
pro.checkin = function (openid, uid, sid, cb) {
    this.app.get('rollStub').checkin(openid, uid, sid, cb);
};

// 覆盖登入
pro.globalCheckin = function (openid, uid, sid, cb) {
	this.app.get('rollStub').globalCheckin(openid, uid, sid, cb);
};

// 重新登录
pro.relayCheckin = function (openid, uid, sid, cb) {
    this.app.get('rollStub').relayCheckin(openid, uid, sid, cb);
};

// 登出
pro.checkout = function (openid, uid, cb) {
    this.app.get('rollStub').checkout(openid, uid, cb);
};

// 获取玩家sid
pro.getUid2Sid = function (uid, cb) {
    this.app.get('rollStub').getUid2Sid(uid, cb);
};

pro.callOnlineAvtsMethod = function (...args) {
    this.app.get('rollStub').callOnlineAvtsMethod(...args);
};

//********************************游戏服记录******************************** */
// 记录游戏服信息
pro.recordGameInfo = function (uid, gameInfo, cb) {
	this.app.get('rollStub').recordGameInfo(uid, gameInfo, cb);
};

// 移除游戏服信息
pro.removeGameInfo = function (uid, cb) {
	this.app.get('rollStub').removeGameInfo(uid, cb);
};

// 获取游戏服信息
pro.getGameInfo = function (uid, cb) {
	this.app.get('rollStub').getGameInfo(uid, cb);
};
