/**
 * Date: 2019/3/13
 * Author: admin
 * Description:
 */

var adminClient = require('pomelo-admin').adminClient;
var co = require('../node_modules/pomelo/lib/modules/console');

var DEFAULT_USERNAME = 'admin';
var DEFAULT_PWD = 'admin';
var DEFAULT_MASTER_HOST = '127.0.0.1';
var DEFAULT_MASTER_PORT = 3005;

var CONNECT_ERROR = 'Fail to connect to admin console server.';

function abort(str) {
    console.error(str);
    process.exit(1);
}

function connectToMaster(id, opts, cb) {
    var client = new adminClient({username: opts.username, password: opts.password, md5: true});
    client.connect(id, opts.host, opts.port, function(err) {
        if(err) {
            abort(CONNECT_ERROR + err.red);
        }
        if(typeof cb === 'function') {
            cb(client);
        }
    });
}

function reload(opts) {
    var id = 'pomelo_reload_' + Date.now();
    connectToMaster(id, opts, function(client) {
        client.request(co.moduleId, { signal: 'reload', hotFile: opts.hotFile }, function(err, msg) {
            if(err) {
                console.error(err);
            }
            else {
				let msg2 = msg.msg;
				for (const key in msg2) {
					for (let i = 0; i < msg2[key].length; i++) {
						console.log('update ' + '[' + key + '] ' + msg2[key][i]);
					}
				}
                console.info("reload finish");
            }
            process.exit(0);
        });
    });
}

var arguments = process.argv.splice(2);
var opts = {};
opts.hotFile = arguments[0],
opts.username = arguments[1] || DEFAULT_USERNAME;
opts.password = arguments[2] || DEFAULT_PWD;
opts.host = arguments[3] || DEFAULT_MASTER_HOST;
opts.port = arguments[4] || DEFAULT_MASTER_PORT;

reload(opts);
