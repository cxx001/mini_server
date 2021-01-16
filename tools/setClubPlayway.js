/**
 * Date: 2019/9/27
 * Author: admin
 * Description: 设置亲友圈玩法 
 * cmd: node setClubPlayway.js clubId gameId [setType, playwayId]
 */

function playwayCfgFunc(clubId, gameId, setType, playwayId) {
	let cfgs = {
		// 跑得快
		15: {
			clubId: clubId,
			setType: setType || 1, // 1 添加玩法 2 删除玩法 3 修改玩法
			playwayId: playwayId || 0,
			gameId: gameId,
			playwayName: '2人跑的快',
			gameMode: 1,  // 0 普遍场 1 积分场
			payMode: 1,  // 0不扣 1大赢家 2所有赢家 3AA制(房费)
			payLimit: 0, //大于多少扣
			payCount: 1, // 每局抽水数量
			isPercentage: false, //是否百分比扣
			sorceCell: 1,  // 倍率
            lowerLimit : 0, // 最低进入房间限制
            roomCardNum: 1, // 每局消耗房卡数量
			gameParameter: {
				bPlayerCount: 2,
				bGameCount: 6,
				b15Or16: 0,   // 0: 15张玩法  1：16张玩法
			}
		},

		// 拼十
		25: {
			clubId: clubId,
			setType: setType || 1, // 1 添加玩法 2 删除玩法 3 修改玩法
			playwayId: playwayId || 0,
			gameId: gameId,
			playwayName: '欢乐拼十',
			gameMode: 1,  // 0 普遍场 1 积分场
			payMode: 1,  // 0不扣 1大赢家 2所有赢家 3AA制(房费)
			payLimit: 0, //大于多少扣
			payCount: 1, // 每局抽水数量
			isPercentage: false, //是否百分比扣
			sorceCell: 1,  // 倍率
            lowerLimit : 0, // 最低进入房间限制
            roomCardNum: 1, // 每局消耗房卡数量
			gameParameter: {
				bLowerPlayerCount: 3,
				bPlayerCount: 10,
				bGameCount: 12,
			}
		},

		// 红中麻将
		35: {
			clubId: clubId,
			setType: setType || 1, // 1 添加玩法 2 删除玩法 3 修改玩法
			playwayId: playwayId || 0,
			gameId: gameId,
			playwayName: '4人红中麻将',
			gameMode: 1,  // 0 普遍场 1 积分场
			payMode: 1,  // 0不扣 1大赢家 2所有赢家 3AA制(房费)
			payLimit: 0, //大于多少扣
			payCount: 1, // 每局抽水数量
			isPercentage: false, //是否百分比扣
			sorceCell: 1,  // 倍率
            lowerLimit : 10, // 最低进入房间限制
            roomCardNum: 1, // 每局消耗房卡数量
			gameParameter: {
				bPlayerCount: 4,
				bGameCount: 8,
				bWuTong: 0,  //1.有筒  0.无筒 (默认无筒)
			}
		},
	}
	return cfgs[gameId];
};

////////////////////////////////////////////////////

let connectToMaster = require('./gameOperationConnect').connectToMaster;

function setClubPlayway(opts) {
    let id = 'pomelo_setClubPlayway_' + Date.now();
    connectToMaster(id, opts, function (client) {
        client.request('gameOperation', {signal: 'playway', data: opts}, function (resp) {
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

let clubId = arguments[0];
let gameId = arguments[1];
let setType = arguments[2] || 1;
let playwayId = arguments[3] || 0;
let opts = playwayCfgFunc(clubId, gameId, setType, playwayId);
setClubPlayway(opts);