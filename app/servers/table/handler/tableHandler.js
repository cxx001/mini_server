'use strict';
module.exports = function(app) {
	return new Handler(app);
};

var Handler = function(app) {
	this.app = app;
};

var handler = Handler.prototype;

// 游戏准备
handler.readyGame = function (msg, session, next) {
	session.table.onMessage('readyGame', next, session.uid);
};

// 出牌
handler.playCard = function (msg, session, next) {
	let bCardData = msg.bCardData;
	let bCardCount = msg.bCardCount;
	session.table.onMessage('playCard', next, session.uid, bCardData, bCardCount);
};

// 退出房间
handler.leaveRoom = function(msg, session, next) {
	session.table.onMessage('leaveRoom', next, session.uid);
};

// 解散游戏
handler.dissolveGame = function (msg, session, next) {
	session.table.onMessage('dissolveGame', next, session.uid, msg.dissolveType);
};

// 聊天交互
handler.tableChat = function (msg, session, next) {
	session.table.onMessage('tableChat', next, session.uid, msg.targetId, msg.content);
};

// 人物信息
handler.getPersonInfo = function (msg, session, next) {
	session.table.onMessage('getPersonInfo', next, msg.targetId);
};

// 手动开始游戏(牛牛)
handler.handStartGame = function (msg, session, next) {
	session.table.onMessage('handStartGame', next, session.uid);
};

// 牛牛抢庄
handler.grabBanker = function (msg, session, next) {
	session.table.onMessage('grabBanker', next, session.uid, msg.bMultiple);
};

// 牛牛下注
handler.betting = function (msg, session, next) {
	session.table.onMessage('betting', next, session.uid, msg.bBetting);
};

// 明牌
handler.showCard = function (msg, session, next) {
	session.table.onMessage('showCard', next, session.uid);
};

// 旁观者入座
handler.lookPlayerSeat = function (msg, session, next) {
	session.table.onMessage('lookPlayerSeat', next, session.uid, msg.seatId);
};