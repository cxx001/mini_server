/**
 * Date: 2019/4/17
 * Author: admin
 * Description: 解散房间 [node dissolveGame.js [tableId]]
 */
let connectToMaster = require('./gameOperationConnect').connectToMaster;

function dissolveGame(opts) {
    let id = 'pomelo_dissolve_room_' + Date.now();
    connectToMaster(id, opts, function (client) {
        client.request('gameOperation', {signal: 'dissolve', tableId: opts.tableId}, function (err, resp) {
			if (err) {
				console.error(err);
			}
			else {
				console.info(resp);
			}
			process.exit(0);
		})
    });
};

let arguments = process.argv.splice(2);
let opts = {
    tableId: arguments[0] || 0,   // 0解散所有桌子
};

dissolveGame(opts);
