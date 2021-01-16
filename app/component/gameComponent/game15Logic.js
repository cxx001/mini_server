/**
 * Date: 2019/2/18
 * Author: admin
 * Description: 游戏辅助函数
 */
'use strict';
var lodash = require('lodash');
var exp = module.exports;

// 15张数据(3个K 1个A 1个2)
var Data_15 = [
	0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,0x0A,0x0B,0x0C,0x0D,	//黑桃 A 2 	3 - K
	0x13,0x14,0x15,0x16,0x17,0x18,0x19,0x1A,0x1B,0x1C,0x1D,				//红桃 		3 - K
	0x23,0x24,0x25,0x26,0x27,0x28,0x29,0x2A,0x2B,0x2C,0x2D,				//梅花 		3 - K
	0x33,0x34,0x35,0x36,0x37,0x38,0x39,0x3A,0x3B,0x3C,					//方块 		3 - Q
];

// 16张数据(3个A 1个2)
var Data_16 = [
	0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,0x0A,0x0B,0x0C,0x0D,	//黑桃 A 2 	3 - K
	0x11,0x13,0x14,0x15,0x16,0x17,0x18,0x19,0x1A,0x1B,0x1C,0x1D,		//红桃 A	3 - K
	0x21,0x23,0x24,0x25,0x26,0x27,0x28,0x29,0x2A,0x2B,0x2C,0x2D,		//梅花 A	3 - K
	0x33,0x34,0x35,0x36,0x37,0x38,0x39,0x3A,0x3B,0x3C,0x3D,				//方块 		3 - K
];

//数值掩码
var MASK_COLOR = 0xF0	//花色掩码
var MASK_VALUE = 0x0F	//数值掩码

//扑克类型
exp.CardType = {
	CT_ERROR: 0,   						//错误类型
	CT_SINGLE: 1,						//单牌类型
	CT_DOUBLE: 2,						//对牌类型
	CT_SINGLE_LINE: 3, 					//单连类型	
	CT_DOUBLE_LINE: 4, 					//对连类型
	CT_THREE_LINE: 5, 					//三连类型
	CT_THREE_LINE_TAKE_TWO: 6, 			//三带两单
	CT_FOUR_LINE_TAKE_THREE: 7, 		//四带三单
	CT_BOMB_CARD: 8 					//炸弹类型
};

//******************************************************************************* */

// 完全打乱
exp.RandCardList = function (gameType)
{
	if (gameType == 0) {
		var cbCardData = Data_15.slice(0);
	} else {
		var cbCardData = Data_16.slice(0);
	}
	let tempArr = lodash.shuffle(cbCardData);
	tempArr = lodash.shuffle(tempArr);
	return tempArr;
}

// 模拟真实打牌
exp.RandCardList2 = function (gameType) {
	let maxCardCount = 0;
	if (gameType == 0) {
		var cbCardData = Data_15.slice(0);
		maxCardCount = 15;
	} else {
		var cbCardData = Data_16.slice(0);
		maxCardCount = 16;
	}

	// 洗牌
	let tempArr = lodash.shuffle(cbCardData);
	tempArr = lodash.shuffle(tempArr);

	// 发牌
	let step = 5;
	if (maxCardCount % 5 != 0) {
		step = 4;
	}
	let curIdx = Math.floor(Math.random() * 10000) % 3;
	let handCardData = [[],[],[]];
	for (let i = 0; i < tempArr.length; i+=step) {
		curIdx = (curIdx+1) % 3;
		let onearr = tempArr.slice(i, i + step);
		handCardData[curIdx] = handCardData[curIdx].concat(onearr);
	}

	let tempData = [];
	for (let i = 0; i < 3; i++) {
		tempData = tempData.concat(handCardData[i]);
	}
	return tempData;
};

// 刺激场
exp.RandCardList3 = function (gameType) {
	let maxCardCount = 0;
	if (gameType == 0) {
		var cbCardData = [
			0x03,0x13,0x23,0x33,
			0x04,0x14,0x24,0x34,
			0x05,0x15,0x25,0x35,
			0x06,0x16,0x26,0x36,
			0x07,0x17,0x27,0x37,
			0x08,0x18,0x28,0x38,
			0x09,0x19,0x29,0x39,
			0x0A,0x1A,0x2A,0x3A,
			0x0B,0x1B,0x2B,0x3B,
			0x0C,0x1C,0x2C,0x3C,
			0x0D,0x1D,0x2D,
			0x01,0x02
		];
		maxCardCount = 15;
	} else {
		var cbCardData = [
			0x03,0x13,0x23,0x33,
			0x04,0x14,0x24,0x34,
			0x05,0x15,0x25,0x35,
			0x06,0x16,0x26,0x36,
			0x07,0x17,0x27,0x37,
			0x08,0x18,0x28,0x38,
			0x09,0x19,0x29,0x39,
			0x0A,0x1A,0x2A,0x3A,
			0x0B,0x1B,0x2B,0x3B,
			0x0C,0x1C,0x2C,0x3C,
			0x0D,0x1D,0x2D,0x3D,
			0x01,0x11,0x21,
			0x02
		];
		maxCardCount = 16;
	}

	let lower = 1;
	let upper = 10;
	let randCount = Math.floor(Math.random() * (upper - lower)) + lower;
	for (let i = 0; i < randCount; i++) {
		let index1 = Math.floor(Math.random() * 10000) % cbCardData.length;
		let index2 = Math.floor(Math.random() * 10000) % cbCardData.length;
		let temp;
		temp = cbCardData[index1];
		cbCardData[index1] = cbCardData[index2];
		cbCardData[index2] = temp;
	}

	// 发牌
	let step = 5;
	if (maxCardCount % 5 != 0) {
		step = 4;
	}
	let curIdx = Math.floor(Math.random() * 10000) % 3;
	let handCardData = [[],[],[]];
	for (let i = 0; i < cbCardData.length; i+=step) {
		curIdx = (curIdx+1) % 3;
		let onearr = cbCardData.slice(i, i + step);
		handCardData[curIdx] = handCardData[curIdx].concat(onearr);
	}

	let tempData = [];
	for (let i = 0; i < 3; i++) {
		tempData = tempData.concat(handCardData[i]);
	}
	return tempData;
};

