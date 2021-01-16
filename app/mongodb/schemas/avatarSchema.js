var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var AvatarSchema = new Schema({
    _id: Number,
    openid: String,
    name: String,
    gender: Number,
    avatarUrl: String,
	roomCardNum: Number,
	createTime: Number,
	lastOfflineTime: Number,
	gameCount: Number,
	winCount: Number,
	failCount: Number,
	clubList: [],
	replayList: [],
});

AvatarSchema.set('toObject', { getters: true });

module.exports = AvatarSchema;