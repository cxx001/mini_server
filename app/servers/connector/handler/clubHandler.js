/**
 * Date: 2019/08/06
 * Author: admin
 * Description: 亲友圈相关接口
 */
'use strict';
module.exports = function(app) {
    return new Handler(app);
};

var Handler = function(app) {
    this.app = app;
};

var handler = Handler.prototype;

// 获得俱乐部列表
handler.getClubList = function (msg, session, next) {
    session.avatar.club.getClubList(next);
};

// 进入俱乐部
handler.enterClub = function (msg, session, next) {
    session.avatar.club.enterClub(msg.clubId, next);
};

// 离开俱乐部(返回大厅)
handler.returnLobby = function (msg, session, next) {
    session.avatar.club.returnLobby(msg.clubId, next);
};

// 创建俱乐部
handler.createClub = function (msg, session, next) {
    session.avatar.club.createClub(msg.clubName, next);
};

// 加入俱乐部
handler.joinClub = function (msg, session, next) {
    session.avatar.club.joinClub(msg.clubId, next);
};

// 获取俱乐部申请列表
handler.getClubCheckList = function (msg, session, next) {
    session.avatar.club.getClubCheckList(msg.clubId, next);
};

// 申请列表同意或拒绝加入俱乐部
handler.setClubCheckResult = function (msg, session, next) {
    session.avatar.club.setClubCheckResult(msg.clubId, msg.targetId, msg.isAgree, next);
};

// 邀请码加入俱乐部
handler.joinClubByCode = function (msg, session, next) {
    session.avatar.club.joinClubByCode(msg.invateCode, next);
};

// 退出俱乐部
handler.quitClub = function (msg, session, next) {
    session.avatar.club.quitClub(msg.clubId, next);
};

// 获取俱乐部玩法
handler.getClubPlayway = function (msg, session, next) {
	let clubId = msg.clubId;
	let gameMode = msg.gameMode || 0; // 0 普通场 1 积分场
    let gameId = msg.gameId || 0;  // 默认0是全部游戏
    let playwayId = msg.playwayId || "0"; //默认全部玩法
	session.avatar.club.getClubPlayway(clubId, gameMode, gameId, playwayId, next);
};

// 获取俱乐部桌子
handler.getClubTable = function (msg, session, next) {
    session.avatar.club.getClubTable(msg.clubId, msg.gameMode, msg.gameId, msg.playwayId, next);
};

// 获取成员 targetId：获取指定人名下成员,默认获取请求者名下成员
handler.getClubMember = function (msg, session, next) {
	session.avatar.club.getClubMember(msg.clubId, msg.pageIdx, msg.pageNum, msg.isOutPartner, msg.targetId, msg.isOutMyself, next);
};

// 设置合伙人
handler.setClubPartner = function (msg, session, next) {
	session.avatar.club.setClubPartner(msg.clubId, msg.targetId, next);
};

// 获取合伙人
handler.getClubPartner = function (msg, session, next) {
	session.avatar.club.getClubPartner(msg.clubId, msg.pageIdx, msg.pageNum, msg.userId, next);
};

// 获取记录
handler.getGameRecord = function (msg, session, next) {
    session.avatar.club.getGameRecord(msg.clubId, msg.timeIdx, msg.pageIdx, msg.pageNum, next);
};

// 查找游戏记录
handler.findGameRecord = function (msg, session, next) {
    session.avatar.club.findGameRecord(msg.clubId, msg.targetId, msg.timeIdx, next);
};

// 查找玩家 findType: 0 名下所有成员中查找(默认)  1 名下合伙人中查找  
handler.findClubPlayer = function (msg, session, next) {
	session.avatar.club.findClubPlayer(msg.clubId, msg.srcUserId, msg.targetId, msg.findType, next);
};

// 设置合伙人点位
handler.setPartnerRatioValue = function (msg, session, next) {
    session.avatar.club.setPartnerRatioValue(msg.clubId, msg.targetId, msg.ratioValue, next);
};

// 设置公告
handler.setClubAnnouncement = function (msg, session, next) {
	session.avatar.club.setClubAnnouncement(msg.clubId, msg.content, next);
};

// 设置名片信息
handler.setPostCardInfo = function (msg, session, next) {
	session.avatar.club.setPostCardInfo(msg.clubId, msg.wxId, msg.qqId, next);
};

// 获取名片信息
handler.getPostCardInfo = function (msg, session, next) {
	session.avatar.club.getPostCardInfo(msg.clubId, msg.targetId, next);
};

// 通过tableId获取桌子信息
handler.getTableInfo = function (msg, session, next) {
	session.avatar.club.getTableInfo(msg.clubId, msg.tableId, next);
};

// 获取保险箱信息
handler.getSafeboxInfo = function (msg, session, next) {
	session.avatar.club.getSafeboxInfo(msg.clubId, next);
};

// 存取保险箱
handler.modifySafebox = function (msg, session, next) {
	session.avatar.club.modifySafebox(msg.clubId, msg.score, next);
};

// 修改成员积分
handler.modifyPlayerScore = function (msg, session, next) {
    session.avatar.club.modifyPlayerScore(msg.clubId, msg.targetId, msg.score, next);
};

// 玩家积分日志
handler.getPlayerScoreLog = function (msg, session, next) {
    session.avatar.club.getPlayerScoreLog(msg.clubId, msg.targetId, msg.logType, msg.splitValue, msg.pageNum, next);
};

// 添加成员
handler.addClubMember = function (msg, session, next) {
    session.avatar.club.addClubMember(msg.clubId, msg.targetInfo, next);
};

// 设置亲友圈沉迷值限制
handler.setClubAntiLimit = function (msg, session, next) {
    session.avatar.club.setClubAntiLimit(msg.clubId, msg.antiLimit, next);
};

// 设置亲友圈成员沉迷值限制
handler.setClubMemberAntiLimit = function (msg, session, next) {
    session.avatar.club.setClubMemberAntiLimit(msg.clubId, mst.targetId, msg.antiLimit, next);
};

// 刷新亲友圈成员沉迷值
handler.refreshMemberAntiValue = function (msg, session, next) {
    session.avatar.club.refreshMemberAntiValue(msg.clubId, mst.targetId, next);
};

// 获取沉迷值列表 type 1:沉迷列表 2 刷新统计 3 限制列表 4 异常列表
handler.getClubAntiMemList = function (msg, session, next) {
    session.avatar.club.getClubAntiMemList(msg.clubId, mst.targetId, msg.type, msg.pageIdx, msg.pageNum, msg.beginIdx, msg.endIdx, next);
};

//获取沉迷值刷新日志
handler.getMemberAntiLog = function (msg, session, next) {
    session.avatar.club.getMemberAntiLog(msg.clubId, msg.targetId, msg.splitValue, msg.pageNum, next);
};