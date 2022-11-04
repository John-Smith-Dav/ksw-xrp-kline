"use strict";
const rp = require('request-promise');
const axios = require('axios');

let priceTable = {
    'btc':  0,
    'usd':  0,
    'eur':  0,
    'rub':  0,
    'usdt': 0
}
let priceSet = {
    // btc美元价格
    'btc': 'https://query1.finance.yahoo.com/v8/finance/chart/BTC-USD?region=US&lang=en-US&includePrePost=false&interval=3mo&range=1d&corsDomain=finance.yahoo.com&.tsrc=finance',
    // 美元人民币价格
    'usd': 'https://query1.finance.yahoo.com/v8/finance/chart/CNY=X?region=US&lang=en-US&includePrePost=false&interval=3mo&range=1d&corsDomain=finance.yahoo.com&.tsrc=finance',
    // 欧元美元价格
    'eur': 'https://query1.finance.yahoo.com/v8/finance/chart/EURUSD=X?region=US&lang=en-US&includePrePost=false&interval=3mo&range=1d&corsDomain=finance.yahoo.com&.tsrc=finance',
    // 卢布美元价格
    'rub': 'https://query1.finance.yahoo.com/v8/finance/chart/RUBUSD=X?region=US&lang=en-US&includePrePost=false&interval=3mo&range=1d&corsDomain=finance.yahoo.com&.tsrc=finance',
    // usdt美元价格
    'usdt': 'https://query1.finance.yahoo.com/v8/finance/chart/USDT-USD?region=US&lang=en-US&includePrePost=false&interval=3mo&range=1d&corsDomain=finance.yahoo.com&.tsrc=finance'
}
let symbolMap = {
    //"btc":  "usd",
    //"eth":  "usd",
    "usdt": "usd",
    //"ksw":  "usd"
}
/*
{
    'ald': {
        'xrp': {
            "btc": 123
            "usd": 123
        },
        'bab': {
            'xrp': 123
        }
    },
    'adr': {
        'xrp': {
            'usd': 123
        }
    }
}
*/
let marketPriceTable = {
    'ksw': {

    }
}

module.exports.work = async function () {
    this.workExtPrice();
}

module.exports.workExtPrice = async function () {
    while(true){
        try{
            await this.makePrice();
        }catch(e){
            plog.info("UPDATE PRICE ERR:" + e);
        }finally{
            //await tools.sleep(1000*5*60);
            await tools.sleep(1000*10);
        }
    }
}

module.exports.makePrice = async function () {
    /*
    循环将priceSet中的key取出，得到key对应的value（url）
    做网络请求，得到的结果，以此结果为value，以priceSet中的key为key，存入priceTable中
    */
    for (let key in priceSet) {
        const element = priceSet[key];  // 雅虎接口url
       /* let usdtRes = await rp({
            uri: encodeURI(element),
            method: 'GET',
            json: true,
        });*/
        let usdtRes;
        axios.defaults.timeout = 1000;
        try {
            //
            await axios.get(element)
                .then(response => {
                    usdtRes = response.data;
                })
                .catch(error => {
                    console.log(error);
                });
            let price = 0;
            price = usdtRes['chart']['result'][0]['meta'].regularMarketPrice;
            plog.info("[" + key + "]:" + price);
            priceTable[key] = price;
        }catch (e) {
            console.log('yahoo url failure');
        }
    }
    // priceTable={ btc: 54791.383, eth: 1813.3932, usdt: 0, usd: 0, eur: 0, rub: 0 }

}

/**
 * @param name
 * @param market1 XRP_BTC的XRP
 * @param market2 XRP_BTC的BTC
 * @param price
 */
module.exports.recodePrice = function(name, market1, market2, price) {
    if (symbolMap[market1]) {
        market1 = symbolMap[market1];
    }
    if (symbolMap[market2]) {
        market2 = symbolMap[market2];
    }
    if (!marketPriceTable[name]) {
        marketPriceTable[name] = {};
    }
    if (!marketPriceTable[name][market1]) {
        marketPriceTable[name][market1] = {};
    }
    marketPriceTable[name][market1][market2] = price;
}

module.exports.getCnyPrice = function(name, orgPrice, market2) {
    if (symbolMap[market2]) {
        market2 = symbolMap[market2];
    }
    if (priceTable[market2]) {
        return this.rawGetCnyPrice(name, orgPrice, market2);
    } else {
        if (!marketPriceTable[name]) {
            plog.error(name, "getCnyPrice", orgPrice, market2, "没有这个name");
            return 0;
        }
        if (!marketPriceTable[name][market2]) {
            plog.error(name, "getCnyPrice", orgPrice, market2, "没有这个name");
            return 0;
        }
        for (const symbol in marketPriceTable[name][market2]) {
            if (priceTable[symbol]) {
                return this.rawGetCnyPrice(name, orgPrice * marketPriceTable[name][market2][symbol], symbol);
            }
        }
    }
    plog.error(name, "getCnyPrice", orgPrice, market2, "没有这个name");
    return 0;
}

module.exports.getTables = function() {
    return {
        'priceTable': priceTable,
        "marketPriceTable": marketPriceTable,
    }
}

module.exports.rawGetCnyPrice = function(name, price, priceSymbol) {
    if (priceSymbol == 'usd' || priceSymbol == 'usdt') {
        return price * priceTable[priceSymbol];
    } else if (priceSymbol == 'btc') {
        return price * priceTable[priceSymbol] * priceTable['usd'];
    } else {
        plog.error(name, "rawGetCnyPrice", price, priceSymbol);
    }
}