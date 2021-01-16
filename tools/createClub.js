/**
 * Date: 2019/9/25
 * Author: admin
 * Description: 创建亲友圈 
 * cmd: node createClub.js uid clubName
 */
let connectToMaster = require('./gameOperationConnect').connectToMaster;

function createClub(opts) {
    let id = 'pomelo_createClub_' + Date.now();
    connectToMaster(id, opts, function (client) {
        client.request('gameOperation', {signal: 'createClub', data: opts}, function (resp) {
            console.info(resp);
            process.exit(0);
        })
    });
};

let arguments = process.argv.splice(2);
if (arguments.length < 2) {
    console.log('function argumemnt error.');
    process.exit(1);
}

let opts = {
	uid: arguments[0],
	clubName: arguments[1],
};
createClub(opts);
