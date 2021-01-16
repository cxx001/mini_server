/**
 * Date: 2019/2/11
 * Author: admin
 * Description:
 */
'use strict';
let avatarSchema = require('./schemas/avatarSchema');
let clubSchema = require('./schemas/clubSchema');
let replaySchema = require('./schemas/replaySchema');
let scoreLogSchema = require('./schemas/scoreLogSchema')
let antiLogSchema = require('./schemas/antiLogSchema');

let name2Schema = {
	"Avatar": avatarSchema,
	"Club": clubSchema,
	"Replay": replaySchema,
	"ScoreLog": scoreLogSchema,
	"AntiLog": antiLogSchema,
};

module.exports = name2Schema;