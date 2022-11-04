# rcp-wallet

## 要求
1、blocknumber数据库，name:币种名称；blockNumber：用于请求数据
2、kline_settings数据库：
1）markets:{xrp_btc，xrp_ust，xrp_eth},主要配置k线;
     (1)、xrp_btc下面配置gateways：网关url
     (2)、xrp_btc下面配置plate：首页板块名称
     (3)、xrp_btc下面配置start_bloack：用于xrp.api网络请求，与blockNumber比较，哪个大使用哪个
2)、plates:配置首页三个板块，配置行情
     (1)、name：板块名称
     (2)、markets：“xrp_btc”用于配置行情的币种
     (3)、blockchain_url:websocet请求地址，刷新k线行情
3、klines数据库：用于存储k线数据：kt:k线分钟；market:币种；time:k线时间；

注：k线与行情主要类，backed、tx_monitor、kline_parser。
连接rcpapi在类tx_monitor中，执行的是在blockchain类中；
生成k线在kline_parser中，币种分钟k线配置kline_types与kline_settings.markets，方法loadKLineTable;
生成行情在kline_parser中，板块行情配置kline_settings.plates,方法makePlates；
K线数据更新在kline_parser中，方法makeKLine
行情数据更新在kline_parser中，方法updatePlate

*为保持行情与k线数据匹配
kline_settings.markets 中的keys要与kline_settings.plates中的markets配置相同；
kline_settings.markets 中的plate要与kline_settings.plates中的name配置相同；


## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Run your tests
```
npm run test
```

### Lints and fixes files
```
npm run lint
```
