"use strict";

const winston = require('winston');
const path = require('path');

tools.mkdir(path.join(settings.logger.program.dirname, settings.logger.program.filename));
global.plog = new (winston.Logger)({
    transports: [
        new (winston.transports.File)(settings.logger.program),
        new winston.transports.Console(),
    ]
});
tools.mkdir(path.join(settings.logger.customer.dirname, settings.logger.customer.filename));
global.clog = new (winston.Logger)({
    transports: [
        new (winston.transports.File)(settings.logger.customer)
    ]
});

global.writeLog = function() {
    plog.info([].slice.call(arguments).join(' '));
}
