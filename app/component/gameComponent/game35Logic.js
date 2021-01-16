/**
 * Date: 2020/4/2
 * Author: admin
 * Description: 游戏辅助函数
 */
'use strict';
var lodash = require('lodash');
var pro = module.exports;

//////////////////////////////////////////////////////////////////////////

//麻将数据
var m_cbCardDataArray = [
	0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,						//万子
	0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,						//万子
	0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,						//万子
	0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,						//万子
	0x11,0x12,0x13,0x14,0x15,0x16,0x17,0x18,0x19,						//索子
	0x11,0x12,0x13,0x14,0x15,0x16,0x17,0x18,0x19,						//索子
	0x11,0x12,0x13,0x14,0x15,0x16,0x17,0x18,0x19,						//索子
	0x11,0x12,0x13,0x14,0x15,0x16,0x17,0x18,0x19,						//索子
	0x21,0x22,0x23,0x24,0x25,0x26,0x27,0x28,0x29,						//同子
	0x21,0x22,0x23,0x24,0x25,0x26,0x27,0x28,0x29,						//同子
	0x21,0x22,0x23,0x24,0x25,0x26,0x27,0x28,0x29,						//同子
	0x21,0x22,0x23,0x24,0x25,0x26,0x27,0x28,0x29,						//同子
	0x31,																//红中
	0x31,
	0x31,
	0x31,
];

var m_cbCardDataArrayEx = [
	0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,						//万子
	0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,						//万子
	0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,						//万子
	0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,						//万子
	0x11,0x12,0x13,0x14,0x15,0x16,0x17,0x18,0x19,						//索子
	0x11,0x12,0x13,0x14,0x15,0x16,0x17,0x18,0x19,						//索子
	0x11,0x12,0x13,0x14,0x15,0x16,0x17,0x18,0x19,						//索子
	0x11,0x12,0x13,0x14,0x15,0x16,0x17,0x18,0x19,						//索子
	0x31,																//红中
	0x31,
	0x31,
	0x31,
];

var	MASK_COLOR = 0xF0;								//花色掩码
var MASK_VALUE = 0x0F;								//数值掩码

//////////////////////////////////////////////////////////////////////////

pro.WIKType = {
	WIK_NULL: 0x00,								//没有类型
	WIK_LEFT: 0x01,								//左吃类型
	WIK_CENTER: 0x02,							//中吃类型
	WIK_RIGHT: 0x04,							//右吃类型
	WIK_PENG: 0x08,								//碰牌类型
	WIK_FILL: 0x20,								//补牌类型
	WIK_GANG: 0x20,								//杠牌类型
	WIK_CHI_HU: 0x40,							//吃胡类型
	WIK_HAIDI: 0x80,							//海底类型
}

//混乱麻将
pro.RandCardData = function(bMaxCount)
{
	if (112-36 == bMaxCount)
	{
		var cbCardData = m_cbCardDataArrayEx.slice(0);
		let tempArr = lodash.shuffle(cbCardData);
		tempArr = lodash.shuffle(tempArr);
		return tempArr;
	}else
	{
		var cbCardData = m_cbCardDataArray.slice(0);
		let tempArr = lodash.shuffle(cbCardData);
		tempArr = lodash.shuffle(tempArr);
		return tempArr;
	}
}

//麻将转换
pro.SwitchToCardIndexEx = function(cbCardData, cbStartIndex, cbCardCount)
{
	let cbCardIndex = [];

	//转换麻将
	for (let i=0;i<cbCardCount;i++)
	{
		cbCardIndex[this.SwitchToCardIndex(cbCardData[cbStartIndex+i])]++;
	}

	return cbCardIndex;
}

//麻将转换
pro.SwitchToCardIndex = function(cbCardData)
{
	return ((cbCardData&MASK_COLOR)>>4)*9+(cbCardData&MASK_VALUE)-1;
}

