'use strict';
var pomelo = require('pomelo');
var logger = require('pomelo-logger').getLogger(__filename);

var ms = module.exports;

ms.pushMessageByUids = function(uids,route,msg, opts){
    pomelo.app.get('channelService').pushMessageByUids(route,msg,uids, opts, errHandler);
}

ms.pushMessageToPlayer = function(uid,route,msg, opts){
    ms.pushMessageByUids([uid],route,msg, opts);
}

function errHandler(err,fails){
    if(!!err){
        logger.error('Push Message error ! %j',err.stack);
    }
}