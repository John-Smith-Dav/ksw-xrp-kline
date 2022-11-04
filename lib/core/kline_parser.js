"use strict";
const RippleAPI = require('ksw-lib').RippleAPI;
const util = require('util'), path = require('path'), fs = require('fs');
const KLineModel = require(ROOT + '/lib/core/models/kline.js');
const KLineSettingModel = require(ROOT + '/lib/core/models/kline_setting.js');
const BlockNumberModel = require(ROOT + '/lib/core/models/blocknumber.js');
const Price = require(ROOT + '/lib/core/price.js');

let kline_types = [
    1,
    5,
    15,
    60,     // 1小时线
    240,    // 4小时线
    720,    // 12小时线
    1440,   // 日线
    10080,  // 周线
];
let quoteKLineType = 1440;

/**
 * 初始化 klineTable 根据数据库的配置加载成以下样式的数据
 * {
  "xrp_btc": {
    "1": [],
    "5": [],
    "15": [],
    "60": [],
    "240": [],
    "720": [],
    "1440": [],
    "10080": []
  },
  "xrp_ust": {
    "1": [],
    "5": [],
    "15": [],
    "60": [],
    "240": [],
    "720": [],
    "1440": [],
    "10080": []
  }
}
 */
class KLineParser {
    constructor(klineSetting) {
        this.klineSetting = klineSetting;
        this.klineTable = {};
        // 此处处理每个币种的分钟k线
        for (const key in this.klineSetting.markets) {
            this.klineTable[key] = {};  // xrp_btc
            for (let index = 0; index < kline_types.length; index++) {
                const klineType = kline_types[index];
                this.klineTable[key][klineType] = []; // {xrp_btc {1,5,15,60....}}
            }
        }
    }
}

// klineTable:
// {
//     xrp_btc: {
//         '1': [],
//             '5': [],
//             '15': [],
//             '60': [],
//             '240': [],
//             '720': [],
//             '1440': [],
//             '10080': []
//     },
//     xrp_ust: {
//         '1': [],
//             '5': [],
//             '15': [],
//             '60': [],
//             '240': [],
//             '720': [],
//             '1440': [],
//             '10080': []
//     },
//     xrp_eth: {
//         '1': [],
//             '5': [],
//             '15': [],
//             '60': [],
//             '240': [],
//             '720': [],
//             '1440': [],
//             '10080': []
//     }
// }


/**
 * plates
 * {
  "main": {
    "xrp": [
      {
        "left": {
          "currency": "XRP"
        },
        "right": {
          "currency": "UST",
          "counterparty": "rsw4Gn9y6ebGj4tbkTeVyasuzmNUgM856P"
        },
        "price": "0",
        "ttm": "0.0",
        "h": "0",
        "l": "0",
        "v": "0",
        "cny_price": "0"
      },
      {
        "left": {
          "currency": "XRP"
        },
        "right": {
          "currency": "BTC",
          "counterparty": "rau8ivoeYXA9CJKqM8nyAiBKAxMi7t933U"
        },
        "price": "0",
        "ttm": "0.0",
        "h": "0",
        "l": "0",
        "v": "0",
        "cny_price": "0"
      }
    ]
  },
  "gem": {},
  "pink": {}
}
 * @returns {Promise<void>}
 */
