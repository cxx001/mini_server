/**
 * Date: 2019/8/16
 * Author: admin
 * Description: 俱乐部玩法类
 */
'use strict';
var pomelo = require('pomelo');
var logger = require('pomelo-logger').getLogger('game', 'clubPlayway');
var ObjectId = require('mongoose').Types.ObjectId;

var ClubPlayway = function (club, cfg) {
	this.club = club;
	this.id = cfg.id || ObjectId().toString();
	this.setPlaywayCfg(cfg);
};

module.exports = ClubPlayway;
var pro = ClubPlayway.prototype;

pro.setPlaywayCfg = function (cfg) {
	logger.info('玩法配置:', cfg);
    //公共参数
    this.clubId = cfg.clubId;
    this.gameId = cfg.gameId;
	this.playwayName = cfg.playwayName;
	this.gameMode = cfg.gameMode;  // 0 普通场 1 积分场
	this.payMode = cfg.payMode;  // 房费模式 0不扣 1大赢家 2所有赢家 3AA制
	this.payLimit = cfg.payLimit; // 大于多少扣房费
	this.payCount = cfg.payCount; // 扣多少房费
	this.isPercentage = cfg.isPercentage; //是否百分比扣
	this.sorceCell = cfg.sorceCell;  // 倍率
    this.lowerLimit = cfg.lowerLimit; // 下限
    this.roomCardNum = cfg.roomCardNum; //官方收房费(折算到每一小局)

	//游戏参数
	this.gameParameter = cfg.gameParameter;
};

pro.filterDBPlayway = function () {
	return {
		id: this.id,
		clubId: this.clubId,
        gameId: this.gameId,
		playwayName: this.playwayName,
		gameMode: this.gameMode,
		payMode: this.payMode,
		payLimit: this.payLimit,
		payCount: this.payCount,
		isPercentage: this.isPercentage,
		sorceCell: this.sorceCell,
        lowerLimit: this.lowerLimit,
        roomCardNum: this.roomCardNum,
		gameParameter: this.gameParameter,
	};
};

pro.getGameId = function () {
	return this.gameId;	
};

pro.getGameMode = function () {
	return this.gameMode;
};

pro.getPlaywayId = function () {
	return this.id;	
};


