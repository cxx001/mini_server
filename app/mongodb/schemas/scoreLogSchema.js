/**
 * Date: 2020/06/23
 * Author: admin
 * Description:
 */
let mongoose = require('mongoose'),
    Schema = mongoose.Schema;

let ScoreLogSchema = new Schema({
    _id: String,
    operateType: Number,  //1:下分、上分 2:房费 3:对局消耗 4:保险箱存取 5:下级收益
    operateId: Number,
    operateName: String,
    targetId: Number,
    targetName: String,
    changeScoreNum: Number,
    operateRetainNum: Number,
    targetRetainNum: Number,
    time: Number,
	createdAt: {type: Date, expires: 691200},   // 数据保存8天(注意只创建时生成,以后修改要删除文档再重新生成)
});

ScoreLogSchema.set('toObject', { getters: true });

module.exports = ScoreLogSchema;