/**
 * Date: 2019/2/11
 * Author: admin
 * Description: logger做一层wrapper，减少pomelo-logger实例数量
 */
'use strict';
var util = require('util');
var logger = require('pomelo-logger').getLogger('game');
var Component = require('../component');

var LoggerComponent = function (entity) {
    Component.call(this, entity);
};

util.inherits(LoggerComponent, Component);
module.exports = LoggerComponent;

var pro = LoggerComponent.prototype;

pro.init = function (opts) {
    this.prefix = "[" + this.entity._kind + "] [" + this.entity.id + "] ";
};

pro.log = function () {
    arguments[0] = this.prefix + arguments[0];
    logger.log.apply(logger, arguments);
};

pro.debug = function () {
    arguments[0] = this.prefix + arguments[0];
    logger.debug.apply(logger, arguments);
};

pro.info = function () {
    arguments[0] = this.prefix + arguments[0];
    logger.info.apply(logger, arguments);
};

pro.warn = function () {
    arguments[0] = this.prefix + arguments[0];
    logger.warn.apply(logger, arguments);
};

pro.error = function () {
    arguments[0] = this.prefix + arguments[0];
    logger.error.apply(logger, arguments);
};

pro.trace = function () {
    arguments[0] = this.prefix + arguments[0];
    logger.trace.apply(logger, arguments);
};

pro.fatal = function () {
    arguments[0] = this.prefix + arguments[0];
    logger.fatal.apply(logger, arguments);
};
