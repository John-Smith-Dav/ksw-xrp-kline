const projectName = "KSWKline";             // 项目名字
const interProjectName = "KSWKline";   // 国际项目名字

module.exports = {
    host: '0.0.0.0', // 服务器监听的IP
    port: 9003, // 服务端口
    wallet_gate: 'http://127.0.0.1:8083', // 连接wallet-manager的地址
    mongodb: 'mongodb://ksw:ksw123%24%25%5E@localhost:27017/ksw_kline', // mongodb连接
    //mongodb: 'mongodb://abs:123456@192.168.0.206:27017/abs_kline',
    projectName: projectName,             // 项目名字
    interProjectName: interProjectName,   // 国际项目名字
    hmacKey: 'ofcourseistillloveyou',
    // gAuthKey: 'tnnyxyyEsMGfGEdVdJNyrbhkVU4rxZKV',
    // sha256Key: 'mytruementormyguidingmoonlight',
    // activateAddr: 'rPU6yJdsFBymLy4Yzb5xT4vRdCAoVHf5pu',
    // activateKey: 'sshQzzosXM1oMCna3deuwuFttDxsP',
    // phoneCodeSecret: 'SHGJ2089pu1s2h23',
    signSwitch: false,
    // usdtUpdateUrl: "http://api.zb.cn/data/v1/ticker?market=usdt_qc",
    withdraw_limit: {},
    wallet_pass: "",
    kline_count: 500,


    // 日志相关的配置，一般不需要做修改，日志放在logs目录
    logger: {
        program: {
            level: 'info',
            maxFiles: 100,
            maxsize: 1000 * 1000 * 100,
            json: false,
            dirname: process.cwd() + '/logs',
            filename: 'program.log',
            timestamp: function () {
                var nowDate = new Date();
                var result = nowDate.toLocaleDateString() + " " + nowDate.toLocaleTimeString();

                return result;
            },
            formatter: function (options) {
                return options.timestamp() + ' [' + options.level.toUpperCase() + ']: ' + options.message;
            }
        },
        customer: {
            datePattern: '.yyyy-MM-dd',
            level: 'silly',
            json: false,
            dirname: process.cwd() + '/logs',
            filename: 'customer.log',
            timestamp: function () {
                var nowDate = new Date();
                var result = nowDate.toLocaleDateString() + " " + nowDate.toLocaleTimeString();

                return result;
            },
            formatter: function (options) {
                return options.timestamp() + ' [' + options.level.toUpperCase() + ']: ' + options.message;
            }
        }
    }
};
