"use strict";

const util = require('util'), path = require('path'), fs = require('fs');
const crypto = require('crypto');
const moment = require('moment');
const BigNumber = require('bignumber.js');

module.exports.mkdir = function(dir) {
    let p = path.dirname(path.normalize(dir));
    let isAbs = path.isAbsolute(p);
    let current_path = '';
    p = p.split(path.sep);
    if(isAbs) {
        current_path = p[0];
        if((current_path.length <= 0) && (path.sep == '/')) {
            current_path = "/";
        }
        p.shift();
    }

    for(let i = 0; i < p.length; ++i) {
        current_path = path.join(current_path, p[i]);
        if (!fs.existsSync(current_path))
        {
            fs.mkdirSync(current_path);
        }
    }
};

// [min, max]
module.exports.random = function (min, max) {
    var range = max - min;
    var rand = Math.random();
    return (min + Math.round(rand * range));
}

module.exports.intersect = function (a, b) {
    if (a.length == 0 || b.length == 0)
        return true;

    for (let i = 0; i < a.length; i++) {
        if (b.indexOf(a[i]) >= 0)
            return true;
    }

    return false;
}

module.exports.md5 = function (s) {
    let p = crypto.createHash('md5');
    p.update(s);
    return p.digest('hex');
};

module.exports.sha1 = function (s) {
    let p = crypto.createHash('sha1');
    p.update(s);
    return p.digest('hex');
};

module.exports.publicEncrypt = function (s, publicKey) {
    let buffer = new Buffer(s);
    let encrypt = crypto.publicEncrypt(publicKey, buffer)
    return encrypt.toString("base64");
}

module.exports.privateDecrypt = function (s, privateKey) {
    let buffer = new Buffer(s, "base64");
    let decrypt = crypto.privateDecrypt(privateKey, buffer);
    return decrypt.toString();
}

module.exports.privateEncrypt = function (s, privateKey) {
    let buffer = new Buffer(s);
    let encrypt = crypto.privateEncrypt(privateKey, buffer)
    return encrypt.toString("base64");
}

module.exports.publicDecrypt = function (s, publicKey) {
    let buffer = new Buffer(s, "base64");
    let decrypt = crypto.publicDecrypt(publicKey, buffer);
    return decrypt.toString();
}

module.exports.getDayDiff = function (tt1, tt2) {
    let t1 = new Date(tt1).addHours(8);
    let t2 = new Date(tt2).addHours(8);
    t1.setHours(0);
    t1.setMinutes(0);
    t1.setSeconds(0);
    t1.setMilliseconds(0);
    t2.setHours(0);
    t2.setMinutes(0);
    t2.setSeconds(0);
    t2.setMilliseconds(0);
    return (t1 - t2) / (24 * 60 * 60 * 1000);
};

module.exports.arrayFind = function (arr, key, value) {
    for (let i = 0; i < arr.length; i++) {
        if (arr[i][key] == value)
            return i;
    }

    return -1;
};

