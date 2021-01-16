/**
 * Date: 2019/2/11
 * Author: admin
 * Description: component基类定义
 */
'use strict';
let EventEmitter = require('events').EventEmitter;
let util = require('util');

let Component = function (entity) {
    EventEmitter.call(this);
    this.entity = entity;

    this.event2Funcs = {};
};

util.inherits(Component, EventEmitter);
module.exports = Component;

let pro = Component.prototype;

pro.safeBindEvent = function (event, func) {
    if (!(event in this.event2Funcs)) {
        this.event2Funcs[event] = [];
    }
    this.on(event, func);
    this.event2Funcs[event].push(func);
};

pro.clearEventListeners = function () {
    for (let event in this.event2Funcs) {
        let funcs = this.event2Funcs[event];
        for (let i = 0; i < funcs.length; i++) {
            this.removeListener(event, funcs[i]);
        }
    }
    this.event2Funcs = {};
};

pro.destroy = function () {
    this.clearEventListeners();
    this.entity = null;
};

/**@cxx 定时器
 * dt 秒
 * cb dt秒后执行回调
 */
pro.startSchedule = function(dt, cb) {
	this.stopSchedule();
	this._schedule = setInterval(function () {
		dt = dt - 0.5;
		if (dt <= 0) {
			dt = 0;
			this.stopSchedule();
			cb();
		}
    }.bind(this), 500);
};

pro.stopSchedule = function() {
	if (this._schedule) {
		clearInterval(this._schedule);
		this._schedule = null;
	}
};
