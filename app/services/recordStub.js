/**
 * Date: 2019/11/06
 * Author: admin
 * Description:
 */
'use strict';
var pomelo = require('pomelo');
var consts = require('../common/consts');
var utils = require('../util/utils')
var logger = require('pomelo-logger').getLogger('game', '__filename');

var instance = null;
const REPLAY_SAVE_DB_TIME = 60 * 1000;  // 回放存盘间隔

module.exports = function (app) {
    if (instance) {
        return instance;
    }
    return instance = new RecordStub(app);
};

var RecordStub = function (app) {
	this.app = app;
	this.replaydb = pomelo.app.db.getModel('Replay');
	this.replayCache = {};
	this.replayWaitToUpdateDB = new Set();
	this.saveReplayDBTimer = setInterval(this._onReplaySaveToDB.bind(this), REPLAY_SAVE_DB_TIME);
};

var pro  = RecordStub.prototype;

pro._onReplaySaveToDB = function () {
    if (this.replayWaitToUpdateDB.size === 0)
        return;
    let replayInfo;
    for (let id of this.replayWaitToUpdateDB) {
		replayInfo = this.replayCache[id];
		// 回放记录存储
		let prop = this.getDBProp(replayInfo);
        this.replaydb.update({_id: id}, prop, {upsert: true}, function (err, raw) {
            if (err) {
                logger.error("%s update replaydata[%o] error: %o", id, replayInfo, err);
                return;
            }
		})
    }
    this.replayWaitToUpdateDB.clear();
};

pro.getDBProp = function (replayInfo) {
	let info = {
		_id: replayInfo.replayCode,
		commandCount: replayInfo.commandCount,
		startTime: replayInfo.startTime,
		endTime: replayInfo.endTime,
        clubId: replayInfo.clubId,
        gameId: replayInfo.gameId,
        tableId: replayInfo.tableId,
        playwayName: replayInfo.playwayName,
        currentCount: replayInfo.currentCount,
        gameCount: replayInfo.gameCount,
        players: replayInfo.players,
        replayList: replayInfo.replayList,
		buffer: replayInfo.buffer,
		bufferSize: replayInfo.bufferSize,
		createdAt: Date.now() + 28800 * 1000, // 相差8小时
	}
	return info;
};

pro.addReplayInfo = function (replayCode, replayInfo, cb) {
	// TODO: 回放数据存多了发现引起数据库崩溃,暂时屏蔽
	// this.replayCache[replayCode] = replayInfo;
    // this.replayWaitToUpdateDB.add(replayCode);
    cb({code: consts.Code.OK});
};

pro.getReplayInfo = function (replayCode) {
	let self = this;
    return new Promise(function (resolve, reject) {
        if (self.replayCache[replayCode]) {
            resolve(self.replayCache[replayCode]);
        } else {
            self.replaydb.findById(replayCode, function (err, doc) {
                if (err) {
                    logger.error('get replayCode[%s] replay form db fail.', replayCode);
                    return;
                }
                if (doc) {
                    doc.replayCode = doc._id;
                    self.replayCache[replayCode] = doc;
                }
                else {
                    self.replayCache[replayCode] = null;
                }
                resolve(self.replayCache[replayCode]);
            });
        }
    });
};

pro.getRecordList = async function (recordList, cb) {
	let tempInfoList = [];
	for (const i in recordList) {
		if (recordList.hasOwnProperty(i)) {
			const recordCode = recordList[i];
			let recordInfo = await this.getReplayInfo(recordCode);
			if (recordInfo) {
				tempInfoList.push(recordInfo);
			}
		}
	}
	cb({
		code: consts.Code.OK,
		recordList: tempInfoList
	});
};