module.exports.sleep = function (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

module.exports.getTimestamp = function () {
    return parseInt(new Date().getTime() / 1000)
}

module.exports.aesEncrypt = function(str, secret) {
    var cipher = crypto.createCipher('aes192', secret);
    var enc = cipher.update(str, 'utf8', 'hex');
    enc += cipher.final('hex');
    return enc;
}

module.exports.createHmacSHA1 = function (s, hmacKey) {
    return crypto.createHmac('sha1', hmacKey).update(s, 'utf8').digest('hex').toUpperCase();
}

module.exports.aesDecrypt = function(str, secret) {
    var decipher = crypto.createDecipher('aes192', secret);
    var dec = decipher.update(str, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
}

module.exports.createSha256 = function (s) {
    return crypto.createHash('sha256').update(s).digest('hex').toUpperCase();
}

module.exports.calcSign = function(url, data) {
    var newkey = Object.keys(data).sort();
    var source = url;
    if (newkey.length > 0) {
        source += '?';
    }

    for (let i in newkey)
    {
        // plog.info("[TYPE]" + typeof(data[newkey[i]]));
        let tmp = data[newkey[i]];
        if (typeof(data[newkey[i]]) == 'object')
            tmp = JSON.stringify(data[newkey[i]]);
        source += newkey[i] + '=' + tmp + '&';
    }
    source = source.substr(0, source.length - 1);
    // plog.info("[SOURCE]:"+source);
    var sign = tools.createHmacSHA1(source, settings.hmacKey);
    return sign;
}

module.exports.signData = function(url, data) {
    if (!data.ts) {
        data.ts = parseInt(Date.now() / 1000);
    }

    data.sign = this.calcSign(url, data);
}

module.exports.checkSign = function(url, data) {
    if (!data.sign || ! data.ts) {
        return false;
    }

    if (Math.abs(data.ts - Date.now() / 1000) > 5) {
        return false;
    }
    let sign = data.sign;
    delete data['sign'];
    // plog.info("[ORIGIN DATA]:" + data);
    let sign1 = this.calcSign(url, data);
    // plog.info("[SIGN] :" +sign1);
    delete data['ts'];
    return sign.toUpperCase() == sign1.toUpperCase();
}

module.exports.buildCoinEntryJson = function(coinType, lineAddr)
{
    var limitAmount = {
        currency: coinType,
        issuer: lineAddr,
        value: "1000000000",
    };
    var entryJsonIn = {
        Flags: "131072",
        LimitAmount: limitAmount,
    };
    var entryJsonOut = {
        Entry: entryJsonIn,
    };
    return entryJsonOut;
}

module.exports.buildRadardActivateAcountForManual = function( destination, radarAccount)
{
    var limitAry = Array();
    for (let line in settings.gateways) {
        limitAry.push(tools.buildCoinEntryJson(settings.gateways[line].toUpperCase(),line));
    }
    var activateJson = {
        TransactionType: "ActiveAccount",
        Account:radarAccount,
        Amount: "3000",
        Reference: destination,
        Referee: radarAccount,
        Limits: limitAry,
    };
    return activateJson;   
}

// 检查a是不是b的整数倍
module.exports.checkIntegralMultiple = function(a, b)
{
    let fa = parseFloat(a);
    let fb = parseFloat(b);

    let result = fa / fb;
    return (parseInt(result) - result) == 0;
}

// 把毫秒时间戳转化成天数
module.exports.calcDays = function(ms)
{
    return parseInt(ms/(24*3600*1000));
}

// 把key=a.b.c.d, 生产tmp={a:{b:{c:{d:value}}}
module.exports.makeMap = function(key, value) {
    var result = {};
    var assetSplit = key.split(".");
    if (assetSplit.length > 0) {
        let map = {};
        for (let index = assetSplit.length - 1; index > 0; index--) {
            const element = assetSplit[index];
            let tmp = {};
            if (index == assetSplit.length - 1) {
                tmp[element] = value;
            } else {
                tmp[element] = map;
            }
            map = tmp;
        }
        result[assetSplit[0]] = map;
    } else {
        result[key] = value;
    }
    return result;
}

// 比较两个时间戳的天数大小
module.exports.compareDays = function(ms, ms2)
{
    if (!ms) {
        ms = 0;
    }
    if (!ms2) {
        ms2 = 0;
    }

    var d1 = new Date(ms);
    var d2 = new Date(ms2);

    var md1 = moment(d1).format("YYYY-MM-DD");
    var md2 = moment(d2).format("YYYY-MM-DD");

    var date1 = md1.split("-");
    var date2 = md2.split("-");

    plog.info("日期比较:", "ms", md1, "ms2", md2);

    if (parseInt(date1[0]) > parseInt(date2[0])) {
        return 1;
    } else if (parseInt(date1[0]) < parseInt(date2[0])) {
        return -1;
    } else {
        if (parseInt(date1[1]) > parseInt(date2[1])) {
            return 1;
        } else if (parseInt(date1[1]) < parseInt(date2[1])) {
            return -1;
        } else {
            if (parseInt(date1[2]) > parseInt(date2[2])) {
                return 1;
            } else if (parseInt(date1[2]) < parseInt(date2[2])) {
                return -1;
            } else {
                return 0;
            }
        }
    }  
}

module.exports.toFixed = function(value, fixed) {
    let base = Math.pow(10, fixed);
    return parseFloat(parseInt(value * base) / base);
}

module.exports.mulDecimals = function(amount, decimals) {
    let amountBN = new BigNumber(amount);
    let factor = new BigNumber(10).pow(parseInt(decimals));
    return amountBN.times(factor).toFixed();
}

module.exports.divDecimals = function(amount, decimals) {
    let amountBN = new BigNumber(amount);
    let factor = new BigNumber(10).pow(parseInt(decimals));
    return amountBN.div(factor).toString();
}

module.exports.sendVerifyMail = function ( destination, rcode)
{
    plog.info("[EMAIL]: "+ destination +" [code]:" + rcode);
    var transporter = nodemailer.createTransport({
        host: "0.0.0.0",
        port: 1111,
        secure: false,
        auth: {
            user: 'abs@abschain.io',//''
            pass: 'ir31QOr4tximfZFpAXNW4A'//'oZEASo9jzHR89TjH'
        },
        tls: {
            rejectUnauthorized: false
        }
    });
    
    var mailOptions = {
        from: 'AbsChain<abs@abschain.io>', // 发件地址
        to: [destination], // 收件列表
        subject: 'Аладдин(ABS) уведомление', // 标题
        // text: rcode,
        // text: "", // 标题
        html:`<div style="color: green; background-color: black">`,
    };

    let data = Object.assign({}, mailOptions, null);
    let sendMailResult = transporter.sendMail(data, function(error, info){
        if(error){
            return console.log(error);
        }
        console.log(info);
    });
    return (sendMailResult);
}