KLineParser.prototype.makePlates = async function() {
    this.plates = {};
    for (let index = 0; index < this.klineSetting.plates.length; index++) {
        const element = this.klineSetting.plates[index];
        //element={
        //   "name": "main",
        //   "markets": [
        //     "xrp_ust",
        //     "xrp_btc",
        //     "xrp_eth"
        //   ]
        // }
        this.plates[element.name] = {};

        for (let i = 0; i < element.markets.length; i++) {
            let market = element.markets[i];
            //分割xrp_ust
            let marketSplit = market.split("_");
            if (marketSplit.length != 2) {
                plog.error("split marketcode error " + market);
                continue;
            }
            //异常处理，不是xrp的，plates[name]=[]
            if (!this.plates[element.name][marketSplit[0]]) {
                this.plates[element.name][marketSplit[0]] = [];
            }
            //分割后左边的币种
            let info = {};
            info.left = {currency: marketSplit[0].toUpperCase()};
            //查看klineSetting.markets中是否配置了gateways，如果配置了，取出来，放进info.left.counterparty
            if (this.klineSetting.markets[market]
                && this.klineSetting.markets[market].gateways
                && this.klineSetting.markets[market].gateways[marketSplit[0]]) {
                info.left.counterparty = this.klineSetting.markets[market].gateways[marketSplit[0]];
            }
            //分割后右边的币种
            info.right = {currency: marketSplit[1].toUpperCase()};
            //查看klineSetting.markets中是否配置了gateways，如果配置了，取出来，放进info.left.counterparty
            if (this.klineSetting.markets[market]
                && this.klineSetting.markets[market].gateways
                && this.klineSetting.markets[market].gateways[marketSplit[1]]) {
                info.right.counterparty = this.klineSetting.markets[market].gateways[marketSplit[1]];
            }
            //取出数据库中币种xrp_ust，类型为1440秒，quoteKLineType的k线
            let kline = this.klineTable[market][quoteKLineType].length > 0 ? this.klineTable[market][quoteKLineType][this.klineTable[market][quoteKLineType].length-1] : null;
            if (kline) {
                info.price = tools.toFixed(kline.c, 8).toString();
                info.h = tools.toFixed(kline.h, 8).toString();
                info.l = tools.toFixed(kline.l, 8).toString();
                info.v = tools.toFixed(kline.v, 8).toString();
                Price.recodePrice(this.klineSetting.name, marketSplit[0], marketSplit[1], info.price);
                info.cny_price = tools.toFixed(Price.getCnyPrice(this.klineSetting.name, info.price, marketSplit[1]), 6).toString();
                info.ttm = '0.00';
                if (kline.o > 0) {
                    info.ttm = tools.toFixed((kline.c - kline.o) / kline.o * 100, 2).toString();
                }
            } else {
                info.price = '0';
                info.ttm = '0.00';
                info.h = '0';
                info.l = '0';
                info.v = '0';
                Price.recodePrice(this.klineSetting.name, marketSplit[0], marketSplit[1], info.price);
                info.cny_price = tools.toFixed(Price.getCnyPrice(this.klineSetting.name, info.price, marketSplit[1]), 6).toString();
            }
            /*
            1、this.plates:{main: { xrp: [ [UST], [ETH], [BTC] ] }}
            2、分别将klineSetting.markets下面配置在this.plates中
             */
            this.plates[element.name][marketSplit[0]].push(info);

        }
    }
    //this.plates: {
    //     main: { xrp: [ [UST], [ETH], [BTC] ] },
    //     gem: { xrp: [ [Object], [Object], [Object] ] },
    //     pink: { xrp: [ [Object], [Object], [Object] ] }
    // }
    console.log(this.plates);
}

KLineParser.prototype.updatePlate = function(market1, market2) {
    let market = market1 + '_' + market2;
    let kline = this.klineTable[market][quoteKLineType].length > 0 ? this.klineTable[market][quoteKLineType][this.klineTable[market][quoteKLineType].length-1] : null;
    if (!kline) {
        return;
    }
    //1、this.plates:{main: { xrp: [ [UST], [ETH], [BTC] ] }}
    for (const key in this.plates) {
        let element = this.plates[key];
        if (!element[market1]) {
            continue;
        }
        for (let index = 0; index < element[market1].length; index++) {
            //element[market1] == [ [UST], [ETH], [BTC] ]
            let info = element[market1][index];
            //"xrp": [
            //     {
            //         "left": {
            //             "currency": "XRP"
            //         },
            //         "right": {
            //             "currency": "UST",
            //             "counterparty": "rsw4Gn9y6ebGj4tbkTeVyasuzmNUgM856P"
            //         },
            //         "price": "0",
            //         "ttm": "0.0",
            //         "h": "0",
            //         "l": "0",
            //         "v": "0",
            //         "cny_price": "0"
            //     },
            //     {
            //         "left": {
            //             "currency": "XRP"
            //         },
            //         "right": {
            //             "currency": "BTC",
            //             "counterparty": "rau8ivoeYXA9CJKqM8nyAiBKAxMi7t933U"
            //         },
            //         "price": "0",
            //         "ttm": "0.0",
            //         "h": "0",
            //         "l": "0",
            //         "v": "0",
            //         "cny_price": "0"
            //     }
            // ]
            if (info.left.currency == market1.toUpperCase() && info.right.currency == market2.toUpperCase()) {
                info.price = tools.toFixed(kline.c, 8).toString();
                info.h = tools.toFixed(kline.h, 8).toString();
                info.l = tools.toFixed(kline.l, 8).toString();
                info.v = tools.toFixed(kline.v, 8).toString();
                info.ttm = '0.00';
                //{
                //     'ald': {
                //         'xrp': {
                //             "btc": 123
                //             "usd": 123
                //         },
                //         'bab': {
                //             'xrp': 123
                //         }
                //     },
                //     'adr': {
                //         'xrp': {
                //             'usd': 123
                //         }
                //     }
                // }
                // */
                Price.recodePrice(this.klineSetting.name, market1, market2, info.price);
                info.cny_price = tools.toFixed(Price.getCnyPrice(this.klineSetting.name, info.price, market2), 6).toString();
                if (kline.o > 0) {
                    info.ttm = tools.toFixed((kline.c - kline.o) / kline.o * 100, 2).toString();
                }
            }
        }
    }
}