//******************************************************************************* */

//排列扑克
exp.SortCardList = function(cbCardData, cbCardCount)
{
	//数目过虑
	if (cbCardCount==0) return;

	//转换数值
	var cbSortValue = [];
	for (let i=0;i<cbCardCount;i++) cbSortValue[i] = exp.GetCardLogicValue(cbCardData[i]);	

	//排序操作
	var bSorted=true;
	var cbThreeCount,cbLast=cbCardCount-1;
	do
	{
		bSorted=true;
		for (let i=0;i<cbLast;i++)
		{
			//20131022
			if(i>=cbCardCount-1)
			{
				bSorted = false;
				break;
			}

			if ((cbSortValue[i]<cbSortValue[i+1])||
				((cbSortValue[i]==cbSortValue[i+1])&&(cbCardData[i]<cbCardData[i+1])))
			{
				//交换位置
				cbThreeCount	= cbCardData[i];
				cbCardData[i]	= cbCardData[i+1];
				cbCardData[i+1]	= cbThreeCount;
				cbThreeCount	= cbSortValue[i];
				cbSortValue[i]	= cbSortValue[i+1];
				cbSortValue[i+1]= cbThreeCount;
				bSorted=false;
			}	
		}
		cbLast--;
	} while(bSorted==false);
}

//逻辑数值
exp.GetCardLogicValue = function(cbCardData)
{
	//扑克属性
	var cbCardColor = exp.GetCardColor(cbCardData);
	var cbCardValue = exp.GetCardValue(cbCardData);

	//转换数值
	if (cbCardColor == 0x40) return cbCardValue + 2;
	return (cbCardValue<=2)?(cbCardValue+13):cbCardValue;
}

//获取数值
exp.GetCardValue = function(cbCardData) { 
	return cbCardData & MASK_VALUE;
}

//获取花色
exp.GetCardColor = function(cbCardData) { 
	return cbCardData & MASK_COLOR;
}

//分析扑克
exp.AnalysebCardData = function(cbCardData, cbCardCount)
{
	let AnalyseResult = {};
	AnalyseResult.cbFourCount = 0; 						//四张数目
	AnalyseResult.cbThreeCount = 0;						//三张数目
	AnalyseResult.cbDoubleCount = 0;					//两张数目
	AnalyseResult.cbSignedCount = 0;					//单张数目
	AnalyseResult.cbFourCardData = [];					//四张扑克
	AnalyseResult.cbThreeCardData = [];					//三张扑克
	AnalyseResult.cbDoubleCardData = [];				//两张扑克
	AnalyseResult.cbSignedCardData = [];				//单张扑克

	//扑克分析
	for (let i=0;i<cbCardCount;i++)
	{
		//变量定义
		let cbSameCount=1;
		let cbLogicValue=exp.GetCardLogicValue(cbCardData[i]);
		if(cbLogicValue<=0) 
			return false;

		//搜索同牌
		for (let j=i+1;j<cbCardCount;j++)
		{
			//获取扑克
			if (exp.GetCardLogicValue(cbCardData[j])!=cbLogicValue) break;

			//设置变量
			cbSameCount++;
		}

		//设置结果
		switch (cbSameCount)
		{
		case 1:		//单张
			{
				let cbIndex=AnalyseResult.cbSignedCount++;
				AnalyseResult.cbSignedCardData[cbIndex*cbSameCount]=cbCardData[i];
				break;
			}
		case 2:		//两张
			{
				let cbIndex=AnalyseResult.cbDoubleCount++;
				AnalyseResult.cbDoubleCardData[cbIndex*cbSameCount]=cbCardData[i];
				AnalyseResult.cbDoubleCardData[cbIndex*cbSameCount+1]=cbCardData[i+1];
				break;
			}
		case 3:		//三张
			{
				let cbIndex=AnalyseResult.cbThreeCount++;
				AnalyseResult.cbThreeCardData[cbIndex*cbSameCount]=cbCardData[i];
				AnalyseResult.cbThreeCardData[cbIndex*cbSameCount+1]=cbCardData[i+1];
				AnalyseResult.cbThreeCardData[cbIndex*cbSameCount+2]=cbCardData[i+2];
				break;
			}
		case 4:		//四张
			{
				let cbIndex=AnalyseResult.cbFourCount++;
				AnalyseResult.cbFourCardData[cbIndex*cbSameCount]=cbCardData[i];
				AnalyseResult.cbFourCardData[cbIndex*cbSameCount+1]=cbCardData[i+1];
				AnalyseResult.cbFourCardData[cbIndex*cbSameCount+2]=cbCardData[i+2];
				AnalyseResult.cbFourCardData[cbIndex*cbSameCount+3]=cbCardData[i+3];
				break;
			}
		}

		//设置索引
		i+=cbSameCount-1;
	}
	for(let i=0;i<AnalyseResult.cbSignedCount-1;i++)
	{
		for(let j=i+1;j<AnalyseResult.cbSignedCount;j++)
		if(exp.GetCardLogicValue(AnalyseResult.cbSignedCardData[i])<exp.GetCardLogicValue(AnalyseResult.cbSignedCardData[j]))
		{
			let tempCard = AnalyseResult.cbSignedCardData[i];
			AnalyseResult.cbSignedCardData[i] = AnalyseResult.cbSignedCardData[j];
			AnalyseResult.cbSignedCardData[j] = tempCard;
		}
	}
	for(let i=0;i<AnalyseResult.cbDoubleCount*2-1;i++)
	{
		for(let j=i+1;j<AnalyseResult.cbDoubleCount*2;j++)
			if(exp.GetCardLogicValue(AnalyseResult.cbDoubleCardData[i])<exp.GetCardLogicValue(AnalyseResult.cbDoubleCardData[j]))
			{
				let tempCard = AnalyseResult.cbDoubleCardData[i];
				AnalyseResult.cbDoubleCardData[i] = AnalyseResult.cbDoubleCardData[j];
				AnalyseResult.cbDoubleCardData[j] = tempCard;
			}
	}

	return AnalyseResult;
}

