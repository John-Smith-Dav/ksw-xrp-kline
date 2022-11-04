"use strict";

//common
module.exports.E_NO_ERROR = 0;
module.exports.E_ERROR = 10000;
module.exports.E_SERVER_EXCEPTION = 10001;
module.exports.E_ARGUMENTS_ERROR = 10002;
module.exports.E_SECURE_ERROR = 10003;
module.exports.E_PLEASE_RETRY = 10004;//服务器忙
module.exports.E_SIGN_ERROR = 10005;

//database
module.exports.E_DATABASE_QUERY = 11000;

//passport
module.exports.E_AUTH = 12000;
module.exports.E_PHONE_LOGIN_NOT_EXISTS = 12001;
module.exports.E_VERIFY_CODE_NOT_MATCH = 12002;


//segment
module.exports.E_SEGMENT_NOT_EXISTS = 13000;
module.exports.E_VIDEO_NOT_EXISTS = 13001;
module.exports.E_NOT_ENOUGH_MONEY = 13002;
module.exports.E_FILE_304 = 13003;

//Pay
module.exports.E_BAD_RECEIPT = 14000;
module.exports.E_BAD_ALREADY_PAID = 14001;

//freeze
module.exports.E_USER_NOT_EXISTS = 16000;

module.exports.makeErrCode = function (code, msg) {
    return {
        errorCode: code,
        errorMsg: msg
    };
}