KLineParser.prototype.test = function() {
    for (let index = 0; index < kline_types.length; index++) {
        const element = kline_types[index];
        let tms = this.rawTimeToKLineTime(Date.now(), element);
        console.log(__filename, 'test', element, new Date(tms).toLocaleString());
    }
}

KLineParser.prototype.init = async function() {
    await this.loadKLineTable();//形成各个币种，各个分钟下的k线数据，放置klineTable中
    await this.makePlates();//配置板块 分为哪几个板块
    //更新数据库kline_setting配置
    await KLineSettingModel.updateOne({name: this.klineSetting.name}, {'$set': {markets: this.klineSetting.markets, plates: this.klineSetting.plates}});
}

KLineParser.prototype.loadKLineTable = async function () {
    plog.info(this.klineSetting.name);//ksw
    for (const key in this.klineSetting.markets) {
        for (let index = 0; index < kline_types.length; index++) {
            //取出分钟k线值
            const klineType = kline_types[index];
            //数据库中找出name:ksw  market:xrp_btc kt:3分钟 的k线
            let klines = await KLineModel.find({
                name: this.klineSetting.name,
                market: key,
                kt: klineType
            }).sort({time: -1}).limit(settings.kline_count);
            // klines--:
            // [
            //     {
            //         _id: 60487c863cd76ca85c22e34e,
            //         kt: 240,
            //         market: 'xrp_ust',
            //         name: 'ksw',
            //         time: 1615363200000,
            //         __v: 0,
            //         c: 0.018867,
            //         h: 1,
            //         l: 0.01,
            //         o: 0.01282,
            //         v: 15342
            //     },
            //      ]
            for (let i = klines.length - 1; i >= 0; i--) {
                const element = klines[i];
                //key：xrp_btc klineType：3分钟
                this.klineTable[key][klineType].push(this.mongoKLineTockl(element));    
            }
        }
    }
    console.log(this.klineTable);
}

/*
    "xrp_ads" : {
        "gateways" : {
            "ads" : "rUv87XRK3nnpfHizwC9eRD1b7xHydXGPkU"
        },
        "plate" : "main",
        "start_block" : 55680
    }
*/
KLineParser.prototype.makeMarket = async function (marketCode, marketData) {
    marketCode = marketCode.toLowerCase();
    plog.info(this.klineSetting.name, 'makeMarket', marketCode, marketData);
    if (this.klineSetting.markets[marketCode]) {
        return;
    }
 
    this.klineSetting.markets[marketCode] = marketData;

    let klineTable = {};
    for (let index = 0; index < kline_types.length; index++) {
        const klineType = kline_types[index];
        if (!klineTable[klineType]) {
            klineTable[klineType] = [];
        }
    }
    this.klineTable[marketCode] = klineTable;

    for (let index = 0; index < this.klineSetting.plates.length; index++) {
        const element = this.klineSetting.plates[index];
        if (element.name == marketData.plate) {
            let found = false;
            for (let i = 0; i < element.markets.length; i++) {
                const code = element.markets[i];
                if (code == marketCode) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                this.klineSetting.plates[index].markets.push(marketCode);
            }
            break;
        }
    }

    await this.makePlates();
    await KLineSettingModel.updateOne({name: this.klineSetting.name}, {'$set': {markets: this.klineSetting.markets, plates: this.klineSetting.plates}});
}

KLineParser.prototype.mongoKLineTockl = function(mongoKLine) {
    let ckl = {
        t: mongoKLine.time,
        o: mongoKLine.o,              // 开盘价
        c: mongoKLine.c,              // 收盘价
        h: mongoKLine.h,              // 最高价
        l: mongoKLine.l,              // 最低价
        v: mongoKLine.v,              // 成交量
    };
    return ckl;
}

