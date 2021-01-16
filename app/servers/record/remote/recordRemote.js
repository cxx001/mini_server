/**
 * Date: 2019/11/06
 * Author: admin
 * Description: 记录日志
 */
'use strict';
module.exports = function(app) {
    return new Remote(app);
};

var Remote = function(app) {
    this.app = app;
};

var pro = Remote.prototype;

pro.addReplayInfo = function (replayId, replayInfo, cb) {
	this.app.recordStub.addReplayInfo(replayId, replayInfo, cb);
};

pro.getRecordList = function (recordList, cb) {
	this.app.recordStub.getRecordList(recordList, cb);
};