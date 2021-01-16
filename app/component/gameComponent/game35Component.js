/**
 * Date: 2020/4/2
 * Author: admin
 * Description: 红中麻将
 */
'use strict';
let pomelo = require('pomelo');
var lodash = require('lodash');
let util = require('util');
let Component = require('../component');
let consts = require('../../common/consts');
let GameLogic = require('./game35Logic');

let Game35Component = function (entity) {
    Component.call(this, entity);
};

util.inherits(Game35Component, Component);
module.exports = Game35Component;

let pro = Game35Component.prototype;

pro.init = function (opts) {
	this.playwayCfg = {};
	this.gameParameter = {};
	this.m_wBankerUser = consts.INVALID_CHAIR; // 庄家用户
	this.m_wCurrentUser = consts.INVALID_CHAIR; // 当前用户
	this.m_cbLeftCardCount = 0;  // 剩余牌数
	this.m_cbRepertoryCard = []; // 所有的牌
	this.m_cbCardIndex = []; 	 // 玩家手牌(index形式)
};

pro.onSendParameter = function (avatar, playwayCfg) {
	this.playwayCfg = playwayCfg;
	let gameParameter = playwayCfg.gameParameter;
    let param = {
        bPlayerCount: gameParameter.bPlayerCount,
		bGameCount: gameParameter.bGameCount,
		bWuTong: gameParameter.bWuTong,
    }
    this.gameParameter = param;
	this.entity.setChairCount(this.gameParameter.bPlayerCount);
	this.entity.setGameCount(this.gameParameter.bGameCount);
	this.entity.sendMessage(avatar.uid, 'onSendParameter', this.playwayCfg);
};

pro.onSendGameScene = function(avatar, gameStatus) {
	let sceneData = null;
	let wChairID = this.entity.getPlayerChairID(avatar.uid)
	if (gameStatus == consts.TableStatus.START) {
		sceneData = {
			gameStatus: gameStatus,
			tableId: this.entity.id,
            players: this.entity.getDataPlayers(),
            gameCount: this.entity.gameCount,
			currentCount: this.entity.currentCount,
			wChairID: wChairID,
			cbCardData: GameLogic.SwitchToCardDataEx(this.m_cbCardIndex[wChairID]),
			wCurrentUser: this.m_wCurrentUser,
		}
	} else {
		sceneData = {
			gameStatus: gameStatus,
			tableId: this.entity.id,
            players: this.entity.getDataPlayers(),
            gameCount: this.entity.gameCount,
			currentCount: this.entity.currentCount,
			wChairID: wChairID,
		}
	}
	this.entity.sendMessage(avatar.uid, 'onSendGameScene', sceneData);
};

pro.onGameStart = function () {
	// 首局随机庄家
	if (this.entity.currentCount == 1) {
		this.m_wBankerUser = Math.floor(Math.random() * 10000) % this.gameParameter.bPlayerCount;
	}

	// 洗牌
	if (this.gameParameter.bPlayerCount == 2 && this.gameParameter.bWuTong == 0)
	{
		this.m_cbLeftCardCount = 112-36;
		this.m_cbRepertoryCard = GameLogic.RandCardData(this.m_cbLeftCardCount);
	} else {
		this.m_cbLeftCardCount = 112;
		this.m_cbRepertoryCard = GameLogic.RandCardData(this.m_cbLeftCardCount);
	}

	// 分发
	for (let i=0; i<this.gameParameter.bPlayerCount; i++)
	{
		this.m_cbLeftCardCount -= 13;
		this.m_cbCardIndex[i] = GameLogic.SwitchToCardIndexEx(this.m_cbRepertoryCard, this.m_cbLeftCardCount, 13);
	}
	
	//庄家补涨
	let data = this.m_cbRepertoryCard[--this.m_cbLeftCardCount];
	this.m_cbCardIndex[this.m_wBankerUser][GameLogic.SwitchToCardIndex(data)]++;
	this.m_wCurrentUser = this.m_wBankerUser;
	
	//发牌
	let players = this.entity.getPlayers();
	for (const i in players) {
		let user = players[i];
		let wChairID = user.getUserChairId();
		let cbCardData = GameLogic.SwitchToCardDataEx(this.m_cbCardIndex[i]);
		let msg = {
			wBankerUser: this.m_wBankerUser,
			wCurrentUser: this.m_wCurrentUser,
			cbCardData: cbCardData,
			wChairID: wChairID
		}
		this.entity.sendMessage(user.uid, 'onStartGame', msg);
	}
};

// 小结算
pro.settleGameEnd = function (winUser) {
	this.m_wBankerUser = winUser;
	let scores = [];
	this.entity.sendMessage(null, 'onSettlement', {winUser: winUser});
	this.entity.concludeGame(winUser, scores, null);
	this._resetData();
};

pro._resetData = function () {
	this.m_cbLeftCardCount = 0;  // 剩余牌数
	this.m_cbRepertoryCard = []; // 所有的牌
	this.m_cbCardIndex = []; // 玩家手牌(index形式)
	this.m_wCurrentUser = consts.INVALID_CHAIR; // 当前用户
};

pro.playCard = function (next, uid, bCardData, bCardCount) {
	let wChairID = this.entity.getPlayerChairID(uid);

	// 没有轮到出牌
	if (wChairID != this.m_wCurrentUser) {
		next(null, {
			code: consts.PlayCardCode.NO_TURN_OUT_CARD,
			handCardData: GameLogic.SwitchToCardDataEx(this.m_cbCardIndex[wChairID])
		});
		return;
	}

	// 不能出红中
	if (bCardData == 0x31) {
		next(null, {
			code: consts.PlayCardCode.OUT_CARD_TYPE_ERROR,
			handCardData: GameLogic.SwitchToCardDataEx(this.m_cbCardIndex[wChairID])
		});
		return;
	}

	//删除麻将
	if (GameLogic.RemoveCard(this.m_cbCardIndex[wChairID], bCardData)==false)
	{
		this.entity.logger.error('删除麻将失败:', bCardData, this.m_cbCardIndex[wChairID]);
		return;
	}

	// 出牌消息
	let msg = {
		wOutCardUser: wChairID,
		cbOutCardData: bCardData,
	}
	this.entity.sendMessage(null, 'onOutCard', msg);

	//用户切换
	this.m_wCurrentUser=(wChairID+this.gameParameter.bPlayerCount-1)%this.gameParameter.bPlayerCount;

	//TODO: 临时处理派发麻将
	if (this.m_cbLeftCardCount <= 0) {
		// 黄庄
		this.settleGameEnd(consts.INVALID_CHAIR);
	} else {
		//发送扑克
		let cbSendCardData=this.m_cbRepertoryCard[--this.m_cbLeftCardCount];
		this.m_cbCardIndex[this.m_wCurrentUser][GameLogic.SwitchToCardIndex(cbSendCardData)]++;
		let msg = {
			wCurrentUser: this.m_wCurrentUser,
			cbCardData: cbSendCardData
		}
		this.entity.sendMessage(null, 'onSendCard', msg);
	}
};