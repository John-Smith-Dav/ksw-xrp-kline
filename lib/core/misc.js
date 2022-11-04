"use strict";

const rp = require('request-promise');
let CoinInfoCache = {};

module.exports.callRbsGate = async function(url, data) {
    tools.signData(url, data);
    let options = {
        uri: settings.wallet_gate + url,
        method: 'GET',
        qs: data,
        json: true,
    };
    
    let response = await rp(options);
    if (response && response.error_code) {
        throw "RBS ERROR " + url + " " + JSON.stringify(response) + " " + JSON.stringify(data);
    }

    return response;
}

module.exports.getCoinInfo = async function(symbol) {
    if (CoinInfoCache[symbol]) {
        return CoinInfoCache[symbol];
    }

    let response = await this.callRbsGate('/explorer/get_coin_info', { currency: symbol });
    if (response.error_code == 0) {
        CoinInfoCache[symbol] = response.data;
    } else {
        plog.error("getCoinInfo Error " + symbol + " " + JSON.stringify(response));
    }

    return CoinInfoCache[symbol];
}
