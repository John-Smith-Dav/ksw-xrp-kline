module.exports = {
    port: 9003, // k线服务器端口
    mongodb: 'mongodb://ksw:ksw123%24%25%5E@localhost:27017/ksw_kline', // mongodb连接
    //mongodb: 'mongodb://abs:123456@192.168.0.206:27017/abs_kline',
    makeMarketAuth: {	// 创建市场的接口认证
        ksw: {
            secret: 'SToQ9URagWsspe6f',
            encryptSecret: 'n5aRoKpw6ZHmRfcu',
        }
    },
};
