/**
 * Date: 2019/2/11
 * Author: admin
 * Description: 负责component注册
 */
'use strict';
let LoggerComponent = require('./entityComponent/loggerComponent');
let AvatarPropertyCtrl = require('./avatarComponent/avatarPropertyCtrl');
let LobbyComponent = require('./avatarComponent/lobbyComponent');
let ClubComponent = require('./avatarComponent/clubComponent');
let Game15Component = require('./gameComponent/game15Component');
let Game25Component = require('./gameComponent/game25Component');
let Game35Component = require('./gameComponent/game35Component');

var componentClass = {
	logger: LoggerComponent,
	avatarProp: AvatarPropertyCtrl,
	lobby: LobbyComponent,
	club: ClubComponent,
    game15: Game15Component,
	game25: Game25Component,
	game35: Game35Component,
};

var componentRegister = module.exports;

componentRegister.getComponent = function (name) {
    return componentClass[name];
};
