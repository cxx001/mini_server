/**
 * Date: 2019/8/14
 * Author: admin
 * Description:
 */
'use strict';
module.exports = function(app) {
    return new Remote(app);
};

var Remote = function(app) {
    this.app = app;
};

var pro = Remote.prototype;

pro.createClub = function (uid, clubId, clubName, userInfo, cb) {
    this.app.clubStub.createClub(uid, clubId, clubName, userInfo, cb);
};

pro.joinClub = function (uid, clubId, userInfo, cb) {
	this.app.clubStub.joinClub(uid, clubId, userInfo, cb);
};

pro.joinClubByCode = function (uid, clubId, invateCode, userInfo, cb) {
    this.app.clubStub.joinClubByCode(uid, clubId, invateCode, userInfo, cb);
};

pro.enterClub = function (uid, clubId, userInfo, cb) {
    this.app.clubStub.enterClub(uid, clubId, userInfo, cb);
};

pro.returnLobby = function (uid, clubId, cb) {
    this.app.clubStub.returnLobby(uid, clubId, cb);
};

pro.setClubPlayway = function (uid, clubId, playwayCfg, cb) {
	this.app.clubStub.setClubPlayway(uid, clubId, playwayCfg, cb);
};

pro.getClubPlayway = function (uid, clubId, gameMode, gameId, playwayId, cb) {
	this.app.clubStub.getClubPlayway(uid, clubId, gameMode, gameId, playwayId, cb);
};

pro.getClubSinglePlayway = function (uid, clubId, playwayId, cb) {
	this.app.clubStub.getClubSinglePlayway(uid, clubId, playwayId, cb);
}

pro.getClubInfo = function (uid, clubId, playwayId,  cb) {
	this.app.clubStub.getClubInfo(uid, clubId, playwayId, cb);
};

pro.getClubTable = function (uid, clubId, gameMode, gameId, playwayId, formerSid, cb) {
	this.app.clubStub.getClubTable(uid, clubId, gameMode, gameId, playwayId, formerSid, cb);
};

pro.refreshClubTable = function (tableInfo, cb) {
	this.app.clubStub.refreshClubTable(tableInfo, cb);
};

pro.removeClubTable = function (tableInfo, cb) {
	this.app.clubStub.removeClubTable(tableInfo, cb);
};

pro.getClubCheckList = function (uid, clubId, cb) {
	this.app.clubStub.getClubCheckList(uid, clubId, cb);
};

pro.setClubCheckResult = function (uid, clubId, targetId, isAgree, cb) {
	this.app.clubStub.setClubCheckResult(uid, clubId, targetId, isAgree, cb);
};

pro.refreshPlayerOnlineState = function (uid, clubId, lastOfflineTime, cb) {
	this.app.clubStub.refreshPlayerOnlineState(uid, clubId, lastOfflineTime, cb);
};

pro.getClubMember = function (uid, clubId, pageIdx, pageNum, isOutPartner, targetId, isOutMyself, cb) {
	this.app.clubStub.getClubMember(uid, clubId, pageIdx, pageNum, isOutPartner, targetId, isOutMyself, cb);
};

pro.setClubPartner = function (uid, clubId, targetId, cb) {
	this.app.clubStub.setClubPartner(uid, clubId, targetId, cb);
};

pro.getClubPartner = function (uid, clubId, pageIdx, pageNum, userId, cb) {
	this.app.clubStub.getClubPartner(uid, clubId, pageIdx, pageNum, userId, cb);
};

pro.addGameRecord = function (uid, clubId, isWiner, settleSorce, payRoomNum, cb) {
    this.app.clubStub.addGameRecord(uid, clubId, isWiner, settleSorce, payRoomNum, cb);
};

// timeIdx:0-4 今天，昨天，前天，前两天，前三天
pro.getGameRecord = function (uid, clubId, timeIdx, pageIdx, pageNum, cb) {
    this.app.clubStub.getGameRecord(uid, clubId, timeIdx, pageIdx, pageNum, cb);
};

pro.findGameRecord = function (uid, clubId, targetId, timeIdx, cb) {
	this.app.clubStub.findGameRecord(uid, clubId, targetId, timeIdx, cb);
};

pro.findClubPlayer = function (uid, clubId, srcUserId, targetId, findType, cb) {
	this.app.clubStub.findClubPlayer(uid, clubId, srcUserId, targetId, findType, cb);
};

pro.setPartnerRatioValue = function (uid, clubId, targetId, ratioValue, cb) {
	this.app.clubStub.setPartnerRatioValue(uid, clubId, targetId, ratioValue, cb);
};

pro.quitClub = function (uid, clubId, cb) {
	this.app.clubStub.quitClub(uid, clubId, cb);
};

pro.setClubAnnouncement = function (uid, clubId, content, cb) {
	this.app.clubStub.setClubAnnouncement(uid, clubId, content, cb);
};

pro.setPostCardInfo = function (uid, clubId, wxId, qqId, cb) {
	this.app.clubStub.setPostCardInfo(uid, clubId, wxId, qqId, cb);
};

pro.getPostCardInfo = function (uid, clubId, targetId, cb) {
	this.app.clubStub.getPostCardInfo(uid, clubId, targetId, cb);
};

pro.getTableInfo = function (uid, clubId, tableId, cb) {
	this.app.clubStub.getTableInfo(uid, clubId, tableId, cb);
};

pro.getSafeboxInfo = function (uid, clubId, cb) {
	this.app.clubStub.getSafeboxInfo(uid, clubId, cb);
};

pro.modifySafebox = function (uid, clubId, score, cb) {
	this.app.clubStub.modifySafebox(uid, clubId, score, cb);
};

pro.modifyPlayerScore = function (uid, clubId, targetId, score, cb) {
	this.app.clubStub.modifyPlayerScore(uid, clubId, targetId, score, cb);
};

pro.getPlayerScoreLog = function (uid, clubId, targetId, logType, splitValue, pageNum, cb) {
	this.app.clubStub.getPlayerScoreLog(uid, clubId, targetId, logType, splitValue, pageNum, cb);
};

pro.leaveToChannel = function (uid, clubId, cb) {
	this.app.clubStub.leaveToChannel(uid, clubId, cb);
};

pro.addClubMember = function (uid, clubId, targetInfo, cb) {
	this.app.clubStub.addClubMember(uid, clubId, targetInfo, cb);
};

pro.setClubAntiLimit = function (uid, clubId, antiLimit, cb) {
	this.app.clubStub.setClubAntiLimit(uid, clubId, antiLimit, cb);
};

pro.setClubMemberAntiLimit = function (uid, clubId, targetId, antiLimit, cb) {
	this.app.clubStub.setClubMemberAntiLimit(uid, clubId, targetId, antiLimit, cb);
};

pro.refreshMemberAntiValue = function (uid, clubId, targetId) {
	this.app.clubStub.refreshMemberAntiValue(uid, clubId, targetId, cb);
};

pro.getClubAntiMemList = function (uid, clubId, targetId, type, pageIdx, pageNum, beginIdx, endIdx, cb) {
	this.app.clubStub.getClubAntiMemList(uid, clubId, targetId, type, pageIdx, pageNum, beginIdx, endIdx, cb);
};

pro.getMemberAntiLog = function (uid, clubId, targetId, splitValue, pageNum, cb) {
	this.app.clubStub.getMemberAntiLog(uid, clubId, targetId, splitValue, pageNum, cb);
};