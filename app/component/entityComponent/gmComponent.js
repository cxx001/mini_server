/**
 * Date: 2018/8/31
 * Author: liuguolai
 * Description:
 */
var Component = require('../component');
var util = require('util');
var consts = require('../../common/consts');
var pomelo = require('pomelo');
let dispatcher = require('../../util/dispatcher');
// let mailManager = require('../../manager/mailManager');

var GMComponent = function (entity) {
    Component.call(this, entity);
};

util.inherits(GMComponent, Component);
module.exports = GMComponent;

var pro = GMComponent.prototype;

pro.init = function (opts) {
    this.localCmd = new Set(['e', 'quickFight', 'gold', 'i', 'lv', 'mail', 'gmmail','silver','c']);
    this.dungeonCmd = new Set(['kill', 'hp', 'mp', 'card', 'monster']);
};

pro.handleGMCommand = function (cmd, params) {
    if (!consts.ENABLE_GM)
        return;
    if (this.localCmd.has(cmd)) {
        this[cmd](...params);
        return;
    }
    if (this.dungeonCmd.has(cmd)) {
        var dgCtrl = this.entity.dungeon;
        if (!dgCtrl.inDungeon)
            return;
        pomelo.app.rpc.fight.fightRemote.command.toServer(
            dgCtrl.fightServer, dgCtrl.dgEntId, cmd, this.entity.id, params, null);
        return;
    }
};

pro.gmmail = function (uid, title, desc, reward) {
    if (uid === 'self')
        uid = this.entity.id;
    if (!reward)
        reward = {};
    else
        reward = eval('('+reward+')');
    mailManager.addGMMailToPlayers(uid, title, desc, reward);
};

pro.mail = function (uid, mailID, kwargs) {
    if (uid === 'self')
        uid = this.entity.id;
    mailID = parseInt(mailID);
    kwargs = eval('('+kwargs+')');
    mailManager.addMailToPlayers(uid, mailID, kwargs)
};

pro.lv = function (level) {
    level = parseInt(level);
    this.entity.avatarProp._setAvatarProp('level', level, true);
};

pro.i = function (itemID, cnt) {
    itemID = parseInt(itemID), cnt = parseInt(cnt)
    this.entity.bag.addItem(itemID, cnt);
};

pro.c = function (cardId, cnt) {
    cardId = parseInt(cardId), cnt = parseInt(cnt)
    this.entity.card.addCard(cardId, cnt);
};

pro.gold = function (val) {
    val = parseInt(val);
    this.entity.avatarProp.giveFreeGold(val);
};

pro.silver = function (val) {
    val = parseInt(val);
    this.entity.avatarProp.giveSilver(val);
};

pro.quickFight = function () {
    let ent = this.entity;
    let fightServerIds = pomelo.app.get("fightIdsMap")["PVE"][1];
    let server = dispatcher.dispatch(this.entity.id, fightServerIds);
    pomelo.app.rpc.fight.fightRemote.newFight.toServer(server,
        "test", 1, {
            [ent.id]: {
                openid: ent.openid,
                sid: pomelo.app.getServerId(),
                name: ent.name,
                inTeam: 0
            }
        }, {}, {}, null);
};

pro.e = function (...args) {
    let funcName = args[0];
    let funcPres = funcName.split('.'), func = this.entity, env = this.entity;
    for (let i = 0; i < funcPres.length; i++) {
        func = func[funcPres[i]];
        if (i !== funcPres.length - 1) {
            env = func;
        }
    }
    let params = args.slice(1);
    func.apply(env, params);
};

pro._getEntity = function(uid, group, pos) {
    var me = this.entity.getMember(uid), ent = null;
    if (group == 0) {  // 自己队伍
        var mems = this.entity._getGroupById(me.groupId);
    }
    else {  // 敌人队伍
        var mems = this.entity._getGroupById(me.groupId, true);
    }
    for (var uid in mems) {
        if (mems[uid].pos == pos) {
            ent = mems[uid];
            break;
        }
    }
    return ent;
};

// 杀掉某个对象
pro.kill = function (uid, group, pos) {
    var ent = this._getEntity(uid, group, pos);
    if (!ent || ent.state.isDead())
        return;
    ent.prop.modProp('hp', -ent.hp);
};

// 设置hp
pro.hp = function (uid, group, pos, hp) {
    var ent = this._getEntity(uid, group, pos);
    if (!ent || ent.state.isDead())
        return;
    hp = parseInt(hp);
    var deltaHp = hp - ent.hp;
    ent.prop.modProp('hp', deltaHp);
};

// 设置mp
pro.mp = function (uid, group, pos, mp) {
    var ent = this._getEntity(uid, group, pos);
    if (!ent || ent.state.isDead())
        return;
    mp = parseInt(mp);
    var deltaMp = mp - ent.mp;
    ent.activeRecoverMp(deltaMp, true);
};

// 获得手牌
pro.card = function (uid, group, pos, cid, num)  {
    var ent = this._getEntity(uid, group, pos);
    if (!ent || ent.state.isDead())
        return;
    num = num || 1;
    ent.cardCtrl.createCards(parseInt(cid), parseInt(num), consts.PileType.IN_HANDS);
};

// 添加怪物
pro.monster = function (uid, team, pos, mid) {
    var dgEnt = this.entity;
    var me = dgEnt.getMember(uid);
    var groupId = team == 0 ? me.groupId : dgEnt._getOppositeGroupId(me.groupId);
    pos = parseInt(pos);
    var emptyPoses = dgEnt.getEmptyPositions(groupId);
    if (emptyPoses.indexOf(pos) === -1)
        return;
    mid = parseInt(mid);
    dgEnt.createMonster(groupId, pos, mid);
};
