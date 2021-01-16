/**
 * Date: 2019/8/19
 * Author: admin
 * Description: 跑得快
 */
'use strict';
let pomelo = require('pomelo');
let util = require('util');
let Component = require('../component');
let consts = require('../../common/consts');
let GameLogic = require('./game15Logic');

let Game15Component = function (entity) {
    Component.call(this, entity);
};

util.inherits(Game15Component, Component);
module.exports = Game15Component;

let pro = Game15Component.prototype;

pro.init = function (opts) {
	this.handCardData = [];
	this.handCardCount = [];
	this.currentUser = -1;
	this.turnCardData = [];
	this.turnCardCount = 0;
	this.turnUser = -1;
	this.bUserWarn = [];
	this.maxCardCount = 0;
	this.playwayCfg = {};
	this.gameParameter = {};
	this.bombCount = [];
};

pro.onSendParameter = function (user, playwayCfg) {
	this.playwayCfg = playwayCfg;
	let gameParameter = playwayCfg.gameParameter;
    let param = {
        bPlayerCount: gameParameter.bPlayerCount,
        bGameCount: gameParameter.bGameCount,
        b15Or16: gameParameter.b15Or16,
    }
    this.gameParameter = param;
	
	this.entity.setChairCount(this.gameParameter.bPlayerCount);
	this.entity.setGameCount(this.gameParameter.bGameCount);
	if (this.gameParameter.b15Or16 == 1) {
		this.maxCardCount = 16;
	} else {
		this.maxCardCount = 15;
	}
	this.entity.logger.info('最大扑克数量: %d', this.maxCardCount);
	this.entity.sendMessage(user.uid, 'onSendParameter', this.playwayCfg);
};

pro.onSendGameScene = function(user, gameStatus) {
	let sceneData = null;
	if (gameStatus == consts.TableStatus.START) {
		let wChairID = this.entity.getPlayerChairID(user.uid);
		sceneData = {
			gameStatus: gameStatus,
			tableId: this.entity.id,
            players: this.entity.getDataPlayers(),
            gameCount: this.entity.gameCount,
            currentCount: this.entity.currentCount,
			handCardData: this.handCardData[wChairID],
			handCardCount: this.handCardCount,
			currentUser: this.currentUser,
			turnCardData: this.turnCardData,
			turnCardCount: this.turnCardCount,
			turnUser: this.turnUser,
			bUserWarn: this.bUserWarn
		};
	} else {
		sceneData = {
			gameStatus: gameStatus,
			tableId: this.entity.id,
            players: this.entity.getDataPlayers(),
            gameCount: this.entity.gameCount,
            currentCount: this.entity.currentCount,
		}
	}
	this.entity.sendMessage(user.uid, 'onSendGameScene', sceneData);
};

pro.onGameStart = function () {
	// 洗牌
	let cardData = GameLogic.RandCardList(this.gameParameter.b15Or16);

	// 配牌
	// cardData = [
	// 	0x03,0x13,0x23,0x04,0x14,0x24,0x05,0x15,0x25,0x16,0x06,0x08,0x18,0x28,0x38,
	// 	0x02,0x0B,0x1B,0x2A,0x0A,0x1A,0x09,0x08,0x07,0x06,0x16,0x25,0x05,0x14,0x23,
	// 	0x05,0x15,0x25,0x06,0x16,0x26,0x07,0x17,0x27,0x18,0x39,0x1A,0x1B,0x3C,0x1D
	// ];

	// 发牌、排序
	var handCardData = [];
	var pos = 0
	for (let i = 0; i < this.gameParameter.bPlayerCount; i++) {
		let carditem = cardData.slice(pos, pos + this.maxCardCount);
		handCardData.push(carditem);
		pos = pos + this.maxCardCount;
		GameLogic.SortCardList(handCardData[i], this.maxCardCount);
		this.handCardData[i] = carditem;
		this.handCardCount[i] = this.maxCardCount;
	}
	this.entity.logger.info('玩家手牌数据:', handCardData);

    // 黑桃3先出
    let firstCard = 0x03;
    let banker = this._getBankerUser(handCardData, firstCard);
    if (banker == consts.INVALID_CHAIR) {
        banker = Math.floor(Math.random()*10) % this.gameParameter.bPlayerCount;
        handCardData[banker][this.maxCardCount-1] = firstCard;
        this.handCardData[banker][this.maxCardCount-1] = firstCard;
    }
    this.currentUser = banker;

	// 游戏开始,通知发牌
	let players = this.entity.getPlayers();
	for (const i in players) {
		let player = players[i];
		let msg = {
			wCurrentUser: banker,
			cbCardData: handCardData[i],
			bStartCard: firstCard,
			wChairID: player.getUserChairId(),
		}
		this.entity.sendMessage(player.uid, 'onStartGame', msg);
		this.entity.sendReplay('onStartGame', msg);
	}
};

