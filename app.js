'use strict';
let reload = require('./app/util/require');
let pomelo = require('pomelo');
let logger = require('pomelo-logger').getLogger('game', __filename);
let fs = require('fs'), path = require('path');
let mongodb = require("./app/mongodb/mongodb");
let entityFactory = require('./app/entity/entityFactory');
let avatarFilter = require('./app/servers/connector/filter/avatarFilter');
let tableFilter = require('./app/servers/table/filter/tableFilter');
let routeUtil = require('./app/util/routeUtil');

let RollStub = require('./app/services/rollStub');
let ClubStub = require('./app/services/clubStub');
let RecordStub = require('./app/services/recordStub');

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
	app.route('table', routeUtil.table);
	
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

app.configure('production|development', 'club', function () {
	app.set('clubStub', new ClubStub(app), true);
});

app.configure('production|development', 'record', function () {
	app.set('recordStub', new RecordStub(app), true);
});

app.configure('production|development', 'table', function () {
	app.filter(pomelo.filters.serial());   // 对用户请求做串行化
	app.before(tableFilter());

	// 创建空桌子(暂时约定:每种游戏上限9999, 每个服务器上限999, 限开10台负载)
	let gameId = Number(app.get('serverId').split("-")[1]);
	let gameIdx = Number(app.get('serverId').split("-")[2]);
	logger.info('game server table init. gameId: %d, gameIdx: %d', gameId, gameIdx);
	if (!(gameIdx > 0 && gameIdx < 10)) {
		logger.error('gameServer is config error.');
		return;
	}

	let tableId = null;
	let tableList = new Set();
	let tableCount = 999;
	let stepVal = (gameIdx - 1) * (tableCount + 1);
	for (let i = 1; i <= tableCount; i++) {
		tableId = gameId*10000 + i + stepVal;
		entityFactory.createEntity("Table", tableId, {
			components: ['game' + gameId]
		});
		tableList.add(tableId);
	}
	app.set('tableList', tableList, true);
	app.set('tableCount', tableCount, true);
});

// start app
app.start();

process.on('uncaughtException', function (err) {
  console.error(' Caught exception: ' + err.stack);
});
