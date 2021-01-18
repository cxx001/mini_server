'use strict';
var pomelo = require('pomelo');
var fly = require('flyio');
var lodash = require('lodash');
var logger = require('pomelo-logger').getLogger('game', __filename);
var entityManager = require('../../../services/entityManager');
var entityFactory = require('../../../entity/entityFactory');
var consts = require('../../../common/consts');

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

var handler = Handler.prototype;

/**
 * New client entry chat server.
 *
 * @param  {Object}   msg     request message
 * @param  {Object}   session current session object
 * @param  {Function} next    next stemp callback
 * @return {Void}
 */
handler.enter = function (msg, session, next) {
    // 维护中，禁止登录
    if (!this.app.get('canLogin')) {
        next(null, {code: consts.Login.MAINTAIN});
        return;
	}
	
    // 微信login获取的code
    let code = msg.code, userInfo = msg.userInfo, platform = msg.platform;
    if (!code) {
        next(null, {code: consts.Login.FAIL});
        return;
	}
	
    // 微信
    if (platform === consts.Platform.WECHAT) {
        doWxLogin(this.app, session, next, code, userInfo);
    }
    else {
        // code作为openid直接登录
        doLogin(this.app, session, next, code, "", userInfo);
    }
};

var doWxLogin = function (app, session, next, code, userInfo) {
    let url = 'https://api.weixin.qq.com/sns/jscode2session?appid=' + consts.APP_ID +
        '&secret=' + consts.APP_SECRET + '&js_code=' + code + '&grant_type=authorization_code'
    fly.get(url).then(
        function (response) {
            if (response.status != 200) {
                next(null, {code: consts.Login.FAIL});
                logger.error("get openid connect failed.");
                return;
            }
            let data = JSON.parse(response.data);
            if (data.errcode) {
                logger.error("get openid error.%o", data);
                next(null, {code: consts.Login.FAIL});
                return;
            }
            let openid = data["openid"];
            let session_key = data["session_key"];
            userInfo = {
                name: data["name"],
                avatarUrl: data["avatarUrl"],
                gender: data["gender"]
            }
            console.log("xxxxxxxxxaa", openid, session_key, userInfo)
            doLogin(app, session, next, openid, session_key, userInfo);
        }
    ).catch(function (error) {
        logger.error(error);
    })
};

var doLogin = function (app, session, next, openid, session_key, userInfo) {
    // 查db
    app.db.find("Avatar", {"openid": openid}, ["_id"], null, function (err, docs) {
        if (err) {
            logger.error("db find avatar error" + err);
            next(null, {code: consts.Login.FAIL});
            return;
        }
        
        if (docs.length == 0) {
            genUserId(function (err, uid) {
				if (err) {
            		next(null, {code: consts.Login.FAIL});
					return;
				}
				checkinLogin(app, session, next, openid, session_key, userInfo, uid);
			});
        } else {
			let uid = docs[0]["_id"];
			checkinLogin(app, session, next, openid, session_key, userInfo, uid);
        }
    });
};

