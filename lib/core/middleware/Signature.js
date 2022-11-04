"use strict";

module.exports = function () {
    return async function (ctx, next) {
        let pos = ctx.originalUrl.indexOf('?');
        let url = ctx.originalUrl;
        if (pos != -1) {
            url = url.substr(0, pos);
        }
        if (settings.signSwitch){
            if (ctx.args.sign && !tools.checkSign(url, ctx.args)) {
                plog.info("SIGNFAIL" + url + ", " + JSON.stringify(ctx.args));
                ctx.body = {error_code : error_code.E_SIGN_ERROR};
                return false;
            }
        }

        await next();
    }
};
