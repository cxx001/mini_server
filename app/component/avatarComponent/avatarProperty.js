/**
 * Date:  2019/2/11
 * Author: admin
 * Description: avatar属性定义
 */
'use strict';
let persistProperties = {
    openid: "",  // 微信openid
    uid: 0,  // 角色数字id
    name: "unknow",  // 名字
    gender: 0,  // 性别：0：未知 1：男性 2：女性
    avatarUrl: "",  // 用户头像图片的 URL
	roomCardNum: 5, // 房卡
	createTime: 0, //创建时间
	lastOfflineTime: 0,  //上次下线时间
	gameCount: 0, //游戏总局数
	winCount: 0, //胜利次数
	failCount: 0, //失败次数
	clubList: [], //俱乐部列表
	replayList: [], //回放记录
};

module.exports = {
    persistProperties: persistProperties
};
