"use strict";

module.exports = function () {
    return async function (ctx, next) {

        if (ctx.req.method == "POST") {
            if (typeof (ctx.request.body) == "object") {
                ctx.args = ctx.request.body;
                // plog.info("[CTX]:"+JSON.stringify(ctx.args));
            } else {
                try {
                    ctx.args = JSON.parse(ctx.request.body);
                }
                catch (error) {

                }
            }
        }
        else {
            ctx.args = ctx.query;
            ctx.append('Access-Control-Allow-Origin', '*');
        }

        ctx.responseError = (desc, code = error_code.E_ERROR) => {
            ctx.body = { error_code: code, error: desc };
            return false;
        }

        ctx.responseData = (data) => {
            ctx.body = { error_code: error_code.E_NO_ERROR, data: data };
            return true;
        }
        await next();
    }
};
