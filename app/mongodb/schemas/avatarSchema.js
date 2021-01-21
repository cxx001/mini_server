var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var AvatarSchema = new Schema({
    _id: Number,
    openid: String,
    name: String,
    gender: Number,
    avatarUrl: String,
	createTime: Number,
	lastOfflineTime: Number,
});

AvatarSchema.set('toObject', { getters: true });

module.exports = AvatarSchema;