var checkinLogin = function (app, session, next, openid, session_key, userInfo, uid) {
	app.rpc.auth.authRemote.checkin(null, openid, uid, app.get('serverId'),
		function (result, formerSid, formerUid) {
		// 已经登录，走顶号流程
		if (result == consts.CheckInResult.ALREADY_ONLINE) {
			if (formerUid !== uid) {
				// 事件大了！！！
				logger.error("same account with different uid, openid[%s] formerUid[%s] newUid[%s]", openid, formerUid, uid);
				next(null, {code: consts.Login.FAIL});
				return;
			}
			if (formerSid == app.get('serverId')) {
				var avatar = entityManager.getEntity(formerUid);
				if (!avatar) {
					readyLogin(app, session, uid, openid, session_key, userInfo, next, false);
				}
				else {
					// 刷新session_key和userInfo
					avatar.session_key = session_key;
					avatar.updateUserInfo(userInfo);
					avatar.reconnect();  // 重连上了
					app.get('sessionService').kick(formerUid, "relay");
					session.bind(avatar.id);
					session.on('closed', onAvatarLeave.bind(null, app));
					// 重新设置session setting
					avatar.importSessionSetting();
					avatar.emit("EventReconnect", avatar);  //通知服务器内部监听重连消息
					pomelo.app.rpc.auth.authRemote.getGameInfo(null, avatar.id, function (gameInfo) {
						let clientData = avatar.clientLoginInfo();
						clientData.gameInfo = gameInfo;
						next(null, {
							code: consts.Login.OK,
							info: clientData
						});
					});
				}
			}
			else {
				// 不在同一个进程，告诉客户端重连
				var conector = null;
				var connectors = app.getServersByType('connector');
				for (var i in connectors) {
					if (connectors[i].id === formerSid)
						conector = connectors[i];
				}
				next(null, {
					code: consts.Login.RELAY,
					host: conector.clientHost,
					port: conector.clientPort
				});
			}
		}
		else {
			readyLogin(app, session, uid, openid, session_key, userInfo, next, false);
		}
	});
}

var readyLogin = function (app, session, uid, openid, session_key, userInfo, next, bRelay) {
    // 查db
    app.db.find("Avatar", {"_id": uid}, null, null, function (err, docs) {
        if (err) {
            logger.error("db find avatar error" + err);
            next(null, {code: consts.Login.FAIL});
            return;
        }
        if (docs.length == 0) {
            // 新建号
            var avatar = entityFactory.createEntity("Avatar", uid, {
                openid: openid,
				session_key: session_key,
            })
            
            avatar.save();  // 主动存盘一次
            logger.info("create new avatar id: " + avatar.id);
        } else {
            // 登录成功
            docs[0].openid = openid;
            docs[0].session_key = session_key;
            var avatar = entityFactory.createEntity("Avatar", null, docs[0]);
            logger.info("avatar login success. id: " + avatar.id);
        }
		avatar.updateUserInfo(userInfo);
		avatar.emit("EventLogin", avatar);
        var sessionService = app.get('sessionService');
        sessionService.kick(avatar.id, 'relay');
        session.bind(avatar.id);
		session.on('closed', onAvatarLeave.bind(null, app));
		pomelo.app.rpc.auth.authRemote.getGameInfo(null, avatar.id, function (gameInfo) {
			let clientData = avatar.clientLoginInfo();
			clientData.gameInfo = gameInfo;
			next(null, {
				code: consts.Login.OK,
				info: clientData
			});
		});
        if (bRelay) {
            app.rpc.auth.authRemote.relayCheckin(null, openid, uid, app.get('serverId'), null);
        }
    })
};

/**
 * User log out handler
 *
 * @param {Object} app current application
 * @param {Object} session current session object
 *
 */
var onAvatarLeave = function (app, session, reason) {
    if (!session || !session.uid) {
        return;
    }
    if (reason == "relay") {
        // 顶号
        console.log("xxxxxxxxxxxxxxx", "onAvatarLeave relay")
        return;
    }
    var avtID = session.uid;
    var avatar = entityManager.getEntity(avtID);
    console.log("avatarLeave: " + session.uid);
    avatar.disconnect();
};

var genUserId = function (cb) {
	let findCount = 0;
	let generateFunc = function () {
		findCount = findCount + 1;
		let tempId = 100000 + lodash.random(1, 900000);
		pomelo.app.db.find("Avatar", {"_id": tempId}, null, null, function (err, docs) {
			if (err) {
				logger.error("Avatar db find uid error" + err);
				cb(err);
				return;
			}
			if (docs.length == 0) {
				logger.info('创建角色: [%d]', tempId);
				cb(null, tempId);
			} else {
				logger.info('查找次数: [%d]', findCount);
				if (findCount > 10) {
					logger.error('创建角色失败!');
					cb(new Error('create userid error.'));
					return;
				}
				generateFunc();
			}
		});
	}
	generateFunc();
};