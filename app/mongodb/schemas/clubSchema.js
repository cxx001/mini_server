var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ClubSchema = new Schema({
	_id: Number,
	createTime: Number,
	leaderId: Number,
	clubName: String,
	leaderName: String,
	leaderUrl: String,
	clubMode: Number,
	members: [],
	playways: [],
});

ClubSchema.set('toObject', { getters: true });

module.exports = ClubSchema;