/**
 * Date: 2019/2/11
 * Author: admin
 * Description:
 */
'use strict';
var consts = require('../common/consts');
var utils = require('../util/utils')
var logger = require('pomelo-logger').getLogger('game', __filename);
var fly = require('flyio');

var instance = null;

module.exports = function (app) {
    if (instance) {
        return instance;
    }
    return instance = new RollStub(app);
};

var RollStub = function (app) {
    this.app = app;
    this.openid2sid = {};
    this.openid2uid = {};
    this.uid2sid = {};

    // if (this.app.serverType !== 'authGlobal') {
    //     setInterval(this.updateOnlineNum.bind(this), 1000 * 60 * 5);
    //     this.updateOnlineNum();
    // }
};

var pro  = RollStub.prototype;

pro.updateOnlineNum = function() {
    var mangoConfig = this.app.get('mangoConfig');
    var sid = mangoConfig.serverID;
    var url = 'http://' + mangoConfig.centerServerIP + ':' + mangoConfig.centerServerQueryPort + '/OnlineNum'
    fly.get(url, {
        sid: sid,
        num: Object.keys(this.uid2sid).length
    }).then(function (response) {
        if (response.status != 200) {
            logger.error("updateOnlineNum status error: ", response.status);
        }
    }).catch(function (error) {
        logger.error("updateOnlineNum error: ", error);
    });
};

pro.checkin = function (openid, uid, sid, cb) {
    logger.info("openid[%s] uid[%s] sid[%s] checkin.", openid, uid, sid);
    var result = consts.CheckInResult.SUCCESS;
    var formerSid = null, formerUid = null;
    if (openid in this.openid2sid) {
        result = consts.CheckInResult.ALREADY_ONLINE;
        formerSid = this.openid2sid[openid];
        formerUid = this.openid2uid[openid];
    } else {
        this.openid2sid[openid] = sid;
        this.uid2sid[uid] = sid;
        this.openid2uid[openid] = uid;
    }
    utils.invokeCallback(cb, result, formerSid, formerUid);
};

pro.globalCheckin = function (openid, uid, sid, cb) {
    logger.info("openid[%s] uid[%s] sid[%s] globalCheckin.", openid, uid, sid);
    var result = consts.CheckInResult.SUCCESS;
    this.openid2sid[openid] = sid;
    this.uid2sid[uid] = sid;
    this.openid2uid[openid] = uid;
    utils.invokeCallback(cb, result);
};

// relay角色登录
pro.relayCheckin = function (openid, uid, sid, cb) {
    logger.info("openid[%s] uid[%s] relayCheckin.", openid, uid);
    this.openid2sid[openid] = sid;
    this.uid2sid[uid] = sid;
    this.openid2uid[openid] = uid;
    cb();
};

pro.checkout = function (openid, uid, cb) {
    delete this.openid2uid[openid];
    delete this.openid2sid[openid];
    delete this.uid2sid[uid];
    utils.invokeCallback(cb);
};