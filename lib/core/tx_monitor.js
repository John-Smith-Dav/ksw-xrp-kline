"use strict";
const RippleAPI = require('ksw-lib').RippleAPI;
const util = require('util'), path = require('path'), fs = require('fs');
const moment = require('moment');
const io = require('@pm2/io');
const BlockChain = require(ROOT + '/lib/core/blockchain.js');
const KlineParser = require(ROOT + '/lib/core/kline_parser.js');

class TxMonitor {
    constructor(klineSetting) {
        this.klineSetting = klineSetting;
        this.klineParser = new KlineParser(klineSetting);
    }
}

TxMonitor.prototype.init = async function () {
    await this.klineParser.init();
}

TxMonitor.prototype.work = async function () {
    //类似websocket
    this.xrpApi = new BlockChain(this.klineSetting.blockchain_url);
    await this.xrpApi.work();
    //xrpApi连接后，刷新k线数据
    this.klineParser.work(this.xrpApi);
}

module.exports = TxMonitor;