KLineParser.prototype.rectifyKLineLength = function(market, klineType) {
    if (this.klineTable[market][klineType].length > settings.kline_count) {
        let newKLines = [];
        let excess = this.klineTable[market][klineType].length - settings.kline_count;
        for (let index = excess; index < this.klineTable[market][klineType].length; index++) {
            const element = this.klineTable[market][klineType][index];
            newKLines.push(element);
        }
        this.klineTable[market][klineType] = newKLines;
    }
}

KLineParser.prototype.makeKLine = async function (market, tms, price, vol) {
    for (let index = 0; index < kline_types.length; index++) {
        let klineType = kline_types[index];
        let klineTime = this.rawTimeToKLineTime(tms, klineType);
        let kline = await KLineModel.findOne({name: this.klineSetting.name, time: klineTime, market: market, kt: klineType});
        if (kline) {
            if (price > kline.h) {
                kline.h = price;
            }
            if (price < kline.l) {
                kline.l = price;
            }
            kline.c = price;
            kline.v += vol;
            await KLineModel.updateOne(
                {name: this.klineSetting.name, time: klineTime, market: market, kt: klineType},
                {'$set': {h: kline.h, l: kline.l, c: kline.c}, '$inc': {v: vol}}
            );
            for (let i = this.klineTable[market][klineType].length - 1; i >= 0; i--) {
                const element = this.klineTable[market][klineType][i];
                if (element.t == klineTime) {
                    this.klineTable[market][klineType][i].h = kline.h;
                    this.klineTable[market][klineType][i].l = kline.l;
                    this.klineTable[market][klineType][i].c = kline.c;
                    this.klineTable[market][klineType][i].v = kline.v;
                    break;
                }
            }
        } else {
            kline = new KLineModel({
                name: this.klineSetting.name,   // 名字，一般是链的名字
                time: klineTime,   // 开始时间
                kt: klineType,     // k线类型
                market: market,    // 市场代号
                o: price,      // 开盘价
                c: price,      // 收盘价
                h: price,      // 最高价
                l: price,      // 最低价
                v: vol,      // 成交量
            });
            await KLineModel.findOneAndUpdate(
                {name: this.klineSetting.name, time: klineTime, market: market, kt: klineType},
                {'$setOnInsert': kline},
                {'upsert': true}
            );
            this.klineTable[market][klineType].push(this.mongoKLineTockl(kline));
            this.rectifyKLineLength(market, klineType);
        }
    }
}

KLineParser.prototype.rawTimeToKLineTime = function (tms, klineType) {
    let time = new Date(tms);
    time.setSeconds(0);
    time.setMilliseconds(0);
    if (klineType == 1 || klineType == 5 || klineType == 15) {
        let minute = time.getMinutes();
        minute -= minute % klineType;
        time.setMinutes(minute);
    } else if (60 <= klineType && klineType <= 720) {
        time.setMinutes(0);
        let hour = time.getHours();
        hour -= hour % (klineType / 60);
        time.setHours(hour);
    } else if (klineType == 1440) {
        time.setHours(0);
        time.setMinutes(0);
    } else if (klineType == 10080) {
        let day = time.getDay();
        time = new Date(time.valueOf() - day*24*3600*1000);
        time.setHours(0);
        time.setMinutes(0);
    }
    return time.valueOf();
}

