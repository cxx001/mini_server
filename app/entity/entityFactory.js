/**
 * Date: 2019/2/11
 * Author: admin
 * Description:
 */
'use strict';
var Avatar = require("./avatar")
var Table = require("./table");

var entityClasses = {
	Avatar: Avatar,
    Table: Table,
}

var entityFactory = module.exports;

entityFactory.createEntity = function (entityType, entityid, entitycontent) {
    entitycontent = entitycontent || {}
    if (entityid)
        entitycontent["_id"] = entityid;
    var entityCreator = entityClasses[entityType];
    return new entityCreator(entitycontent);
};
