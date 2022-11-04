"use strict";
const TxMonitor = require(ROOT + '/lib/core/tx_monitor.js');
const KLineSettingModel = require(ROOT + '/lib/core/models/kline_setting.js');
const Price = require(ROOT + '/lib/core/price.js');

module.exports.work = async function () {
    //获取每个币种的价格
    // priceTable={ btc: 54791.383, eth: 1813.3932, usdt: 0, usd: 0, eur: 0, rub: 0 }
    await Price.makePrice();
    Price.work();

    let kline_settings = await KLineSettingModel.find();//获取数据库配置kline_settings数据
    global.txMonitors = {};
    for (let index = 0; index < kline_settings.length; index++) {
        const klineSetting = kline_settings[index];
        /*
        1、以下步骤，new TxMonitor中分为两部分{klineSetting;KlineParser}
        2、KlineParser中又分为2个部分{klineSetting;klineTable}
        3、klineTable根据数据库配置klineSetting.markets配置有几个币种
        4、币种分钟k线数据根据KlineParser中的kline_types配置
         */
        global.txMonitors[klineSetting.name] = new TxMonitor(klineSetting);
        console.log("global.txMonitors2:",global.txMonitors);
    }
    // {
    //     ksw: TxMonitor {
    //     klineSetting: {
    //         _id: 6034aca02e84acaa6c0a6cac,
    //             name: 'ksw',
    //             markets: [Object],
    //             plates: [Array],
    //             blockchain_url: 'ws://8.136.116.187:6007'
    //     },
    //     klineParser: KLineParser { klineSetting: [Object], klineTable: [Object] }
    // }
    // }
    console.log("global.txMonitors:",global.txMonitors);
    for (const key in global.txMonitors) {
        /*
         1、monitor取出的结果即为TxMonitor对象，执行init
         2、TxMonitor对象执行init，执行KlineParser对象init
         3、生成klineTable
         4、生成plates
        */
        const monitor = global.txMonitors[key];
        await monitor.init();
    }

    //Monitors中work：发起连接
    for (const key in global.txMonitors) {
        let monitor = global.txMonitors[key];
        monitor.work();
    }
}
