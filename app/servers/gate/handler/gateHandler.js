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
    
    // get all connectors
    let connectors = this.app.getServersByType('connector');
    if (!connectors || connectors.length === 0) {
        next(null, {
            code: consts.Login.FAIL
        });
        return;
	}
	
    let servers = [];
    let gameId = msg.gameId;
	for (let i = 0; i < connectors.length; i++) {
		const server = connectors[i];
		let id = Number(server.id.split("-")[1]);
		if (id == gameId) {
			servers.push(server);
		}
	}

	if (servers.length === 0) {
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
