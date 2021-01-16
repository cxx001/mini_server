/**
 * Date: 2019/4/17
 * Author: admin
 * Description: 给玩家发放道具 
 * cmd: node sendPropsAvatar.js playerid num [proptype]
 */
let connectToMaster = require('./gameOperationConnect').connectToMaster;

function sendPropsAvatar(opts) {
    let id = 'pomelo_send_props_' + Date.now();
    connectToMaster(id, opts, function (client) {
        client.request('gameOperation', {signal: 'props', id: opts.id, nums: opts.nums, proptype: opts.proptype},
            function (err) {
                if (err) {
                    console.error(err);
                }
                else {
                    console.info("send props finish");
                }
                process.exit(0);
            })
    });
};

let arguments = process.argv.splice(2);
if (arguments.length === 0) {
    console.log('argument not enough');
    process.exit(1);
}


/* proptype: 0:元宝 1:其它待定
*  nums: 发放数量
*/
let opts = {
	id: arguments[0],
	nums: arguments[1],
	proptype: arguments[2] || 0,
    username: arguments[3],
    password: arguments[4],
    host: arguments[5],
    port: arguments[6],
};

sendPropsAvatar(opts);
