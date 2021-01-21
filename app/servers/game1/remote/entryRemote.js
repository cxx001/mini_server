/**
 * Date: 2019/2/16
 * Author: admin
 * Description:
 */
'use strict';
let pomelo = require('pomelo');
var entityManager = require('../../../services/entityManager');
var logger = require('pomelo-logger').getLogger('game', __filename);
var consts = require('../../../common/consts');

module.exports = function(app) {
    return new Remote(app);
};

var Remote = function(app) {
    this.app = app;
};

var pro = Remote.prototype;

// 全服广播入口
pro.onGlobalMessage = function (route, msg, cb) {
    let avatars = entityManager.getEntitiesByClass('Avatar');
    let funcPres = route.split('.');
    // todo: 考虑分段处理
    for (let avatar of avatars) {
        let func = avatar, env = avatar, len = funcPres.length;
        for (let i = 0; i < len; i++) {
            func = func[funcPres[i]];
            if (i !== len - 1) {
                env = func;
            }
        }
        func.call(env, msg);
    }
    cb();
};

// 同步俱乐部ID
pro.onAddClubId = function (avtID, clubId, cb) {
    var avatar = entityManager.getEntity(avtID);
    avatar.addUserClubList(clubId);
    logger.info('onAddClubId avtID[%d] clubID[%d] success.', avtID, clubId);
    cb();	
};

// 删除俱乐部ID
pro.onRemoveClubId = function (avtID, clubId, cb) {
    var avatar = entityManager.getEntity(avtID);
    avatar.removeUserClubList(clubId);
    logger.info('onRemoveClubId avtID[%d] clubID[%d] success.', avtID, clubId);
    cb();
};

// 更新游戏次数
pro.onUpdateGameCount = function (avtID, isWiner, cb) {
    var avatar = entityManager.getEntity(avtID);
    avatar.updateGameCount(isWiner);
    logger.info('onUpdateGameCount avtID[%d] isWiner[%o] success.', avtID, isWiner);
    cb();
};

// 进入牌桌
pro.onEnterTable = function (avtID, sid, tableId, cb) {
    var avatar = entityManager.getEntity(avtID);
    avatar.setSessionSetting("tableServer", sid);
    avatar.setSessionSetting("tableId", tableId);
    avatar.importSessionSetting();
    cb();
};

// 牌桌解散
pro.onClearTable = function (avtID, cb) {
    var avatar = entityManager.getEntity(avtID);
    avatar.removeSessionSetting("tableServer", true);
    avatar.removeSessionSetting("tableId", true);
    cb();
};

// 查询用户
pro.onFindUserInfo = function (avtID, cb) {
    var avatar = entityManager.getEntity(avtID);
    if (avatar) {
        cb(avatar.getUserInfo());
    } else {
        cb(null);
    }
};

// 修改房卡数量
pro.onUpdateRoomCardNum = function (avtID, subNum, cb) {
    var avatar = entityManager.getEntity(avtID);
    if (avatar) {
        avatar.updateRoomCardNum(subNum);
        cb(avatar.roomCardNum);
    } else {
        pomelo.app.db.find("Avatar", {"_id": avtID}, null, null, function (err, docs) {
            if (err) {
                logger.error("db find avatar error" + err);
                return;
            }
            if (docs.length == 0) {
                logger.error("db find avatar[%d] no exist.", avtID);
                return;
            } else {
                // 更新入数据库
                let roomCardNum = docs[0].roomCardNum || 0;
                roomCardNum = roomCardNum + subNum;
                let options = {upsert: true};
                pomelo.app.db.getModel("Avatar").update({_id: avtID}, {roomCardNum: roomCardNum}, options, function (err, product) {
                    if (err) {
                        logger.error("db update avatar error: " + err);
                        return;
                    }
                    logger.info("db avatar update success. clubList = ", roomCardNum);
                });
            }
        })
        cb();
    }
};