/**
 * Date: 2020/07/23
 * Author: admin
 * Description:
 */
let mongoose = require('mongoose'),
    Schema = mongoose.Schema;

let AntiLogSchema = new Schema({
    _id: String,
    operateId: Number,
    operateName: String,
    targetId: Number,
    targetName: String,
    refreshValue: Number,
    time: Number,
	createdAt: {type: Date, expires: 691200},   // 数据保存8天(注意只创建时生成,以后修改要删除文档再重新生成)
});

AntiLogSchema.set('toObject', { getters: true });

module.exports = AntiLogSchema;