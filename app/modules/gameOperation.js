/**
 * Date: 2019/3/13
 * Author: admin
 * Description: 常用的运维操作放到这里
 */
'use strict';

let utils = require('../../node_modules/pomelo/lib/util/utils');
let logger = require('pomelo-logger').getLogger('game', __filename);
let reqMsg = require('./gameOperationReq');
let retMsg = require('./gameOperationRet');

module.exports = function (opts) {
    return new Module(opts);
};

module.exports.moduleId = 'gameOperation';

let Module = function (opts) {
    opts = opts || {};
    this.app = opts.app;
};

Module.prototype.clientHandler = function (agent, msg, cb) {
    let app = this.app;
    logger.info('game operation, msg: %o', msg);
    switch (msg.signal) {
        case 'updateLogin':
            reqMsg.reqUpdateLogin(module.exports.moduleId, app, agent, msg, cb);
            break;
        case 'kick':
			reqMsg.reqKick(module.exports.moduleId, app, agent, msg, cb);
			break;
		case 'props':
			reqMsg.reqSendProps(module.exports.moduleId, app, agent, msg, cb);
			break;
		case 'createClub':
			reqMsg.reqCreateClub(module.exports.moduleId, app, agent, msg, cb);
			break;
		case 'playway':
			reqMsg.reqSetClubPlayway(module.exports.moduleId, app, agent, msg, cb);
			break;
		case 'dissolve':
			reqMsg.reqDissolveGame(module.exports.moduleId, app, agent, msg, cb);
			break;
        default:
            logger.error('game operation unknow signal: ' + msg.signal);
            utils.invokeCallback(cb, new Error('The command cannot be recognized, please check.'), null);
    }
};

Module.prototype.monitorHandler = function (agent, msg, cb) {
    let app = this.app;
    switch (msg.signal) {
        case 'updateLogin':
            retMsg.retUpdateLogin(app, agent, msg, cb);
            break;
        case 'kick':
            retMsg.retKick(app, agent, msg, cb);
			break;
		case 'props':
			retMsg.retSendProps(app, agent, msg, cb);
			break;
		case 'createClub':
			retMsg.retCreateClub(app, agent, msg, cb);
			break;
		case 'playway':
			retMsg.retSetClubPlayway(app, agent, msg, cb);
			break;
		case 'dissolve':
			retMsg.retDissolveGame(app, agent, msg, cb);
			break;
        default:
			logger.error('receive error signal: %j', msg);
			utils.invokeCallback(cb, new Error('The signal cannot be recognized, please check.'), null);
    }
};