pro.playCard = function (next, uid, bCardData, bCardCount) {
	let wChairID = this.entity.getPlayerChairID(uid);
	let players = this.entity.getPlayers();
	let playerCount = this.gameParameter.bPlayerCount;
	bCardData = bCardData.slice(0, bCardCount);

	// 是否轮到出牌
	if (wChairID != this.currentUser) {
		this.entity.logger.warn('wChairID[%d] currentUser[%d] no equiel!',wChairID, this.currentUser);
		next(null, {
			code: consts.PlayCardCode.NO_TURN_OUT_CARD,
			handCardData: this.handCardData[wChairID]
		});
		return;
	}

	// 检测出牌类型
	let bCardType = 0;
	if (this.handCardCount[wChairID] != bCardCount) {
		bCardType = GameLogic.GetCardType(bCardData, bCardCount);
	} else {
		bCardType = GameLogic.GetLastCardType(bCardData, bCardCount);
	}
	if(bCardType == GameLogic.CardType.CT_ERROR) 
	{
		next(null, {
			code: consts.PlayCardCode.OUT_CARD_TYPE_ERROR,
			handCardData: this.handCardData[wChairID]
		});
		return;
	}

	// 出牌排序
	GameLogic.SortCardList(bCardData, bCardCount);

	// 跟随出牌
	if (this.turnCardCount != 0 && wChairID != this.turnUser) {
		if (this.handCardCount[wChairID] != bCardCount) {
			if (GameLogic.CompareCard(this.turnCardData,bCardData,this.turnCardCount,bCardCount)==false) {
				next(null, {
					code: consts.PlayCardCode.OUT_CARD_TYPE_ERROR,
					handCardData: this.handCardData[wChairID]
				});
				return;
			}
		} else {
			if (GameLogic.CompareLastCard(this.turnCardData,bCardData,this.turnCardCount,bCardCount)==false)
			{
				next(null, {
					code: consts.PlayCardCode.OUT_CARD_TYPE_ERROR,
					handCardData: this.handCardData[wChairID]
				});
				return;
			}
		}
	}

	//报警必须出最大牌
	if (this.bUserWarn[(wChairID+1)%playerCount]==true && bCardCount==1)
	{
		GameLogic.SortCardList(this.handCardData[wChairID],this.handCardCount[wChairID]);
		if (GameLogic.GetCardLogicValue(this.handCardData[wChairID][0]) != GameLogic.GetCardLogicValue(bCardData[0]))
		{
			next(null, {
				code: consts.PlayCardCode.OUT_CARD_TYPE_ERROR,
				handCardData: this.handCardData[wChairID]
			});
			return;
		}
	}

	// 删除扑克
	if(GameLogic.RemoveCard(bCardData,bCardCount,this.handCardData[wChairID],this.handCardCount[wChairID]) == false)
	{
		this.entity.logger.error('删除扑克失败:',bCardData,bCardCount,this.handCardData[wChairID],this.handCardCount[wChairID]);
		return;
	}

	// 出牌记录
	this.handCardCount[wChairID]-=bCardCount;
	this.turnCardCount=bCardCount;
	this.turnCardData=bCardData.slice(0);
	this.turnUser=wChairID;

	// 切换用户
	if (this.handCardCount[wChairID]!=0)
		this.currentUser=(this.currentUser+1) % playerCount;
	else
		this.currentUser = consts.INVALID_CHAIR;

	// 发送自己当前剩余手牌
	next(null, {
		code: consts.PlayCardCode.OK,
		handCardData: this.handCardData[wChairID]
	});
	
	// 报单消息
	if (this.handCardCount[wChairID]==1) {
		this.bUserWarn[wChairID] = true;
		this.entity.sendMessage(null, 'onWarnUser', {wWarnUser: wChairID});
		this.entity.sendReplay('onWarnUser', {wWarnUser: wChairID});
	}

	// 出牌消息
	let msg = {
		outcardUser: wChairID,
		cardData: bCardData,
		cardCount: bCardCount,
		currentUser: this.currentUser
	}
	this.entity.sendMessage(null, 'onOutCard', msg);
	this.entity.sendReplay('onOutCard', msg);

	// 炸弹扣分
	if (bCardType == GameLogic.CardType.CT_BOMB_CARD) {
		this.bombCount[wChairID] = this.bombCount[wChairID] || 0;
		this.bombCount[wChairID] = this.bombCount[wChairID] + 1;
	}

	// 结算
	if (this.currentUser == consts.INVALID_CHAIR) {
		this.entity.logger.info('赢家: [%d](%s), 出牌:', wChairID, players[wChairID].name, bCardData);
		let scores = this._broadcastSettleSorce(wChairID);
		this.entity.concludeGame(wChairID, scores, {bombTotal: this.bombCount});
		this._resetCurrentData();
	} else {
		this.entity.logger.info('当前:[%d](%s), 出牌:', wChairID, players[wChairID].name, bCardData);
		// 要不起自动下一手
		this._checkNextOutCard(wChairID, this.currentUser);
	}
};

