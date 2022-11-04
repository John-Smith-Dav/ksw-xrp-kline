'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    name: String,           // 名字，一般是链的名字
    time: Number,           // 开始时间
    market: String,         // 交易对
    kt: Number,             // k线类型
    o: Number,              // 开盘价
    c: Number,              // 收盘价
    h: Number,              // 最高价
    l: Number,              // 最低价
    v: Number,              // 成交量
});

schema.index({ name: 1 });
schema.index({ time: 1 });
schema.index({ market: 1 });
schema.index({ kt: 1 });
schema.index({ name: 1, time: 1, market: 1, kt: 1 });

class KLineClass {
    constructor() {
    }
}

schema.loadClass(KLineClass);
module.exports = mongoose.model('kline', schema);
