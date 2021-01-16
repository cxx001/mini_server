/**
 * Date: 2019/3/13
 * Author: admin
 * Description: 踢下线 
 * cmd: node kickAvatar.js [uid] 默认所有人踢下线
 */
let connectToMaster = require('./gameOperationConnect').connectToMaster;

function kickAvatar(opts) {
    let id = 'pomelo_kick_avatar_' + Date.now();
    connectToMaster(id, opts, function (client) {
        client.request('gameOperation', {signal: 'kick', uid: opts.uid}, function (err, resp) {
            if (err) {
                console.error(err);
            }
            else {
                console.info('被踢成员列表:\n', resp);
                console.info('总人数: ', resp.length);
            }
            process.exit(0);
        })
    });
};

let arguments = process.argv.splice(2);
let opts = {
    uid: arguments[0]
};

kickAvatar(opts);
