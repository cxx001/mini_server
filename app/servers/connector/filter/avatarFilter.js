/**
 * Date: 2019/2/11
 * Author: admin
 * Description:
 */
'use strict';
var entityManager = require('../../../services/entityManager');

module.exports = function() {
    return new Filter();
};

var Filter = function() {
};

Filter.prototype.before = function(msg, session, next){
    if (session.uid) {
        session.avatar = entityManager.getEntity(session.uid);
    }

    next();
};
