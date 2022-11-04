"use strict";

require('date-utils');
const crypto = require('crypto');
const Router = require('koa-better-router');

module.exports = function (app) {
    let routers = new Router().loadMethods();
    routers.get("/startup", async (ctx, next) => {
        ctx.body = "OK";
    });

    app.use(routers.middleware());
};
