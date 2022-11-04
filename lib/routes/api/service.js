"use strict";

require('date-utils');
const Router = require('koa-better-router');
const rp = require('request-promise');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const ErrCode = require(ROOT + '/lib/core/ErrorCode.js');
const moment = require('moment');
const io = require('@pm2/io');

module.exports = function (app) {
    let routers = new Router();

    /**
     * 获取k线
     * http://localhost:9001/service/kline?name=adr&market=adr_ads&kline=1&count=100&ch=gujinshun
     */
    routers.get("/service/kline", async (ctx, next) => {
        let name = ctx.args.name;//名字
        let market = ctx.args.market;//哪个品种
        let kline = ctx.args.kline;//几分钟的k线
        let count = ctx.args.count;//k线总数
        let ch = ctx.args.ch;//
        let klines = [];//最新k线集合

        console.log("ctx:");
        console.log(ctx);


        //判断链的名字
        if (!global.txMonitors[name]) {
            return ctx.responseError("Could not found name: " + name);
        }
        //判断返回数据是否有各种币种的分钟k线
        if (!global.txMonitors[name].klineParser.klineTable[market]) {
            return ctx.responseError("Could not found " + market);
        }
        //判断返回数据是否有名字对应的k线
        if (!global.txMonitors[name].klineParser.klineTable[market][kline]) {
            return ctx.responseError("Could not found kline " + kline);
        }
        if (count && (count > settings.kline_count || count < 1)) {
            return ctx.responseError("Invalid count " + count);
        }
        let klineArray = global.txMonitors[name].klineParser.klineTable[market][kline];
        if (!count) {
            count = 1;
        }
        let realCount = Math.min(klineArray.length, count);
        for (let index = klineArray.length - realCount; index < klineArray.length; index++) {
            const ckl = klineArray[index];
            klines.push(ckl);
        }
        return ctx.responseData({
            klines: klines,
            kline: kline,
            market: market,
            ch: ch,
        });
    });

    /**
     * 获取行情
     * http://localhost:9001/service/quote?name=adr
     */
    routers.get("/service/quote", async (ctx, next) => {
        let name = ctx.args.name;
        if (!global.txMonitors[name]) {
            return ctx.responseError("Could not found name: " + name);
        }
        return ctx.responseData(global.txMonitors[name].klineParser.plates);
    });

    /**
     * 测试价格
     * http://localhost:9001/service/test_price?name=adr
     */
    routers.get("/service/test_price", async (ctx, next) => {
        let name = ctx.args.name;
        let price = ctx.args.price;
        let market = ctx.args.market;

        const Price = require(ROOT + '/lib/core/price.js');
        let ret = Price.getCnyPrice(name, price, market);

        return ctx.responseData({
            tables: Price.getTables(),
            price: ret,
        });
    });

    /**
     * 获取行情
     * http://localhost:9001/service/make_market?data=fjoiweuriou&secret=1111&name=ald
     * {
            "xrp_ads" : {
                "gateways" : {
                    "ads" : "rUv87XRK3nnpfHizwC9eRD1b7xHydXGPkU"
                },
                "plate" : "main",
                "start_block" : 55680
            }
        }
     * http://localhost:9001/service/make_market?name=ald&market_code=xrp_ads&gateway1=12378641789364&gateway2=jfviophjfiopwhj&plate=gem&start_block=1&secret=1111
     */
    routers.get("/service/make_market", async (ctx, next) => {
        let secret = ctx.args.secret;
        let name = ctx.args.name;
        let data = ctx.args.data;

        if (!settings.makeMarketAuth[name]) {
            return ctx.responseError('i dont know what 7 you say');
        }
        let auth = settings.makeMarketAuth[name];
        if (auth.secret != secret) {
            return ctx.responseError('i dont know what 7 you say');
        }

        let jsonStr = tools.aesDecrypt(data, auth.encryptSecret);
        let marketInfo = JSON.parse(jsonStr);

        if (!global.txMonitors[name]) {
            return ctx.responseError("Could not found name: " + name);
        }
        for (const marketCode in marketInfo) {
            const element = marketInfo[marketCode];
            if (element.hasOwnProperty("plate") && element.hasOwnProperty("start_block") && element.hasOwnProperty("gateways")) {
                await global.txMonitors[name].klineParser.makeMarket(marketCode, element);
            } else {
                return ctx.responseError("error data market: " + marketCode);
            }
        }

        return ctx.responseData("ok");
    });

    routers.post("/service/test_aesEncrypt", async (ctx, next) => {
        let data =  JSON.stringify(ctx.request.body)
        let aaa = tools.aesEncrypt(data, 'n5aRoKpw6ZHmRfcu')

        return ctx.responseData({aaa});
    });

    app.use(routers.middleware());
};
