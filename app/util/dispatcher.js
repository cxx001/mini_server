'use strict';
var crc = require("crc");
var pomelo = require("pomelo");

module.exports.dispatch = function(key,list){
    var num = list.length;
    var index = Math.abs(crc.crc32(key)) % num;
    return list[index];
}