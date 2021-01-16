'use strict';
var utils = module.exports;

// control variable of func "myPrint"
var isPrintFlag = false;
// var isPrintFlag = true;

/**
 * Check and invoke callback function
 */
utils.invokeCallback = function (cb) {
    if (!!cb && typeof cb === 'function') {
        cb.apply(null, Array.prototype.slice.call(arguments, 1));
    }
};

/**
 * clone an object
 */
utils.clone = function (obj) {
    var o;
    if (typeof obj == "object") {
        if (obj === null) {
            o = null;
        } else {
            if (obj instanceof Array) {
                o = [];
                for (var i = 0, len = obj.length; i < len; i++) {
                    o.push(utils.clone(obj[i]));
                }
            } else {
                o = {};
                for (var j in obj) {
                    o[j] = utils.clone(obj[j]);
                }
            }
        }
    } else {
        o = obj;
    }
    return o;
};

utils.size = function (obj) {
    if (!obj) {
        return 0;
    }

    var size = 0;
    for (var f in obj) {
        if (obj.hasOwnProperty(f)) {
            size++;
        }
    }

    return size;
};

// print the file name and the line number ~ begin
function getStack() {
    var orig = Error.prepareStackTrace;
    Error.prepareStackTrace = function (_, stack) {
        return stack;
    };
    var err = new Error();
    Error.captureStackTrace(err, arguments.callee);
    var stack = err.stack;
    Error.prepareStackTrace = orig;
    return stack;
}

function getFileName(stack) {
    return stack[1].getFileName();
}

function getLineNumber(stack) {
    return stack[1].getLineNumber();
}

utils.myPrint = function () {
    if (isPrintFlag) {
        var len = arguments.length;
        if (len <= 0) {
            return;
        }
        var stack = getStack();
        var aimStr = '\'' + getFileName(stack) + '\' @' + getLineNumber(stack) + ' :\n';
        for (var i = 0; i < len; ++i) {
            aimStr += arguments[i] + ' ';
        }
        console.log('\n' + aimStr);
    }
};
// print the file name and the line number ~ end

// 获取对象类名
utils.getObjectClass = function (obj) {
    if (obj && obj.constructor && obj.constructor.toString()) {
        /*
         * for browsers which have name property in the constructor
         * of the object,such as chrome
         */
        if (obj.constructor.name) {
            return obj.constructor.name;
        }
        var str = obj.constructor.toString();
        /*
         * executed if the return of object.constructor.toString() is
         * "[object objectClass]"
         */
        if (str.charAt(0) == '[') {
            var arr = str.match(/\[\w+\s*(\w+)\]/);
        } else {
            /*
             * executed if the return of object.constructor.toString() is
             * "function objectClass () {}"
             * for IE Firefox
             */
            var arr = str.match(/function\s*(\w+)/);
        }
        if (arr && arr.length == 2) {
            return arr[1];
        }
    }
    return undefined;
};

String.prototype.format = function (args) {
    var result = this;
    if (arguments.length > 0) {
        if (arguments.length == 1 && typeof (args) == "object") {
            for (var key in args) {
                if (args[key] != undefined) {
                    var reg = new RegExp("({" + key + "})", "g");
                    result = result.replace(reg, args[key]);
                }
            }
        }
        else {
            for (var i = 0; i < arguments.length; i++) {
                if (arguments[i] != undefined) {
                    var reg = new RegExp("({)" + i + "(})", "g");
                    result = result.replace(reg, arguments[i]);
                }
            }
        }
    }
    return result;
};

utils.isEmptyObject = function (obj) {
    for (let n in obj) {
        return false;
    }
    return true;
};

function getMyDate(date) {
    var oDate = new Date(date),
    oYear = oDate.getFullYear(),
    oMonth = oDate.getMonth()+1,
    oDay = oDate.getDate(),
    oHour = oDate.getHours(),
    oMin = oDate.getMinutes(),
    oSen = oDate.getSeconds(),
    oTime = oYear +'-'+ addZero(oMonth) +'-'+ addZero(oDay) +' '+ addZero(oHour) +':'+addZero(oMin) +':'+addZero(oSen);
    return oTime;
}

function addZero(num){
    if(parseInt(num) < 10){
        num = '0'+num;
    }
    return num;
} 

/**
 * date: 单位毫秒时间
 * 某时间与今天相差天数
 * 返回0是当天, 为负数，-1为明天,负多少就是差多少,正数相反的道理.
 *  */  
utils.judgeTime = function (date) {
	if (!date || date == 0) {
		return 0;
	}
	let dateTime = getMyDate(date);
    let year = dateTime.substring(0, 4);
    let month = dateTime.substring(5, 7);
    let day = dateTime.substring(8, 10);
    let d1 = new Date(year + '/' + month + '/' + day);
    let dd = new Date();
    let y = dd.getFullYear();
    let m = dd.getMonth() + 1;
    let d = dd.getDate();
    let d2 = new Date(y + '/' + m + '/' + d);
	let iday = parseInt(d2 - d1) / 1000 / 60 / 60 / 24;
	// console.log('比较时间:', year + '/' + month + '/' + day);
	// console.log('当前时间:', y + '/' + m + '/' + d);
	// console.log('相差天数:', iday);
    return Math.floor(iday);
};
