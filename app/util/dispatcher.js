'use strict';
var crc = require("crc");
var pomelo = require("pomelo");

module.exports.dispatch = function(key,list){
    var num = list.length;
    var index = Math.abs(crc.crc32(key)) % num;
    return list[index];
}

module.exports.clubmap = function(clubId){
	let map = {
		236: 'club-server-2',
	}
	
	let sid = map[clubId];
	if (!sid) {
		sid = 'club-server-1';
	}
	console.log('配置映射:[%s:%s]', clubId, sid);
	return sid;
}