//获取类型
exp.GetCardType = function(cbCardData, cbCardCount)
{
	//简单牌型
	switch (cbCardCount)
	{
	case 0:	//空牌
		{
			return exp.CardType.CT_ERROR;
		}
	case 1: //单牌
		{
			return exp.CardType.CT_SINGLE;
		}
	case 2:	//对牌
		{
			if (exp.GetCardLogicValue(cbCardData[0])==exp.GetCardLogicValue(cbCardData[1])) return exp.CardType.CT_DOUBLE;
			return exp.CardType.CT_ERROR;
		}
	}

	//分析扑克
	let AnalyseResult = exp.AnalysebCardData(cbCardData,cbCardCount);

	if(AnalyseResult.cbFourCount==1&&cbCardCount==4) return exp.CardType.CT_BOMB_CARD ;
	if (false) return exp.CardType.CT_FOUR_LINE_TAKE_THREE;   //4带三类型暂关闭

	if(cbCardCount>= 3 && ((AnalyseResult.cbFourCount>0)||AnalyseResult.cbThreeCount>0))
	{
		let nMinCount = cbCardCount/5 ;
		if (cbCardCount%5 > 0)
		{
			return exp.CardType.CT_ERROR;
		}
		let nExistMaxCount = AnalyseResult.cbFourCount + AnalyseResult.cbThreeCount;
		if(nMinCount > nExistMaxCount )
		{
			return exp.CardType.CT_ERROR;
		}
		else
		{
			let threeandfourcardarr = [0,0,0,0,0,0];
			let index=0;
			for(let i=0;i<AnalyseResult.cbThreeCount*3;i=i+3)
			{
				threeandfourcardarr[index++] = exp.GetCardLogicValue(AnalyseResult.cbThreeCardData[i]);
			}
			for(let i=0;i<AnalyseResult.cbFourCount*4;i=i+4)
			{
				threeandfourcardarr[index++] = exp.GetCardLogicValue(AnalyseResult.cbFourCardData[i]);
			}
			//排序
			for(let j=0;j<index-1;j++)
			{
				for(let z=j+1;z<index;z++)
				{
					if(threeandfourcardarr[z]<threeandfourcardarr[j])
					{
						let card = threeandfourcardarr[z];
						threeandfourcardarr[z] = threeandfourcardarr[j];
						threeandfourcardarr[j] = card;
					}
				}
			}
			nMinCount;
			let threeliancount = 0;
			let maxthreeliancount = 0;
			for(let i=0;i<index;i++)
			{
				for(let j=i;j<index;j++)
				{
					if(threeandfourcardarr[i]==(threeandfourcardarr[j]-j+i))
					{
						threeliancount ++;
					}
					else
					{
						break;
					}			
				}
				if(maxthreeliancount<threeliancount)
				{
					maxthreeliancount = threeliancount;
				}
				threeliancount = 0;
			}
			if(maxthreeliancount >= nMinCount)
			{
				return exp.CardType.CT_THREE_LINE_TAKE_TWO;
			}
			else
			{
				return exp.CardType.CT_ERROR;
			}

		}
	}

	//两张类型
	if (AnalyseResult.cbDoubleCount>=2)
	{
		//变量定义
		let cbCardData=AnalyseResult.cbDoubleCardData[0];
		let cbFirstLogicValue=exp.GetCardLogicValue(cbCardData);

		//错误过虑
		if (cbFirstLogicValue>=15) return exp.CardType.CT_ERROR;

		//连牌判断
		for (let i=1;i<AnalyseResult.cbDoubleCount;i++)
		{
			let cbCardData=AnalyseResult.cbDoubleCardData[i*2];
			if (cbFirstLogicValue!=(exp.GetCardLogicValue(cbCardData)+i)) return exp.CardType.CT_ERROR;
		}
		//二连判断
		if ((AnalyseResult.cbDoubleCount*2)==cbCardCount) return exp.CardType.CT_DOUBLE_LINE;
		return exp.CardType.CT_ERROR;
	}
	//单张判断
	if ((AnalyseResult.cbSignedCount>=5)&&(AnalyseResult.cbSignedCount==cbCardCount))
	{
		//变量定义
		let cbCardData=AnalyseResult.cbSignedCardData[0];
		let cbFirstLogicValue=exp.GetCardLogicValue(cbCardData);

		//错误过虑
		if (cbFirstLogicValue>=15) return exp.CardType.CT_ERROR;

		//连牌判断
		for (let i=1;i<AnalyseResult.cbSignedCount;i++)
		{
			let cbCardData=AnalyseResult.cbSignedCardData[i];
			if (cbFirstLogicValue!=(exp.GetCardLogicValue(cbCardData)+i)) return exp.CardType.CT_ERROR;
		}
		return exp.CardType.CT_SINGLE_LINE;
	}
	return exp.CardType.CT_ERROR;
}

