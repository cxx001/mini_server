/**
 * Date: 2019/3/13
 * Author: admin
 * Description: 负责运营操作跟服务器的连接
 */
let adminClient = require('pomelo-admin').adminClient;

let DEFAULT_USERNAME = 'admin';
let DEFAULT_PWD = 'admin';
let DEFAULT_MASTER_HOST = '127.0.0.1';
// let DEFAULT_MASTER_HOST = '111.229.200.111';
let DEFAULT_MASTER_PORT = 3005;

let CONNECT_ERROR = 'Fail to connect to admin console server.';

function abort(str) {
    console.error(str);
    process.exit(1);
};

function connectToMaster(id, opts, cb) {
    let username = opts.username || DEFAULT_USERNAME,
        password = opts.password || DEFAULT_PWD,
        host = opts.host || DEFAULT_MASTER_HOST,
        port = opts.port || DEFAULT_MASTER_PORT;
    let client = new adminClient({username: username, password: password, md5: true});
    client.connect(id, host, port, function(err) {
        if(err) {
            abort(CONNECT_ERROR + err.red);
        }
        if(typeof cb === 'function') {
            cb(client);
        }
    });
};

module.exports.connectToMaster = connectToMaster;
