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
    var table = entityManager.getEntity(session.get('tableId'));
    if (!table) {
        next(new Error('No table exist!'));
        return;
    }
    session.table = table;

    next();
};