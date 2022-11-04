"use strict";

const util = require('util');
module.exports = function() {
    return async function(ctx, next) {
        try {
            await next();
        } catch(err) {
            if(util.isNumber(err)) {
                ctx.body = {error_code : err};
            } else {
                ctx.body = {error_code : error_code.E_SERVER_EXCEPTION};

                plog.error(err.toString());
                if (settings.debug) {
                    console.error(err.toString());
                }

                if (ctx.args) {
                    plog.error(JSON.stringify(ctx.args));
                    if (settings.debug) {
                        console.error(JSON.stringify(ctx.args));
                    }
                }

                if(err.stack) {
                    plog.error(err.stack);
                    if (settings.debug) {
                        console.error(err.stack);
                    }
                }

            }
        }
    };
};