//麻将转换
pro.SwitchToCardDataEx = function(cbCardIndex)
{
	//转换麻将
	let cbPosition=0;
	let cbCardData = [];
	for (let j=0; j<cbCardIndex[31] || 0; j++)
	{
		cbCardData[cbPosition++]=this.SwitchToCardData(31);
	}

	for (let i=0;i<34;i++)
	{
		cbCardIndex[i] = cbCardIndex[i] || 0;
		if ( (i!= 31) && cbCardIndex[i]!=0)
		{
			for (let j=0;j<cbCardIndex[i];j++)
			{
				cbCardData[cbPosition++]=this.SwitchToCardData(i);
			}
		}
	}
	return cbCardData;
}

//麻将转换
pro.SwitchToCardData = function(cbCardIndex)
{
	return ((cbCardIndex/9)<<4)|(cbCardIndex%9+1);
}

pro.IsHongzhongHu = function(cbCardIndex)
{
	//麻将判断
	if (cbCardIndex[27] != 4) return false; //第27位属于癞子红中
	return true;
}

//杠牌分析
pro.AnalyseGangCard = function(cbCardIndex, WeaveItem, cbWeaveCount, GangCardResult, GongGangCardResult, GongGangCard,CardPenForbidGang,GangBuCardResult)
{
	//设置变量
	let cbActionMask = this.WIKType.WIK_NULL;
	GangCardResult.cbCardCount = 0;
	GangCardResult.cbCardData = [0, 0, 0, 0];
	GongGangCardResult.cbCardData = 0;

	//手上杠牌
	for (let i=0;i<34;i++)
	{
		//if (cbCardIndex[27] >0) continue;
		if (i == 27) continue;

		if (cbCardIndex[i]==4)
		{
			cbActionMask|=(this.WIKType.WIK_GANG|this.WIKType.WIK_FILL);
			GangCardResult.cbCardData[GangCardResult.cbCardCount]=(this.WIKType.WIK_GANG|this.WIKType.WIK_FILL);
			GangCardResult.cbCardData[GangCardResult.cbCardCount++]=this.SwitchToCardData(i);
			GangBuCardResult.mGangCard[GangBuCardResult.mGangCardCount++] = this.SwitchToCardData(i);
		}
	}

	//组合杠牌
	for (let i=0;i<cbWeaveCount;i++)
	{
		if (WeaveItem[i].cbWeaveKind==this.WIKType.WIK_PENG)
		{
			let BGongCard = false;
			for (let j = 0; j< 4; j++)
			{
				if (WeaveItem[i].cbCenterCard == GongGangCard[j]) BGongCard = true; //公杠取消后不能再杠
			}
			if (BGongCard) continue;
			
			if ((cbCardIndex[this.SwitchToCardIndex(WeaveItem[i].cbCenterCard)]==1) && (CardPenForbidGang[this.SwitchToCardIndex(WeaveItem[i].cbCenterCard)] != 1)) //WeaveItem[i].cbCenterCard == ProvideCard
			{
				cbActionMask|=(this.WIKType.WIK_GANG|this.WIKType.WIK_FILL);
				GangCardResult.cbCardData[GangCardResult.cbCardCount]=(this.WIKType.WIK_GANG|this.WIKType.WIK_FILL);
				GangCardResult.cbCardData[GangCardResult.cbCardCount++]=WeaveItem[i].cbCenterCard;

				GongGangCardResult.cbCardData = WeaveItem[i].cbCenterCard;
				GangBuCardResult.mGangCard[GangBuCardResult.mGangCardCount++] = WeaveItem[i].cbCenterCard;
			}
		}
	}

	return cbActionMask;
}

//删除麻将
pro.RemoveCard = function(cbCardIndex, cbRemoveCard)
{
	//删除麻将
	let cbRemoveIndex = this.SwitchToCardIndex(cbRemoveCard);
	if (cbCardIndex[cbRemoveIndex]>0)
	{
		cbCardIndex[cbRemoveIndex]--;
		return true;
	}
	return false;
}