KLineParser.prototype.work = async function (xrpApi) {
    //以下操作是为了取出kline_setting数据库中，markets中每个对象中的start_block值
    let marketCodes = Object.keys(this.klineSetting.markets);
    let blockTable = {};
    for (let index = 0; index < marketCodes.length; index++) {
        const marketCode = marketCodes[index];
        const market = this.klineSetting.markets[marketCode];

        let block = market.start_block;
        //如果BlockNumber数据中的值小，就用block就用market.start_block，否则使用数据库中的blockNumber值
        let bn = await BlockNumberModel.findOne({name: this.klineSetting.name, market_code: marketCode});
        if (bn) {
            block = bn.blockNumber;
        }
        if (block < market.start_block) {
            block = market.start_block;
        }
        blockTable[marketCode] = block;
    }
    // blockTable:{ xrp_btc: 374695, xrp_ust: 374695, xrp_eth: 374695 }

    let sleepTime = 1000;
    let ledgerIndex = 0;
    
    while (true) {


        /*await tools.sleep(500);
        let d = new Date();
        let countMoney = Math.random()*5;
        let testData = {
            "type": "order",
            "address": "r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59",
            "sequence": 4,
            "id": "F4AB442A6D4CBB935D66E1DA7309A5FC71C7143ED4049053EC14E3875B0CF9BF",
            "specification": {
                "source": {
                    "address": "r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59",
                    "maxAmount": {
                        "currency": "KSW",
                        "value": "1.112209"
                    }
                },
                "destination": {
                    "address": "rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM"
                },
                "paths": "[[{\"currency\":\"USD\",\"issuer\":\"rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo\",\"type\":48,\"type_hex\":\"0000000000000030\"},{\"account\":\"rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo\",\"currency\":\"USD\",\"issuer\":\"rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo\",\"type\":49,\"type_hex\":\"0000000000000031\"}]]"
            },
            "outcome": {
                "result": "tesSUCCESS",
                "timestamp": d.toUTCString(),
                "fee": "0.00001",
                "deliveredAmount": {
                    "currency": "BTC",
                    "value": "0.001",
                    "counterparty": "rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM"
                },
                "orderbookChanges": {
                    "r9tGqzZgKxVFvzKFdUqXAqTzazWBUia8Qr": [
                        {
                            "direction": "buy",
                            "quantity": {
                                "currency": "KSW",
                                "value": "10000"
                            },
                            "totalPrice": {
                                "currency": "BTC",
                                "counterparty": "r9qYD8yLGpPB4eyG1qSxNzkiySiWF8B12R",
                                "value": countMoney
                            },
                            "makerExchangeRate": 10/countMoney,
                            "sequence": 58,
                            "status": "partially-filled"
                        }
                    ]
                },
                "ledgerVersion": 348860,
                "indexInLedger": 0
            }
        }
        this.onTx(testData, "ksw_btc");*/

        try {
            let api = xrpApi.getApi();
            ledgerIndex = await api.getLedgerVersion();
            let marketCodes = Object.keys(this.klineSetting.markets);
            for (let index = 0; index < marketCodes.length; index++) {
                const marketCode = marketCodes[index];
                const market = this.klineSetting.markets[marketCode];
                if (!blockTable[marketCode]) {
                    blockTable[marketCode] = market.start_block;
                }

                let block = blockTable[marketCode];
                if (block >= ledgerIndex - 1) {
                    continue;
                }

                plog.info(this.klineSetting.name + " " + marketCode + " Block: " + block);
                let options = {
                    includeTransactions: true,
                    ledgerVersion: block
                };
                try {
                    let ledger = await api.getLedger(options);
                    if (ledger && ledger.transactionHashes) {
                        for (let index = 0; index < ledger.transactionHashes.length; index++) {
                            const txid = ledger.transactionHashes[index];
                            const tx = await api.getTransaction(txid);
                            if (tx.type != "order") {
                                continue;
                            }
                            //取出交易详细信息
                            this.onTx(tx, marketCode);
                        }
                    }
                    await this.setBlockNumber(this.klineSetting.name, marketCode, block);
                    blockTable[marketCode] = block + 1;
                } catch (e) {
                    if (e.stack.match('ledgerNotFound')) {
                        blockTable[marketCode] = block + 1;
                    } else {
                        plog.error("tx_monitor " + this.klineSetting.name + " " + marketCode + " WORKING ERR : " + e.stack);
                    }
                }
            }
        } catch (e) {
            plog.error("tx_monitor " + this.klineSetting.name + " WORKING ERR : " + e.stack);
        } finally {
            let newestLegder = true;
            let marketCodes = Object.keys(this.klineSetting.markets);
            for (let index = 0; index < marketCodes.length; index++) {
                const marketCode = marketCodes[index];
                const market = this.klineSetting.markets[marketCode];
                if (!blockTable[marketCode]) {
                    blockTable[marketCode] = market.start_block;
                }
                if (blockTable[marketCode] < ledgerIndex - 1) {
                    newestLegder = false;
                    break;
                }
            }
            if (!newestLegder) {
                sleepTime = 1;
            } else {
                sleepTime = 4000;
            }
            await tools.sleep(sleepTime);
        }
    }
}

