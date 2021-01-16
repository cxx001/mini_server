/**
 * Date: 2019/9/25
 * Author: admin
 * Description:
 */

'use strict';
let utils = require('../util/utils');
let countDownLatch = require('../../node_modules/pomelo/lib/util/countDownLatch');
let Constants = require('../../node_modules/pomelo/lib/util/constants');
let dispatcher = require('../util/dispatcher');
let logger = require('pomelo-logger').getLogger('game', __filename);
var async = require('async');

var pro = module.exports;

pro.reqUpdateLogin = function (moduleId, app, agent, msg, cb) {
    let connectorServers = app.getServersByType('connector');
    let gateServers = app.getServersByType('gate');
    let count = connectorServers.length + gateServers.length;
    let latch = countDownLatch.createCountDownLatch(count, {timeout: Constants.TIME.TIME_WAIT_COUNTDOWN}, function() {
        utils.invokeCallback(cb, null);
    });
    let callback = function() {
        latch.done();
    };
    for(let sid in connectorServers) {
        let record = connectorServers[sid];
        agent.request(record.id, moduleId, msg, callback);
    }
    for(let sid in gateServers) {
        let record = gateServers[sid];
        agent.request(record.id, moduleId, msg, callback);
    }
};

pro.reqKick = function (moduleId, app, agent, msg, cb) {
	// 大厅服
    let servers = app.getServersByType('connector');
    let list = [];
    if(servers){
        async.mapSeries(servers,function(server,callback){
            agent.request(server.id, moduleId, msg, function(err, resp){
                if(err){
                    cb(null, 'err');
                    return;
                }
                list = list.concat(resp);
                callback();
            });
        },function(err,res){
            cb(null, list);
        });
    }else{
        cb(null, list);
    }
};

pro.reqSendProps = function(moduleId, app, agent, msg, cb) {
	let connectorServers = app.getServersByType('connector');
    let count = connectorServers.length;
    let latch = countDownLatch.createCountDownLatch(count, {timeout: Constants.TIME.TIME_WAIT_COUNTDOWN}, function() {
        utils.invokeCallback(cb, null);
    });
    let callback = function() {
        latch.done();
    };
    for(let sid in connectorServers) {
        let record = connectorServers[sid];
        agent.request(record.id, moduleId, msg, callback);
    }
};

pro.reqCreateClub = function(moduleId, app, agent, msg, cb){
    let connectors = app.getServersByType('connector');
	let uid = msg.uid;
	let res = dispatcher.dispatch(String(uid), connectors);
	agent.request(res.id, moduleId, msg, function (resp) {
		utils.invokeCallback(cb, resp);
	});
};

pro.reqSetClubPlayway = function (moduleId, app, agent, msg, cb) {
	let clubId = msg.data.clubId;
	let sid = dispatcher.clubmap(clubId);
	agent.request(sid, moduleId, msg, function (resp) {
		utils.invokeCallback(cb, resp);
	});
};

pro.reqDissolveGame = function (moduleId, app, agent, msg, cb) {
	let tables = app.getServersByType('table');
	if (msg.tableId == 0) {
		let list = [];
		async.mapSeries(tables,function(server,callback){
			agent.request(server.id, moduleId, msg, function(err, resp){
				if(err){
					cb(err);
					return;
				}
				list = list.concat(resp);
				callback();
			});
		},function(err,res){
			cb(null, list);
		});
	} else {
		let curGameId = Math.floor(msg.tableId / 10000);
		let curGameIdx = Math.ceil((msg.tableId % 10000) / 999);
		for (const sid in tables) {
			let res = tables[sid];
			let tmpGameId = Number(res.id.split("-")[1]);
			let tmpGameIdx = Number(res.id.split("-")[2]);
			if (tmpGameId == curGameId && tmpGameIdx == curGameIdx) {
				agent.request(res.id, moduleId, msg, function (err, resp) {
					cb(err, resp);
				});
				return;
			}
		}
		cb('没有找到桌子. tableId = ' + msg.tableId );
	}
};