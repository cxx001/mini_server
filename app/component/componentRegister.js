/**
 * Date: 2019/2/11
 * Author: admin
 * Description: 负责component注册
 */
'use strict';
let LoggerComponent = require('./entityComponent/loggerComponent');
let GMComponent = _require('./entityComponent/gmComponent');

let AvatarPropertyCtrl = require('./avatarComponent/avatarPropertyCtrl');
let LobbyComponent = require('./avatarComponent/lobbyComponent');

var componentClass = {
	logger: LoggerComponent,
	gm: GMComponent,
	
	avatarProp: AvatarPropertyCtrl,
	lobby: LobbyComponent,
};

var componentRegister = module.exports;

componentRegister.getComponent = function (name) {
    return componentClass[name];
};
