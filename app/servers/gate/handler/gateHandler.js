'use strict';
var consts = require('../../../common/consts');
var _ = require('lodash');

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

    let gameId = msg.gameId;
    let serverName = 'game' + gameId;
    let servers = this.app.getServersByType(serverName);
    if (!servers || servers.length === 0) {
        next(null, {
            code: consts.Login.FAIL
        });
        return;
	}
	
    let res = _.sample(servers);
	next(null, {
		code: consts.Login.OK,
		host: res.clientHost,
		port: res.clientPort
	});
};
