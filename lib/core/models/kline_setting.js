'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    name: String,           // 名字，一般是链的名字
    markets: {},            // 交易对
    plates: {},             // k线类型
    blockchain_url: String, // 连接地址
});

/*
"markets" : {
    "xrp_ads" : {
        "gateways" : {
            "ads" : "rUv87XRK3nnpfHizwC9eRD1b7xHydXGPkU"
        },
        "plate" : "main",
        "start_block" : 55680
    }
}
"plates" : [
    { "name" : "main", "markets" : [ "xrp_ads" ] },
    { "name" : "gem", "markets" : [ ] },
    { "name" : "pink", "markets" : [ ] }
]
*/

schema.index({ name: 1 });

class KLineSettingClass {
    constructor() {
    }
}

schema.loadClass(KLineSettingClass);
module.exports = mongoose.model('kline_setting', schema);