exp.GetLastCardType = function(cbCardData, cbCardCount)
{
	//简单牌型
	switch (cbCardCount)
	{
	case 0:	//空牌
		{
			return exp.CardType.CT_ERROR;
		}
	case 1: //单牌
		{
			return exp.CardType.CT_SINGLE;
		}
	case 2:	//对牌
		{
			if (exp.GetCardLogicValue(cbCardData[0])==exp.GetCardLogicValue(cbCardData[1])) return exp.CardType.CT_DOUBLE;
			return exp.CardType.CT_ERROR;
		}
	}

	//分析扑克
	let AnalyseResult = exp.AnalysebCardData(cbCardData,cbCardCount);
	if(AnalyseResult.cbFourCount==1&&cbCardCount==4) return exp.CardType.CT_BOMB_CARD ;
	if(AnalyseResult.cbFourCount==1&&cbCardCount>=6 && cbCardCount<=7) return exp.CardType.CT_FOUR_LINE_TAKE_THREE ;

	if(cbCardCount>= 3 && ((AnalyseResult.cbFourCount>0)||AnalyseResult.cbThreeCount>0))
	{
		let nMinCount = Math.floor(cbCardCount/5) ;
		if (cbCardCount%5 > 0)
		{
			nMinCount = nMinCount + 1;
		}
		let nExistMaxCount = AnalyseResult.cbFourCount + AnalyseResult.cbThreeCount;
		if(nMinCount > nExistMaxCount )
		{
			return CT_ERROR;
		}
		else
		{
			let threeandfourcardarr = [0,0,0,0,0,0];
			let index=0;
			for(let i=0;i<AnalyseResult.cbThreeCount*3;i=i+3)
			{
				threeandfourcardarr[index++] = exp.GetCardLogicValue(AnalyseResult.cbThreeCardData[i]);
			}
			for(let i=0;i<AnalyseResult.cbFourCount*4;i=i+4)
			{
				threeandfourcardarr[index++] = exp.GetCardLogicValue(AnalyseResult.cbFourCardData[i]);
			}
			//排序
			for(let j=0;j<index-1;j++)
			{
				for(let z=j+1;z<index;z++)
				{
					if(threeandfourcardarr[z]<threeandfourcardarr[j])
					{
						let card = threeandfourcardarr[z];
						threeandfourcardarr[z] = threeandfourcardarr[j];
						threeandfourcardarr[j] = card;
					}
				}
			}
			let threeliancount = 0;
			let maxthreeliancount = 0;
			for(let i=0;i<index;i++)
			{
				for(let j=i;j<index;j++)
				{
					if(threeandfourcardarr[i]==(threeandfourcardarr[j]-j+i))
					{
						threeliancount ++;
					}
					else
					{
						break;
					}			
				}
				if(maxthreeliancount<threeliancount)
				{
					maxthreeliancount = threeliancount;
				}
				threeliancount = 0;
			}
			if(maxthreeliancount >= nMinCount)
			{
				return exp.CardType.CT_THREE_LINE_TAKE_TWO;
			}
			else
			{
				return exp.CardType.CT_ERROR;
			}
		}
	}

	//两张类型
	if (AnalyseResult.cbDoubleCount>=2)
	{
		//变量定义
		let cbCardData=AnalyseResult.cbDoubleCardData[0];
		let cbFirstLogicValue=exp.GetCardLogicValue(cbCardData);

		//错误过虑
		if (cbFirstLogicValue>=15) return exp.CardType.CT_ERROR;

		//连牌判断
		for (let i=1;i<AnalyseResult.cbDoubleCount;i++)
		{
			let cbCardData=AnalyseResult.cbDoubleCardData[i*2];
			if (cbFirstLogicValue!=(exp.GetCardLogicValue(cbCardData)+i)) return exp.CardType.CT_ERROR;
		}
		//二连判断
		if ((AnalyseResult.cbDoubleCount*2)==cbCardCount) return exp.CardType.CT_DOUBLE_LINE;
		return exp.CardType.CT_ERROR;
	}
	//单张判断
	if ((AnalyseResult.cbSignedCount>=5)&&(AnalyseResult.cbSignedCount==cbCardCount))
	{
		//变量定义
		let cbCardData=AnalyseResult.cbSignedCardData[0];
		let cbFirstLogicValue=exp.GetCardLogicValue(cbCardData);

		//错误过虑
		if (cbFirstLogicValue>=15) return exp.CardType.CT_ERROR;

		//连牌判断
		for (let i=1;i<AnalyseResult.cbSignedCount;i++)
		{
			let cbCardData=AnalyseResult.cbSignedCardData[i];
			if (cbFirstLogicValue!=(exp.GetCardLogicValue(cbCardData)+i)) return exp.CardType.CT_ERROR;
		}
		return exp.CardType.CT_SINGLE_LINE;
	}
	return exp.CardType.CT_ERROR;
}

