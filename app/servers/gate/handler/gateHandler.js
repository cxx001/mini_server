'use strict';
var dispatcher = require('../../../util/dispatcher');
var consts = require('../../../common/consts');

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

var handler = Handler.prototype;

/**
 * Gate handler that dispatch user to connectors.
 *
 * @param {Object} msg message from client
 * @param {Object} session
 * @param {Function} next next stemp callback
 *
 */
handler.queryEntry = function (msg, session, next) {
    // 维护中，禁止登录
    if (!this.app.get('canLogin')) {
        next(null, {code: consts.Login.MAINTAIN});
        return;
	}
	
    // 微信login获取的code
	var code = msg.code;
    if (!code || code == "undefined") {
        // var ObjectId = require('mongoose').Types.ObjectId;
		// code = ObjectId();
		
		next(null, {code: consts.Code.FAIL});
        return;
    }

	// get all connectors
    var connectors = this.app.getServersByType('connector');
    if (!connectors || connectors.length === 0) {
        next(null, {
            code: consts.Login.FAIL
        });
        return;
	}

    // TODO: 大体是均衡分配，不是绝对的
	var res = dispatcher.dispatch(code, connectors);
	next(null, {
		code: consts.Login.OK,
		host: res.clientHost,
		port: res.clientPort
	});
};
