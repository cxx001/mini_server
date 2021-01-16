/**
 * Date: 2019/12/05
 * Author: admin
 * Description: 牌桌回放
 */
'use strict';
let pomelo = require('pomelo');
let lodash = require('lodash');
var logger = require('pomelo-logger').getLogger('game', 'tableReplay');

var TableReplay = function (opts) {
	this.table = opts;
	this.reset();
};

module.exports = TableReplay;
var pro = TableReplay.prototype;

pro.reset = function () {
	this.replayList = [];    // 保存一大局回放码
	this.resetGameCommand();
};

pro.resetGameCommand = function () {
	this.bufferCache = null;
	this.replayCode = 0;     // 当前小局回放码
	this.commandCount = 0;
	this.insertPos = 0;
	this.startTime = 0;
	this.endTime = 0;
};

pro.getCommandInfo = function (scores) {
	this.endTime = Date.now();
	let commandInfo = {
		replayCode: this.replayCode,
		commandCount: this.commandCount,
		startTime: this.startTime,
		endTime: this.endTime,
		clubId: this.table.clubId,
		gameId: this.table.gameId,
		tableId: this.table.id,
		playwayName: this.table.playwayCfg.playwayName,
		currentCount: this.table.currentCount,
		gameCount: this.table.gameCount,
		players: this.table.filterLocalPlayersInfo(scores),
		replayList: this.replayList,
		buffer: this.bufferCache,
		bufferSize: this.bufferCache.length,
	}
	return commandInfo;
};

pro.appendGameCommand = function (route, msg) {
	if (this.commandCount <= 0) {
		this.startTime =  Date.now();
	}
	this.commandCount = this.commandCount + 1;

	// 数据buffer
	let msgbuffer = Buffer.from(JSON.stringify(msg));
	
	// 消息头buffer
	let headStruct = {
		index: this.commandCount,
		route: route,
		msgSize: msgbuffer.length,
	}
	let headBuffer = Buffer.from(JSON.stringify(headStruct));
	
	// 头大小buffer固定4字节
	const tagBuffer = Buffer.alloc(4);
	tagBuffer.write(headBuffer.length.toString());

	// 最终消息打包buffer
	let resultBuffer = Buffer.concat([tagBuffer, headBuffer, msgbuffer]);
	if (this.bufferCache) {
		resultBuffer.copy(this.bufferCache, this.insertPos);
		this.insertPos = this.insertPos + resultBuffer.length;
	} else {
		this.bufferCache = resultBuffer;
	}
};

pro.createReplayCode = function () {
	let self = this;
	let findCount = 0;
	self.replayCode = 0;
	let generateRandomFunc = function () {
		findCount = findCount + 1;
        let tempCode = 100000 + lodash.random(1, 900000);
		pomelo.app.db.find("Replay", {"_id": tempCode}, null, null, function (err, docs) {
			if (err) {
				logger.error("Replay db find error" + err);
				return;
			}
			if (docs.length == 0) {
				self.replayCode = tempCode;
				logger.info('生成房间唯一回放码: [%d]', tempCode);
			} else {
				logger.info('生成房间唯一回放码查找次数: [%d]', findCount);
				if (findCount > 10) {
					logger.warn('生成房间唯一回放码失败!');
					return;
				}
				generateRandomFunc();
			}
		});
	}
	generateRandomFunc();
};