KLineParser.prototype.onTx = async function (tx, listenMarketCode) {
    if (tx.type != "order") {
        return false;
    }
    if (!tx.outcome || !tx.outcome.orderbookChanges) {
        return false
    }

    let txTime = new Date(tx.outcome.timestamp);
    for (const key in tx.outcome.orderbookChanges) {
        if (key == tx.address) {
            continue;
        }
        const book = tx.outcome.orderbookChanges[key];
        for (let index = 0; index < book.length; index++) {
            const element = book[index];
            if (element.status != 'filled' && element.status != 'partially-filled') {
                continue;
            }
            let market1 = element.quantity.currency.toLowerCase();
            let market2 = element.totalPrice.currency.toLowerCase();
            let marketCode = market1 + '_' + market2;
            if (marketCode != listenMarketCode) {
                continue;
            }
            let marketSetting = this.klineSetting.markets[marketCode];
            if (!marketSetting) {
                continue;
            }
            if (element.quantity.counterparty
                && marketSetting.gateways[market1]
                && marketSetting.gateways[market1] != element.quantity.counterparty) {
                continue;
            }
            if (element.totalPrice.counterparty
                && marketSetting.gateways[market2]
                && marketSetting.gateways[market2] != element.totalPrice.counterparty) {
                continue;
            }
            let price = 0;
            let decimal = 6;
            /*处理价格
             specification.direction是客户交易的买卖
             outcome.order中的direction是系统交易的买卖
             而这是相对的，系统成交的'买'相当于客户成交'卖'操作
             */

            if (tx.specification.direction == 'buy') {
                if (marketCode == "ksw_btc" || marketCode == "ksw_eth" || marketCode == "ksw_usdt") {
                    decimal = 8;
                }
                price = tools.toFixed(element.makerExchangeRate, decimal);
            } else {
                if (marketCode == "ksw_btc" || marketCode == "ksw_eth" || marketCode == "ksw_usdt") {
                    decimal = 8;
                }
                price = tools.toFixed(1 / element.makerExchangeRate, decimal);
            }
            let vol = parseFloat(element.quantity.value);
            //makeKLine,更新k线数据，也就是更新this.klineTable
            await this.makeKLine(marketCode, txTime.valueOf(), price, vol);
            //更新行情，也就是plates
            this.updatePlate(market1, market2);
            plog.info('onTx', this.klineSetting.name, 'found', tx.outcome.ledgerVersion, market1, market2, price, vol);
        }
    }
    return true;
}

KLineParser.prototype.setBlockNumber = async function(skey, marketCode, svalue) {
    await BlockNumberModel.updateOne({name: skey, market_code: marketCode}, {$set: {name: skey, market_code: marketCode, blockNumber: svalue}}, {'upsert': true});
}

module.exports = KLineParser;

/*
db.kline_settings.insert({ "_id" : ObjectId("5e1dc4c123f3f13e0b13b5ab"), "name" : "adr", "markets" : { "xrp_ads" : { "gateways" : { "ads" : "rUv87XRK3nnpfHizwC9eRD1b7xHydXGPkU" }, "plate" : "main", "start_block" : 55680 } }, "plates" : [ { "name" : "main", "markets" : [ "xrp_ads" ] }, { "name" : "gem", "markets" : [ ] }, { "name" : "pink", "markets" : [ ] } ], "blockchain_url" : "ws://172.31.54.236:6060" })
db.kline_settings.insert({ "_id" : ObjectId("5e1dc53923f3f13e0b13b5ac"), "name" : "ald", "markets" : {  }, "plates" : [ { "name" : "main", "markets" : [ ] }, { "name" : "gem", "markets" : [ ] }, { "name" : "pink", "markets" : [ ] } ], "blockchain_url" : "ws://172.31.54.223:7070" })
db.kline_settings.update({"name" : "ald"}, {$set:{"markets" : {}, "plates.0" : { "name" : "main", "markets" : [ "xrp_btc", "xrp_ust", "vbc_xrp" ] }}})
db.kline_settings.update({ "_id" : ObjectId("5e1dc53923f3f13e0b13b5ac")}, {$set:{"name" : "ald", "markets" : { "xrp_btc" : { "gateways" : { "btc" : "r9hKPKD9XVtjz8Tw55ixx8ibvbqz5uL7Mo" }, "plate" : "main", "start_block" : 836314 }, "xrp_ust" : { "gateways" : { "ust" : "rfa2r2N1wuEpXJyRAmJt86TU9sUuFWTno9" }, "plate" : "main", "start_block" : 859503 }, "vbc_xrp" : { "gateways" : { "vbc" : "rMgJ9UcddYLd5LVkvppd2odX5S7hsBoms2" }, "plate" : "main", "start_block" : 836314} }, "plates" : [ { "name" : "main", "markets" : [ "xrp_btc", "xrp_ust", "vbc_xrp" ] }, { "name" : "gem", "markets" : [ ] }, { "name" : "pink", "markets" : [ ] } ], "blockchain_url" : "ws://172.31.54.223:7070" }})
*/