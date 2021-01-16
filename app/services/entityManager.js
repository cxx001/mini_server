/**
 * Date: 2019/2/11
 * Author: admin
 * Description: 所有Entity的管理器
 */
'use strict';
var logger = require('pomelo-logger').getLogger('game', __filename);
var utils = require('../util/utils');

var entities = {}
var entitiesClassify = {}

var entityMgr = module.exports;

entityMgr.hasEntity = function (entityid) {
    return entityid in entities;
};

entityMgr.getEntity = function (entityid) {
    return entities[entityid];
};

entityMgr.delEntity = function (entityid) {
    if (entityid in entities) {
        let ent = entities[entityid];
        let className = utils.getObjectClass(ent);
        entitiesClassify[className].delete(ent);
        delete entities[entityid];
    }
};

entityMgr.addEntity = function (entityid, ent, override=true) {
    if (entityid in entities) {
        logger.warn("addEntity entity %s already exist", entityid);
        if (!override)
            return;
    }
    entities[entityid] = ent;
    let className = utils.getObjectClass(ent);
    if (!entitiesClassify.hasOwnProperty(className))
        entitiesClassify[className] = new Set();
    entitiesClassify[className].add(ent);
};

entityMgr.getAllEntities = function () {
    return entities;
};

entityMgr.getEntitiesByClass = function (className) {
    if (!entitiesClassify.hasOwnProperty(className))
        return [];
    return entitiesClassify[className];
};
