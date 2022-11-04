"use strict";
console.log('Server Starting ... ...');

const render = require('koa-art-template');
const serve = require('koa-static');
const session = require('koa-generic-session');

const fs = require('fs');
const path = require('path');
const Koa = require('koa');
const jsonResponse = require('koa-json');
const bodyParser = require('koa-bodyparser');
const mongoose = require('mongoose');
const convert = require('koa-convert');
const CJSON = require('circular-json');

global.ROOT = process.cwd();
global.settings = require(ROOT + '/settings.js');
global.define = require(ROOT + '/lib/core/define.js');
global.error_code = require(ROOT + '/lib/core/ErrorCode.js');
global.tools = require(ROOT + '/lib/core/tools.js');
global.misc = require(ROOT + '/lib/core/misc.js');
global.CJSON = CJSON;

require(ROOT + '/lib/core/log.js')

let settingsBiz = require(ROOT + '/settings_biz.js');
for (let k in settingsBiz) {
    settings[k] = settingsBiz[k];
    plog.info("Overload setting: " + k);
}

var mongodbOptions = {  
    auto_reconnect: true,
    poolSize: 10,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: true,
};
mongoose.Promise = global.Promise;
mongoose.connect(settings.mongodb, mongodbOptions);

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

const ExceptionHandler = require(ROOT + '/lib/core/middleware/ExceptionHandler.js');
const Arguments = require(ROOT + '/lib/core/middleware/Arguments.js');
const Signature = require(ROOT + '/lib/core/middleware/Signature.js');

let app = new Koa();

app.use(serve(path.join(__dirname, 'statics')));

render(app, {
    root: path.join(__dirname, 'views'),
    extname: '.art',
    debug: settings.debug
});

app.use(async function (ctx, next) {
    let url = ctx.request.url;
    let p = url.indexOf('?');
    if (p != -1)
        url = url.substr(0, p);
    let file = path.join(__dirname, "views", url + ".art");
    if (fs.existsSync(file)) {
        await ctx.render(url.substr(1));
    } else {
        await next();
    }
});

app.on('error', function (error, ctx) {
    //客户端断开连接不需要处理
    if (error.code == "ECONNRESET") {
        return;
    }
    plog.error('server error url = ', ctx.originalUrl);
    if (error.stack) {
        plog.error(error.stack);
    } else {
        plog.error(error.toString());
    }
});

app.use(ExceptionHandler());
app.use(bodyParser());
app.use(jsonResponse());
app.use(convert(session({
    defer: true
})));

app.use(Arguments());
app.use(Signature());

require(ROOT + '/lib/routes/api/startup.js')(app);
require(ROOT + '/lib/routes/api/service.js')(app);

let Backend = require(ROOT + '/lib/core/backend.js');
Backend.work();

try {
    app.listen(settings.port, settings.host);
    plog.info(settings.projectName + ' Server Start! listen' + settings.port + ' ' + settings.host);
} catch (err) {
    if (err.stack) {
        plog.error(err.stack);
        if (settings.debug) {
            console.error(err.stack);
        }
    }

    plog.error(err.toString());
    if (settings.debug) {
        console.error(err.toString());
    }
    process.exit(-1);
}
