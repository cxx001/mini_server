/**
 * Date: 2019/2/14
 * Author: admin
 * Description: 大厅相关接口
 */
'use strict';
module.exports = function(app) {
    return new Handler(app);
};

var Handler = function(app) {
    this.app = app;
};

var handler = Handler.prototype;

handler.getRankList = function (msg, session, next) {
	session.avatar.lobby.getRankList(msg.rankType, msg.pageIdx, msg.pageNum, next);
};

handler.getRecordList = function (msg, session, next) {
	session.avatar.lobby.getRecordList(msg.recordType, next);
};

handler.getRecordDetails = function (msg, session, next) {
	session.avatar.lobby.getRecordDetails(msg.recordList, next);
};

handler.getRecordInfo = function (msg, session, next) {
	session.avatar.lobby.getRecordInfo(msg.recordCode, next);
};

handler.checkIsPlaying = function (msg, session, next) {
	session.avatar.lobby.checkIsPlaying(session.uid, next);		
};

handler.enterGame = function (msg, session, next) {
	session.avatar.lobby.enterGame(session.uid, msg, next);
};

handler.findUserInfo = function (msg, session, next) {
	session.avatar.lobby.findUserInfo(msg.targetId, next);
};