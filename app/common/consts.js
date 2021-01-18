/**
 * Date: 2019/8/29
 * Author: admin
 * Description: 常量文件
 */
'use strict';

module.exports = {
    APP_ID: "wxea1ac2da57ebd9a0",
	APP_SECRET: "c669048af98c0236b5fc26364a261b15",
	
    ENABLE_GM: true,  // 是否开启GM命令
    
	// entity state
    ENTITY_STATE_INITED: 1,
    ENTITY_STATE_DESTROYED: 2,
    
    // 平台
    Platform: {
        WIN: "win",
        WECHAT: "wechat",
	},

	INVALID_CHAIR: 65535, 	   //无效用户

	Code: {
        OK: 0,
		FAIL: 1,
	},

	Login: {
        OK: 200,  		// 成功
        RELAY: 201,     // 重新登入
        MAINTAIN: 202,  // 维护
        FAIL: 500       // 失败
	}
}