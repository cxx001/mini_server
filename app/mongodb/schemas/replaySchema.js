/**
 * Date: 2019/12/04
 * Author: admin
 * Description:
 */
let mongoose = require('mongoose'),
    Schema = mongoose.Schema;

let ReplaySchema = new Schema({
	_id: Number, // 回放码
	commandCount: Number, // 消息条数
	startTime: Number, // 游戏开始时间
	endTime: Number, // 游戏结束时间
	clubId: Number, // 俱乐部ID
	gameId: Number, //游戏ID
	tableId: Number, //桌子ID
	playwayName: String, // 玩法名字
	currentCount: Number, //当前游戏局数
	gameCount: Number, //游戏总局数
	players: [], // 玩家列表
	replayList: [], // 同一房间回放码列表
	buffer: {}, // 回放数据
	bufferSize: Number, // 回放数据大小
	createdAt: {type: Date, expires: 129600},   // 数据保存3天(注意只创建时生成,以后修改要删除文档再重新生成)
});

ReplaySchema.set('toObject', { getters: true });

module.exports = ReplaySchema;