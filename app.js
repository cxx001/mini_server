'use strict';
let reload = require('./app/util/require');
let pomelo = require('pomelo');
let logger = require('pomelo-logger').getLogger('game', __filename);
let fs = require('fs'), path = require('path');
let mongodb = require("./app/mongodb/mongodb");
let entityFactory = require('./app/entity/entityFactory');
let avatarFilter = require('./app/servers/connector/filter/avatarFilter');
let routeUtil = require('./app/util/routeUtil');
let RollStub = require('./app/services/rollStub');

/**
 * Init app for client.
 */
var app = pomelo.createApp();
app.set('name', 'cfyx');
app.set('reload', reload, true);

var initDB = function (app) {
    app.loadConfig('mongodb', app.getBase() + '/config/mongodb.json');
    var db = mongodb(app);
    db.init();
    app.set('db', db, true);
};

// app configuration
app.configure('production|development', 'gate', function () {
    app.set('canLogin', true);
    let curFilePath = path.resolve(__dirname);
    app.set('connectorConfig',
        {
            connector: pomelo.connectors.hybridconnector,
			heartbeat: 10,
			useDict: true,
            // ssl: {
            //     type: 'wss',
            //     key: fs.readFileSync(curFilePath + '/keys/server.key'),
            //     cert: fs.readFileSync(curFilePath + '/keys/server.crt')
            // },
            useProtobuf: true,
        });
});

app.configure('production|development', 'connector', function () {
    app.set('canLogin', true);
    app.before(avatarFilter());
    let curFilePath = path.resolve(__dirname);
    app.set('connectorConfig',
    {
		connector: pomelo.connectors.hybridconnector,
		heartbeat: 10,
		useDict: true,
		// ssl: {
		//     type: 'wss',
		//     key: fs.readFileSync(curFilePath + '/keys/server.key'),
		//     cert: fs.readFileSync(curFilePath + '/keys/server.crt')
		// },
		useProtobuf: true,
	});

	// setInterval(()=>{
	// 	let s = app.components.__connection__.getStatisticsInfo();
	// 	logger.info("服务器:[%s].在线:[%d].",s.serverId, s.loginedCount);
	// }, 1000 * 60);
});

app.configure('production|development', function () {
	app.filter(pomelo.filters.timeout());  // 超时警告(beforeFilter->afterFilter),默认3s
	app.before(pomelo.filters.toobusy());  // 请求等待队列过长，超过一个阀值时，就会触发
	// app.enable('systemMonitor');
    if (typeof app.registerAdmin === 'function') {
        let onlineUser = require('./app/modules/onlineUser');
        app.registerAdmin(onlineUser, {app: app});
        let gameOperation = require('./app/modules/gameOperation');
        app.registerAdmin(gameOperation, {app: app});
    }
	
	initDB(app);
	//app.route('table', routeUtil.table);
	
    // message缓冲
	app.set('pushSchedulerConfig', {scheduler: pomelo.pushSchedulers.buffer, flushInterval: 20});

	// proxy configures
	app.set('proxyConfig', {
		bufferMsg: true,
		interval: 20,
		lazyConnection: true
		// enableRpcLog: true
	});

	// remote configures
	app.set('remoteConfig', {
		bufferMsg: true,
		interval: 20
	});
	
	// handler 热更新开关
    app.set('serverConfig',
	{
		reloadHandlers: false
	});

    // remote 热更新开关
    app.set('remoteConfig',
	{
		reloadRemotes: false
	});
});

app.configure('production|development', 'auth', function () {
    app.set('rollStub', RollStub(app));
});

// start app
app.start();

process.on('uncaughtException', function (err) {
  console.error(' Caught exception: ' + err.stack);
});
