/**
 * Date: 2019/8/29
 * Author: admin
 * Description: 常量文件
 */
module.exports = {
	// entity state
    ENTITY_STATE_INITED: 1,
	ENTITY_STATE_DESTROYED: 2,

	INVALID_CHAIR: 65535, 	   //无效用户

	Code: {
        OK: 0,
		FAIL: 1,
	},

	ERROR: {
		TABLE_RECYCLED: 401,  //桌子已经回收
	},
	
	// 平台
    Platform: {
        WIN: "win",
        WECHAT: "wechat",
	},

	Login: {
        OK: 200,  		// 成功
        RELAY: 201,     // 重新登入
        MAINTAIN: 202,  // 维护
        FAIL: 500       // 失败
	},

	CheckInResult: {
        SUCCESS: 0,  		// 成功
        ALREADY_ONLINE: 1,  // 已经在线
	},

	EnterGameCode: {
		OK: 0,
		GAME_SERVER_NO_OPEN: 1, //游戏服未开启
		GAME_SERVER_NO_EXIST: 2, //游戏服不存在
	},

	GameStatus: {
		GAME_FREE: 0,  //没在游戏中
		GAME_PLAYING: 1, //游戏中
	},

	EnterTableCode: {
        OK: 0,
		NO_EXIST_ROOM: 1, //房间不存在
		FULL_PLAYER_ROOM: 2, //房间人数已满
		LEADER_NOFULL_MONEY: 3, //群主房卡不足
		PLAYER_NOFULL_MONEY: 4, //玩家房费不足
		PLAYER_NOFULL_ANIT: 5, //玩家沉迷值不足
		GAME_MAINTAIN: 6, //游戏维护中
		GAME_RELAY: 7, //不在同一个游戏服进程，告诉客户端重连
		GAME_TABLE_FULL: 8, //当前服务器桌子已达上限,请新增服务器
		OTHER_FAIL: 9, // 其它错误
	},

    TableStatus: {
		FREE: 0,    //初始化
		READY: 1, 	//准备界面
		START: 2,   //游戏开始
	},

	ReadyGameCode: {
		OK: 0,
		GAME_READYED: 1, 	//玩家已经准备
		GAME_END: 2,        //游戏结束
		PLAYER_MONEY_LESS: 3, //用户钱不足
		GAME_START: 4, //游戏已经开始
		USER_NO_EXIST: 5, //用户不存在
	},

	LeaveRoomCode: {
		OK: 0,
		NO_EXIST_ROOM: 1,   //房间不存在
		START_GAME_NO_LEAVE: 2, //游戏已经开始不能离开牌桌
		LEAVE_ROOM_DISSOLVE: 3, //房间解散
		LEADER_LEAVE_ROOM: 4, // 房主离开房间解散牌桌
	},

	ReadyState: {
		Ready_No: 0,    	//没有准备
		Ready_Yes: 1,  		//已经准备
	},

	// 解散状态
	DissolveState: {
		Diss_Init: 0,      	//初始状态(或拒绝)
		Diss_Send: 1, 		//发起方
		Diss_Agree: 2, 		//同意
		Diss_Undone: 3,  	//未处理
	},

	PlayCardCode: {
		OK: 0,
		NO_TURN_OUT_CARD: 1, //没有轮到自己出牌
		OUT_CARD_TYPE_ERROR: 2, //出牌类型错误
	},

	// 俱乐部code
	ClubCode: {
		OK: 0,
		FAIL: 1,
		CLUB_NAME_ERROR: 2, //名字不合法
		CLUB_NO_EXIST: 3, 	//俱乐部不存在
		CLUB_ID_ERROR: 4,	//俱乐部ID错误
		CLUB_PLAYWAY_NO_EXIST: 5,  //俱乐部玩法不存在
		CLUB_PLAYER_NO_EXIST: 6, //玩家不存在
        CLUB_LIST_NULL: 7,  //俱乐部列表为空
		CLUB_MEM_EXIST: 8, //俱乐部成员已经存在
		CLUB_PLAYER_ID_ERROR: 9, //玩家ID输入错误
		CLUB_PERMISSION_ERROR: 10, //权限错误
		CLUB_LEADER_NO_LEAVE: 11, //圈主不能退出亲友圈
		CLUB_ACCOUNT_LENGTH_LIMIT: 12, //公告长度太长
		CLUB_TABLE_NO_EXIST: 13, //俱乐部桌子不存在
		CLUB_NOT_MY_PLAYER: 14, //不是我的玩家
	},

	ClubApplyCode: {
		OK: 0,
		APPLY_NO_EXIST: 1, // 俱乐部不存在
		APPLY_USER_APPLYED: 2, //已经申请
		APPLY_MEMBER_NO_EXIST: 3, //成员不在申请列表
    },
    
    AddClubMemType: {
        CREATE_INVATE_CODE: 1, //创建邀请码
        BIND_LAST_ID: 2, //绑定上级
	},
	
	RankListCode: {
		OK: 0,
		RANK_TYPE_NULL: 1,  //不存在的排行类型
		RANK_OTHER: 2,  // 其它错误
	},

	TableChatCode: {
		OK: 0,
		USER_NO_EXIST: 1,  //用户不存在
		CONTENT_TOO_LONG: 2, //发送内容超限
	},

	HandStartGameCode: {
		OK: 0,
		USER_NO_EXIST: 1,  //用户不存在
		USER_PERMISSION_DENIED: 2, //房主才能操作
		CURRENT_LESS_PEOPLE: 3, //当前房间人数不足
		GAME_STARTING: 4, //游戏已经开始
	},

	GrabBankerCode: {
		OK: 0,
		USER_NO_EXIST: 1,  //用户不存在
		SET_Multiple_ERROR: 2, //设置倍率错误
		REPEAT_SETTING: 3, //重复设置
		HALF_JOIN_GAME: 4, //中途加入游戏
	},

	BettingCode: {
		OK: 0,
		USER_NO_EXIST: 1,  //用户不存在
		SET_BETTING_ERROR: 2, //下注倍数错误
		REPEAT_SETTING: 3, //重复设置
		ROOMBANKER_NO_COTROLE: 4, //庄家没有下注
		HALF_JOIN_GAME: 5, //中途加入游戏
	},

	ShowCardCode: {
		OK: 0,
		USER_NO_EXIST: 1,  //用户不存在
		USER_NO_GAEMING: 2, // 用户不在游戏中
		USER_SHOWCARDED: 3, //已经明牌
		HALF_JOIN_GAME: 4, //中途加入游戏
	},

	LookPlayerCode: {
		OK: 0,
		LOOKPLAYER_NO_EXIST: 1, //旁观玩家不存在
		ROOM_FULL_PEOPLE: 2, //房间人数已满
		PLAYER_MONEY_LESS: 3, // 用户钱不足
		SEAT_ID_NO_USE: 4, // 座位号不可用
	}
}