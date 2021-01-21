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
	createTime: 0, //创建时间
	lastOfflineTime: 0,  //上次下线时间
};

module.exports = {
    persistProperties: persistProperties
};
