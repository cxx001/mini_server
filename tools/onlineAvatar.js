/**
 * Date: 2019/4/14
 * Author: admin
 * itype 0:大厅服信息 1:游戏服信息  detail 默认0不显示详情 1显示详情
 * Description: 在线玩家 [cmd: node onlineAvatar itype [detail]]
 */
let connectToMaster = require('./gameOperationConnect').connectToMaster;

function onlineAvatar(opts) {
    let id = 'pomelo_online_avatar_' + Date.now();
    connectToMaster(id, opts, function (client) {
        client.request('onlineUser', {itype: opts.itype}, function (err, msg) {
			console.log('=============================================');
            if (err) {
                console.error(err);
            }
            else {
                let loginedCount = 0, list = [];
                let msg2 = msg.body;
                for(let sid in msg2) {
                    let info = msg2[sid];
                    loginedCount += info.body.loginedCount;
                    console.log('[%s]在线: %d', sid, info.body.loginedCount);
                    if (info.retainTableNum != null) { 
                        let curTableNum = info.tableTotalNum - info.retainTableNum;
                        console.log('[%s]桌子数: %d/%d', sid, curTableNum, info.tableTotalNum);
                    }
                    
                    let lists = info.body.loginedList;
                    for(let i=0;i<lists.length;i++){
                        list.push({
                            address : lists[i].address,
                            serverId : sid,
                            username : lists[i].username,
                            loginTime : new Date(parseInt(lists[i].loginTime)).toLocaleString().replace(/年|月/g, "-").replace(/日/g, " "),
                            uid : lists[i].uid
                        });
                    }
                }

                if (opts.detail == 1) {
                    console.log('=============================================');
                    console.log(list);
                    console.log('=============================================');
                }
                console.log('在线总人数: %d', loginedCount);
			}
			console.log('=============================================\n');
            process.exit(0);
        })
    });
};

let arguments = process.argv.splice(2);
if (arguments.length < 1) {
    console.log('function argumemnt error.');
    process.exit(1);
}

let opts = {
    itype: arguments[0],
    detail: arguments[1] || 0,
};
onlineAvatar(opts);