//对比扑克
exp.CompareCard = function(cbFirstCard, cbNextCard, cbFirstCount, cbNextCount)
{
	//获取类型
	let cbNextType=exp.GetCardType(cbNextCard,cbNextCount);
	let cbFirstType=exp.GetCardType(cbFirstCard,cbFirstCount);

	//类型判断
	if (cbNextType==exp.CardType.CT_ERROR) return false;

	//炸弹判断
	if ((cbFirstType!=exp.CardType.CT_BOMB_CARD)&&(cbNextType==exp.CardType.CT_BOMB_CARD)) return true;
	if ((cbFirstType==exp.CardType.CT_BOMB_CARD)&&(cbNextType!=exp.CardType.CT_BOMB_CARD)) return false;

	//规则判断
	if ((cbFirstType!=cbNextType)||(cbFirstCount!=cbNextCount)) return false;

	//开始对比
	switch (cbNextType)
	{
	case exp.CardType.CT_SINGLE:
	case exp.CardType.CT_DOUBLE:
	case exp.CardType.CT_SINGLE_LINE:
	case exp.CardType.CT_DOUBLE_LINE:
	case exp.CardType.CT_THREE_LINE:
	case exp.CardType.CT_BOMB_CARD:
		{
			//获取数值
			let cbNextLogicValue=exp.GetCardLogicValue(cbNextCard[0]);
			let cbFirstLogicValue=exp.GetCardLogicValue(cbFirstCard[0]);

			//对比扑克
			return cbNextLogicValue>cbFirstLogicValue;
		}
	case exp.CardType.CT_THREE_LINE_TAKE_TWO:
		{
			//分析扑克
			let NextResult = exp.AnalysebCardData(cbNextCard,cbNextCount);
			let FirstResult = exp.AnalysebCardData(cbFirstCard,cbFirstCount);
			
			////////新增加 2011-1-13 9:54:31
			if (NextResult.cbFourCount>0&&NextResult.cbThreeCount==0)
				NextResult.cbThreeCardData[0]= NextResult.cbFourCardData[0];
			if (FirstResult.cbFourCount>0&&FirstResult.cbThreeCount==0)
				FirstResult.cbThreeCardData[0]= FirstResult.cbFourCardData[0];
			////////////////////////////////
			//获取数值
			let cbNextLogicValue=exp.GetCardLogicValue(NextResult.cbThreeCardData[0]);
			let cbFirstLogicValue=exp.GetCardLogicValue(FirstResult.cbThreeCardData[0]);
			//2011-2-14 15:18:19新增
			if (FirstResult.cbThreeCount==3&&cbFirstCount==10)
			{
				if (exp.GetCardLogicValue(FirstResult.cbThreeCardData[0])!=(exp.GetCardLogicValue(FirstResult.cbThreeCardData[3])+1))
					cbFirstLogicValue=exp.GetCardLogicValue(FirstResult.cbThreeCardData[3]);
			}
			if (NextResult.cbThreeCount==3&&cbNextCount==10)
			{
				if (exp.GetCardLogicValue(NextResult.cbThreeCardData[0])!=(exp.GetCardLogicValue(NextResult.cbThreeCardData[3])+1))
					cbNextLogicValue=exp.GetCardLogicValue(NextResult.cbThreeCardData[3]);
			}
			//2011年3月1日16:11:36新增
			if (FirstResult.cbThreeCount==4&&cbFirstCount==15)
			{
				if (exp.GetCardLogicValue(FirstResult.cbThreeCardData[0])!=(exp.GetCardLogicValue(FirstResult.cbThreeCardData[3])+1))
					cbFirstLogicValue=exp.GetCardLogicValue(FirstResult.cbThreeCardData[3]);
			}
			if (NextResult.cbThreeCount==4&&cbNextCount==15)
			{
				if (exp.GetCardLogicValue(NextResult.cbThreeCardData[0])!=(exp.GetCardLogicValue(NextResult.cbThreeCardData[3])+1))
					cbNextLogicValue=exp.GetCardLogicValue(NextResult.cbThreeCardData[3]);
			}

			//对比扑克
			return cbNextLogicValue>cbFirstLogicValue;
		}
	case exp.CardType.CT_FOUR_LINE_TAKE_THREE:
		{
			//分析扑克
			let NextResult = exp.AnalysebCardData(cbNextCard,cbNextCount);
			let FirstResult = exp.AnalysebCardData(cbFirstCard,cbFirstCount);

			//获取数值
			let cbNextLogicValue=exp.GetCardLogicValue(NextResult.cbFourCardData[0]);
			let cbFirstLogicValue=exp.GetCardLogicValue(FirstResult.cbFourCardData[0]);
			//对比扑克
			return cbNextLogicValue>cbFirstLogicValue;
		}
	}

	return false;
}

//对比扑克
exp.CompareLastCard = function(cbFirstCard, cbNextCard, cbFirstCount, cbNextCount)
{
	//获取类型
	let cbNextType=exp.GetLastCardType(cbNextCard,cbNextCount);
	let cbFirstType=exp.GetCardType(cbFirstCard,cbFirstCount);

	//类型判断
	if (cbNextType==exp.CardType.CT_ERROR) return false;


	//炸弹判断
	if ((cbFirstType!=exp.CardType.CT_BOMB_CARD)&&(cbNextType==exp.CardType.CT_BOMB_CARD)) return true;
	if ((cbFirstType==exp.CardType.CT_BOMB_CARD)&&(cbNextType!=exp.CardType.CT_BOMB_CARD)) return false;

	//规则判断
	//if(cbFirstType!=cbNextType) return false;
	//if ((cbFirstCount!=cbNextCount)&&(cbNextType!=CT_THREE_LINE_TAKE_TWO)) return false;
	if ((cbFirstType!=cbNextType)) return false;

	//开始对比
	switch (cbNextType)
	{
	case exp.CardType.CT_SINGLE:
	case exp.CardType.CT_DOUBLE:
	case exp.CardType.CT_SINGLE_LINE:
	case exp.CardType.CT_DOUBLE_LINE:
	case exp.CardType.CT_THREE_LINE:
	case exp.CardType.CT_BOMB_CARD:
		{
			//获取数值
			let cbNextLogicValue=exp.GetCardLogicValue(cbNextCard[0]);
			let cbFirstLogicValue=exp.GetCardLogicValue(cbFirstCard[0]);

			//对比扑克
			return cbNextLogicValue>cbFirstLogicValue;
		}
	case exp.CardType.CT_THREE_LINE_TAKE_TWO:
		{
			//分析扑克
			let NextResult = exp.AnalysebCardData(cbNextCard,cbNextCount);
			let FirstResult = exp.AnalysebCardData(cbFirstCard,cbFirstCount);

			////////新增加 2011-1-13 9:54:31
			if (NextResult.cbFourCount>0&&NextResult.cbThreeCount==0)
				NextResult.cbThreeCardData[0]= NextResult.cbFourCardData[0];
			if (FirstResult.cbFourCount>0&&FirstResult.cbThreeCount==0)
				FirstResult.cbThreeCardData[0]= FirstResult.cbFourCardData[0];
			////////////////////////////////
			//获取数值
			let cbNextLogicValue=exp.GetCardLogicValue(NextResult.cbThreeCardData[0]);
			let cbFirstLogicValue=exp.GetCardLogicValue(FirstResult.cbThreeCardData[0]);
			//2011-2-14 15:18:19新增
			if (FirstResult.cbThreeCount==3&&cbFirstCount==10)
			{
				if (exp.GetCardLogicValue(FirstResult.cbThreeCardData[0])!=(exp.GetCardLogicValue(FirstResult.cbThreeCardData[3])+1))
					cbFirstLogicValue=exp.GetCardLogicValue(FirstResult.cbThreeCardData[3]);
			}
			if (NextResult.cbThreeCount==3&&cbNextCount==10)
			{
				if (exp.GetCardLogicValue(NextResult.cbThreeCardData[0])!=(exp.GetCardLogicValue(NextResult.cbThreeCardData[3])+1))
					cbNextLogicValue=exp.GetCardLogicValue(NextResult.cbThreeCardData[3]);
			}
			//2011年3月1日16:11:36新增
			if (FirstResult.cbThreeCount==4&&cbFirstCount==15)
			{
				if (exp.GetCardLogicValue(FirstResult.cbThreeCardData[0])!=(exp.GetCardLogicValue(FirstResult.cbThreeCardData[3])+1))
					cbFirstLogicValue=exp.GetCardLogicValue(FirstResult.cbThreeCardData[3]);
			}
			if (NextResult.cbThreeCount==4&&cbNextCount==15)
			{
				if (exp.GetCardLogicValue(NextResult.cbThreeCardData[0])!=(exp.GetCardLogicValue(NextResult.cbThreeCardData[3])+1))
					cbNextLogicValue=exp.GetCardLogicValue(NextResult.cbThreeCardData[3]);
			}

			//对比扑克
			return cbNextLogicValue>cbFirstLogicValue;
		}
	case exp.CardType.CT_FOUR_LINE_TAKE_THREE:
		{
			//分析扑克
			let NextResult = exp.AnalysebCardData(cbNextCard,cbNextCount);
			let FirstResult = exp.AnalysebCardData(cbFirstCard,cbFirstCount);

			//获取数值
			let cbNextLogicValue=exp.GetCardLogicValue(NextResult.cbFourCardData[0]);
			let cbFirstLogicValue=exp.GetCardLogicValue(FirstResult.cbFourCardData[0]);
			//对比扑克
			return cbNextLogicValue>cbFirstLogicValue;
		}
	}

	return false;
}

