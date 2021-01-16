/**
 * Date: 2019/3/13
 * Author: admin
 * Description: 允许或者禁止登录
 */
let connectToMaster = require('./gameOperationConnect').connectToMaster;

function updateLoginState(opts) {
    let id = 'pomelo_login_state_' + Date.now();
    connectToMaster(id, opts, function (client) {
        client.request('gameOperation', {signal: 'updateLogin', canLogin: opts.canLogin}, function (err) {
            if(err) {
                console.error(err);
            }
            else {
                console.info("update finish");
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
let opts = {
    canLogin: arguments[0] == 1 ? 1 : 0,
    username: arguments[1],
    password: arguments[2],
    host: arguments[3],
    port: arguments[4],
};

updateLoginState(opts);