// 重置房间数据
pro._resetCurrentData = function () {
	this.handCardData = [];
	this.handCardCount = [];
	this.currentUser = -1;
	this.turnCardData = [];
	this.turnCardCount = 0;
	this.turnUser = -1;
	this.bUserWarn = [];
	this.bombCount = [];
};

// 结算分数计算
pro._broadcastSettleSorce = function (winUser) {
	let sorceCell = this.playwayCfg.sorceCell;
	let players = this.entity.getPlayers();
	let scores = [];
	
    // 炸弹
    for (const chairId in this.bombCount) {
        let count = this.bombCount[chairId];
        let sorce = sorceCell * 5 * count;
        let tempSubNum = 0;
        for (const i in players) {
            let tableUser = players[i];
            let seatId = tableUser.getUserChairId();
            scores[seatId] = scores[seatId] || 0;
            if (seatId != chairId) {
                scores[seatId] = scores[seatId] - sorce;
                tempSubNum = tempSubNum + sorce;
            }
        }
        scores[chairId] = scores[chairId] + tempSubNum;
    }

    // 剩余牌
    let tempSubNum = 0;
    for (const i in players) {
        let tableUser = players[i];
        let seatId = tableUser.getUserChairId();
        scores[seatId] = scores[seatId] || 0;
        let cardCount = this.handCardCount[seatId];
        // 春天
        if (cardCount >= this.maxCardCount) {
            scores[seatId] = scores[seatId] - sorceCell * cardCount * 2;
            tempSubNum = tempSubNum + sorceCell * cardCount * 2;
        } else {
            if (cardCount > 1) {
                scores[seatId] = scores[seatId] - sorceCell * cardCount;
                tempSubNum = tempSubNum + sorceCell * cardCount;
            }
        }
    }
    scores[winUser] = scores[winUser] + tempSubNum;

    // 广播
    let msg = {
        winUser: winUser,
        scores: scores,
        bombCounts: this.bombCount,
        sorceCell: sorceCell,
        handCardData: this.handCardData,
        handCardCount: this.handCardCount,
    }
    this.entity.sendMessage(null, 'onSettlement', msg);
    this.entity.sendReplay('onSettlement', msg);

    return scores;
};

// 要不起自动下手
pro._checkNextOutCard = function (wChairID, nextChariID) {
	if (wChairID == nextChariID) {
		setTimeout(function () {
			// 闹钟提示
			this.entity.sendMessage(null, 'onOutCardNotify', {currentUser: this.currentUser});
			this.entity.sendReplay('onOutCardNotify', {currentUser: this.currentUser});
		}.bind(this), 1.5 * 1000);
		return;
	}

	let playerCount = this.gameParameter.bPlayerCount;
	let handCardData = this.handCardData[nextChariID];
	let cardCount = this.handCardCount[nextChariID];
	let turnCardData = this.turnCardData;
	let turnCardCount = this.turnCardCount;

	if (GameLogic.SearchOutCard(handCardData, cardCount, turnCardData, turnCardCount)==false)
	{
		// 要不起
		setTimeout(function () {
			// 要不起
			let wPassUser = nextChariID;
			let currentUser = (wPassUser+1) % playerCount;
			this.currentUser = currentUser;
			let players = this.entity.getPlayers();
			this.entity.logger.info('要不起:[%d](%s)',wPassUser, players[wPassUser].name);

			// 推送要不起消息
			let msg = {
				wPassUser: wPassUser,
				wCurrentUser: currentUser,
			}
			this.entity.sendMessage(null, 'onPassCard', msg);
			this.entity.sendReplay('onPassCard', msg);

			// 递归
			this._checkNextOutCard(wChairID, currentUser);
		}.bind(this), 1.5 * 1000);

	} else{
		// 闹钟提示
		setTimeout(function () {
			this.entity.sendMessage(null, 'onOutCardNotify', {currentUser: this.currentUser});
			this.entity.sendReplay('onOutCardNotify', {currentUser: this.currentUser});
		}.bind(this), 1.5 * 1000);
	}
};

// 获取庄家[cbCard:这个牌先出]
pro._getBankerUser = function(handCardData, cbCard)
{
	let playerCount = this.gameParameter.bPlayerCount;
	for (let i =0;i < playerCount;i++)
	{
		for (let j =0; j < this.maxCardCount; j++)
		{
			if (handCardData[i][j] == cbCard)
			{
				return i;
			}
		}
	}
	return consts.INVALID_CHAIR;
};