//删除扑克
exp.RemoveCard = function(cbRemoveCard, cbRemoveCount, cbCardData, cbCardCount)
{
	//检验数据
	if(cbRemoveCount>cbCardCount) return false;

	//定义变量
	let cbDeleteCount=0;
	let cbTempCardData = [];
	// if (cbCardCount > 16) return false;
	cbTempCardData = cbCardData.slice(0);

	//置零扑克
	for (let i=0;i<cbRemoveCount;i++)
	{
		for (let j=0;j<cbCardCount;j++)
		{
			if (cbRemoveCard[i]==cbTempCardData[j])
			{
				cbDeleteCount++;
				cbTempCardData[j]=0;
				break;
			}
		}
	}
	if (cbDeleteCount!=cbRemoveCount)
	{
		return false;
	}

	//清理扑克
	let cbCardPos=0;
	for (let i=0;i<cbCardCount;i++)
	{
		if (cbTempCardData[i]!=0) cbCardData[cbCardPos++]=cbTempCardData[i];
	}
	cbCardData.splice(cbCardCount-cbDeleteCount,cbDeleteCount);
	return true;
}

//出牌搜索
exp.SearchOutCard = function(cbHandCardData, cbHandCardCount, cbTurnCardData, cbTurnCardCount, OutCardResult)
{
	//设置结果
	if (!OutCardResult) {
		OutCardResult = {};
		OutCardResult.cbCardCount = 0;
		OutCardResult.cbResultCard = [];
	}
	
	//构造扑克
	let cbCardData = cbHandCardData.slice(0);
	let cbCardCount=cbHandCardCount;

	//排列扑克
	exp.SortCardList(cbCardData,cbCardCount);

	//获取类型
	let cbTurnOutType=exp.GetCardType(cbTurnCardData,cbTurnCardCount);

	//出牌分析
	switch (cbTurnOutType)
	{
	case exp.CardType.CT_ERROR:					//错误类型
		{
			return false;
		}
	case exp.CardType.CT_SINGLE:					//单牌类型
		{		
			//获取数值
			let cbLogicValue=exp.GetCardLogicValue(cbTurnCardData[0]);
			//分析扑克
			let AnalyseResult = exp.AnalysebCardData(cbCardData,cbCardCount);
			//寻找单牌
			for (let i=0;i<AnalyseResult.cbSignedCount;i++)
			{
				let cbIndex=AnalyseResult.cbSignedCount-i-1;
				if (exp.GetCardLogicValue(AnalyseResult.cbSignedCardData[cbIndex])>cbLogicValue)
				{
					//设置结果
					OutCardResult.cbCardCount=cbTurnCardCount;
					OutCardResult.cbResultCard=AnalyseResult.cbSignedCardData.slice(cbIndex, cbIndex + cbTurnCardCount);
					return true;
				}
			}
			//全部查找
			for (let i=0;i<cbCardCount;i++)  
			{
				if (exp.GetCardLogicValue(cbCardData[cbCardCount-i-1])>cbLogicValue)
				{
					OutCardResult.cbResultCard=cbCardData.slice(cbCardCount-i-1, cbCardCount-i-1 + cbTurnCardCount);
					OutCardResult.cbCardCount = cbTurnCardCount;
					return true;
				}
			}
		/*	AfxMessageBox("检测单顺");*/
			break;
		}
	case exp.CardType.CT_DOUBLE:					//对牌类型
		{
			//获取数值
			let cbLogicValue=exp.GetCardLogicValue(cbTurnCardData[0]);
			//分析扑克
			let AnalyseResult = exp.AnalysebCardData(cbCardData,cbCardCount);
			//寻找对牌
			for (let i=0;i<AnalyseResult.cbDoubleCount;i++)
			{
				let cbIndex=(AnalyseResult.cbDoubleCount-i-1)*2;
				if (exp.GetCardLogicValue(AnalyseResult.cbDoubleCardData[cbIndex])>cbLogicValue)
				{
					//设置结果
					OutCardResult.cbCardCount=cbTurnCardCount;
					OutCardResult.cbResultCard=AnalyseResult.cbDoubleCardData.slice(cbIndex, cbIndex + cbTurnCardCount);
					return true;
				}
			}
			//拆三张
			for (let i=0;i<AnalyseResult.cbThreeCount;i++)
			{
				let cbIndex=(AnalyseResult.cbThreeCount-i-1)*3;
				if (exp.GetCardLogicValue(AnalyseResult.cbThreeCardData[cbIndex])>cbLogicValue)
				{
					//设置结果
					OutCardResult.cbCardCount=cbTurnCardCount;
					OutCardResult.cbResultCard=AnalyseResult.cbThreeCardData.slice(cbIndex, cbIndex + cbTurnCardCount);
					return true;
				}
			}
			break;
		}

	case exp.CardType.CT_SINGLE_LINE:		//单连类型
		{
			//长度判断
			if (cbCardCount<cbTurnCardCount) break;

			//获取数值
			let cbLogicValue=exp.GetCardLogicValue(cbTurnCardData[0]);

			//搜索连牌
			for (let i=(cbTurnCardCount-1);i<cbCardCount;i++)
			{
				//获取数值
				let cbHandLogicValue=exp.GetCardLogicValue(cbCardData[cbCardCount-i-1]);

				//构造判断
				if (cbHandLogicValue>=15) break;
				if (cbHandLogicValue<=cbLogicValue) continue;

				//搜索连牌
				let cbLineCount=0;
				for (let j=(cbCardCount-i-1);j<cbCardCount;j++)
				{
					if ((exp.GetCardLogicValue(cbCardData[j])+cbLineCount)==cbHandLogicValue) 
					{
						//增加连数
						OutCardResult.cbResultCard[cbLineCount++]=cbCardData[j];

						//完成判断
						if (cbLineCount==cbTurnCardCount)
						{
							OutCardResult.cbCardCount=cbTurnCardCount;
							return true;
						}
					}
				}
			}

			break;
		}
	case exp.CardType.CT_DOUBLE_LINE:		//对连类型
		{
			//长度判断
			if (cbCardCount<cbTurnCardCount) break;

			//获取数值
			let cbLogicValue=exp.GetCardLogicValue(cbTurnCardData[0]);

			//搜索连牌
			for (let i=(cbTurnCardCount-1);i<cbCardCount;i++)
			{
				//获取数值
				let cbHandLogicValue=exp.GetCardLogicValue(cbCardData[cbCardCount-i-1]);

				//构造判断
				if (cbHandLogicValue<=cbLogicValue) continue;
				if ((cbTurnCardCount>1)&&(cbHandLogicValue>=15)) break;

				//搜索连牌
				let cbLineCount=0;
				for (let j=(cbCardCount-i-1);j<(cbCardCount-1);j++)
				{
					if (((exp.GetCardLogicValue(cbCardData[j])+cbLineCount)==cbHandLogicValue)
						&&((exp.GetCardLogicValue(cbCardData[j+1])+cbLineCount)==cbHandLogicValue))
					{
						//增加连数
						OutCardResult.cbResultCard[cbLineCount*2]=cbCardData[j];
						OutCardResult.cbResultCard[(cbLineCount++)*2+1]=cbCardData[j+1];

						//完成判断
						if (cbLineCount*2==cbTurnCardCount)
						{
							OutCardResult.cbCardCount=cbTurnCardCount;
							return true;
						}
					}
				}
			}

			break;
		}
	case exp.CardType.CT_THREE_LINE:				//三连类型
	case exp.CardType.CT_THREE_LINE_TAKE_TWO:	//三带一对
		{
			//长度判断
			//if (cbCardCount<cbTurnCardCount) break;

			//获取数值
			let cbLogicValue=0;
			for (let i=0;i<cbTurnCardCount-2;i++)
			{
				cbLogicValue=exp.GetCardLogicValue(cbTurnCardData[i]);
				if (exp.GetCardLogicValue(cbTurnCardData[i+1])!=cbLogicValue) continue;
				if (exp.GetCardLogicValue(cbTurnCardData[i+2])!=cbLogicValue) continue;
				break;
			}
			//2011-2-14 15:27:21新增
			if (cbTurnOutType==exp.CardType.CT_THREE_LINE_TAKE_TWO&&cbTurnCardCount==10)
			{
				let FirstResult = exp.AnalysebCardData(cbTurnCardData,cbTurnCardCount);
				if (FirstResult.cbThreeCount==3)
				{
					if (exp.GetCardLogicValue(FirstResult.cbThreeCardData[0])!=(exp.GetCardLogicValue(FirstResult.cbThreeCardData[3])+1))
					cbLogicValue = exp.GetCardLogicValue(FirstResult.cbThreeCardData[3]);
				}
			}

			//属性数值
			let cbTurnLineCount=0;
			if (cbTurnOutType==exp.CardType.CT_THREE_LINE_TAKE_TWO) cbTurnLineCount=cbTurnCardCount/5;
			else cbTurnLineCount=cbTurnCardCount/3;

			//搜索连牌
			for (let i=cbTurnLineCount*3-1;i<cbCardCount;i++)
			{
				//获取数值
				let cbHandLogicValue=exp.GetCardLogicValue(cbCardData[cbCardCount-i-1]);

				//构造判断
				if (cbHandLogicValue<=cbLogicValue) continue;
				if ((cbTurnLineCount>1)&&(cbHandLogicValue>=15)) break;

				//搜索连牌
				let cbLineCount=0;
				for (let j=(cbCardCount-i-1);j<(cbCardCount-2);j++)
				{
					//设置变量
					OutCardResult.cbCardCount=0;

					//三牌判断
					if ((exp.GetCardLogicValue(cbCardData[j])+cbLineCount)!=cbHandLogicValue) continue;
					if ((exp.GetCardLogicValue(cbCardData[j+1])+cbLineCount)!=cbHandLogicValue) continue;
					if ((exp.GetCardLogicValue(cbCardData[j+2])+cbLineCount)!=cbHandLogicValue) continue;

					//增加连数
					OutCardResult.cbResultCard[cbLineCount*3]=cbCardData[j];
					OutCardResult.cbResultCard[cbLineCount*3+1]=cbCardData[j+1];
					OutCardResult.cbResultCard[(cbLineCount++)*3+2]=cbCardData[j+2];

					//完成判断
					if (cbLineCount==cbTurnLineCount)
					{
						//连牌设置
						OutCardResult.cbCardCount=cbLineCount*3;

						//构造扑克
						let cbLeftCardData = cbCardData.slice(0);
						let cbLeftCount=cbCardCount-OutCardResult.cbCardCount;
						exp.RemoveCard(OutCardResult.cbResultCard,OutCardResult.cbCardCount,cbLeftCardData,cbCardCount);

						//分析扑克
						let AnalyseResultLeft = exp.AnalysebCardData(cbLeftCardData,cbLeftCount);

						//对牌处理
						if (cbTurnOutType==exp.CardType.CT_THREE_LINE_TAKE_TWO)
						{

							//////提取单牌 2011-6-7 16:49:26 新增
							if (AnalyseResultLeft.cbSignedCount>=2)
							{
								for (let k=0;k<AnalyseResultLeft.cbSignedCount;k++)
								{
									if ((OutCardResult.cbCardCount==cbTurnCardCount) || (OutCardResult.cbCardCount==cbHandCardCount)) break;
									OutCardResult.cbResultCard[OutCardResult.cbCardCount++]
									=AnalyseResultLeft.cbSignedCardData[AnalyseResultLeft.cbSignedCount-k-1];
								}
							}

							//提取对牌
							for (let k=0;k<AnalyseResultLeft.cbDoubleCount;k++)
							{
								//中止判断
								if ((OutCardResult.cbCardCount==cbTurnCardCount) || (OutCardResult.cbCardCount==cbHandCardCount)) break;

								//设置扑克
								let cbIndex=(AnalyseResultLeft.cbDoubleCount-k-1)*2;
								let cbCardData1=AnalyseResultLeft.cbDoubleCardData[cbIndex];
								let cbCardData2=AnalyseResultLeft.cbDoubleCardData[cbIndex+1];
								OutCardResult.cbResultCard[OutCardResult.cbCardCount++]=cbCardData1;
								if (OutCardResult.cbCardCount==cbTurnCardCount)break; //////xiaohua
								OutCardResult.cbResultCard[OutCardResult.cbCardCount++]=cbCardData2;
							}

							//提取三牌
							for (let k=0;k<AnalyseResultLeft.cbThreeCount;k++)
							{
								//中止判断
								if ((OutCardResult.cbCardCount==cbTurnCardCount) || (OutCardResult.cbCardCount==cbHandCardCount)) break;

								//设置扑克
								let cbIndex=(AnalyseResultLeft.cbThreeCount-k-1)*3;
								let cbCardData1=AnalyseResultLeft.cbThreeCardData[cbIndex];
								let cbCardData2=AnalyseResultLeft.cbThreeCardData[cbIndex+1];
								OutCardResult.cbResultCard[OutCardResult.cbCardCount++]=cbCardData1;
								if ((OutCardResult.cbCardCount==cbTurnCardCount) || (OutCardResult.cbCardCount==cbHandCardCount)) break; ///////xiaohua
								OutCardResult.cbResultCard[OutCardResult.cbCardCount++]=cbCardData2;
							} 

							//提取单牌 2010年11月18日11:47:14
							for (let k=0;k<AnalyseResultLeft.cbSignedCount;k++)
							{
								if ((OutCardResult.cbCardCount==cbTurnCardCount) || (OutCardResult.cbCardCount==cbHandCardCount)) break;
								OutCardResult.cbResultCard[OutCardResult.cbCardCount++]
								=AnalyseResultLeft.cbSignedCardData[AnalyseResultLeft.cbSignedCount-k-1];
							}
						}

						//完成判断
						if ((OutCardResult.cbCardCount==cbTurnCardCount) || (OutCardResult.cbCardCount==cbHandCardCount)) return true;
					}
				}
			}

			break;
		}
	}
	//搜索炸弹
	if (cbCardCount>=4)
	{
		//变量定义
		let cbLogicValue=0;
		if (cbTurnOutType==exp.CardType.CT_BOMB_CARD) cbLogicValue=exp.GetCardLogicValue(cbTurnCardData[0]);

		//搜索炸弹
		for (let i=3;i<cbCardCount;i++)
		{
			//获取数值
			let cbHandLogicValue=exp.GetCardLogicValue(cbCardData[cbCardCount-i-1]);

			//构造判断
			if (cbHandLogicValue<=cbLogicValue) continue;

			//炸弹判断
			let cbTempLogicValue=exp.GetCardLogicValue(cbCardData[cbCardCount-i-1]);

			let j = 0;
			for (j=1;j<4;j++)
			{
				if (exp.GetCardLogicValue(cbCardData[cbCardCount+j-i-1])!=cbTempLogicValue) break;
			}
			if (j!=4) continue;

			//设置结果
			OutCardResult.cbCardCount=4;
			OutCardResult.cbResultCard[0]=cbCardData[cbCardCount-i-1];
			OutCardResult.cbResultCard[1]=cbCardData[cbCardCount-i];
			OutCardResult.cbResultCard[2]=cbCardData[cbCardCount-i+1];
			OutCardResult.cbResultCard[3]=cbCardData[cbCardCount-i+2];

			return true;
		}
	}

	//搜索火箭
	if ((cbCardCount>=2)&&(cbCardData[0]==0x4F)&&(cbCardData[1]==0x4E))
	{
		//设置结果
		OutCardResult.cbCardCount=2;
		OutCardResult.cbResultCard[0]=cbCardData[0];
		OutCardResult.cbResultCard[1]=cbCardData[1];

		return true;
	}
	return false;
}

//获得最大值
exp.GetHandMaxCard = function(cbCardData, cbCardCount)
{
	let HandCard = [], HandCount;
	HandCount = cbCardCount;
	HandCard = cbCardData.slice(0);
	exp.SortCardList(HandCard,HandCount);
	return HandCard[0];
}