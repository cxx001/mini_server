/**
 * Date: 2019/2/11
 * Author: admin
 * Description: 服务器专用consts
 */
'use strict';
var uconsts = require('../public/consts');

var consts = {
	APP_ID: "wxea1ac2da57ebd9a0",
	APP_SECRET: "c669048af98c0236b5fc26364a261b15",
	
	ENABLE_GM: true,  // 是否开启GM命令
};

for (var f in uconsts) {
    if(uconsts.hasOwnProperty(f)) {
        consts[f] = uconsts[f];
    }
};

module.exports = consts;