/**
 * Date: 2020/7/03
 * Author: admin
 * Description: 路由控制
 * 前端服务器发起的rpc调用路由第一个参数是默认的session
 * 自定义的rpc调用路由第一个参数可以自己定义,也支持直接rpc.xx.toServer(serverid)指定后台服务器发起
 */

var exp = module.exports

exp.table = function (session, msg, app, cb) {
    var serverId = session.get('tableServer');

    if(!serverId) {
        cb(new Error('can not find server info for type: ' + msg.serverType));
        return;
    }

    cb(null, serverId);
};