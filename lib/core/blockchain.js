"use strict";
const RippleAPI = require('ksw-lib').RippleAPI;

class BlockChain {
    constructor(url) {
        this.api = null;
        this.url = url;
    }
}

BlockChain.prototype.work = async function () {
    this.api = new RippleAPI({
        server: this.url, // Public rippled server hosted by Ripple, Inc.
        timeout: 5000,
    });
    this.api.on('error', (errorCode, errorMessage) => {
        console.log(errorCode + ': ' + errorMessage);
    });
    this.api.on('connected', () => {
        console.log('connected');
    });
    this.api.on('disconnected', (code) => {
        // code - [close code](https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent) sent by the server
        // will be 1000 if this was normal closure
        console.log('disconnected, code:', code);
    });
    this.keepAlive();
    while (!this.api.isConnected()) {
        await tools.sleep(1000);
    }
    return this.api;
}

BlockChain.prototype.getApi = function () {
    return this.api;
}

BlockChain.prototype.getBalances = async function (address, currency, options = null) {
    let balances = 0;
    try {
        let result = null;
        if (options) {
            result = await this.api.getBalances(address, options);
        } else {
            result = await this.api.getBalances(address);
        }
        for (let index = 0; index < result.length; index++) {
            const element = result[index];
            if (element.currency == currency.toUpperCase()) {
                balances += parseFloat(element.value);
            }
        }
    } catch (error) {
        // plog.info("getBalances", address, currency, error.toString());
    }
    return balances;
}

BlockChain.prototype.waitForLedgerComfirm = async function (txid) {
    let txJson;
    while (true) {
        try {
            txJson = await this.api.getTransaction(txid);
            if (txJson.outcome.result != 'tesSUCCESS') {
                return false;
            }
        } catch (error) {
            await tools.sleep(100);
            continue;            
        }
        break;
    }
    while (true) {
        let ledgerIndex = await this.api.getLedgerVersion();
        if ((ledgerIndex - txJson.outcome.ledgerVersion) >= 1) {
            break
        }
        await tools.sleep(100);
    }
    return true;
}

BlockChain.prototype.checkTxComfirm = async function (txid) {
    let txJson;
    try {
        txJson = await this.api.getTransaction(txid);
    } catch (error) {
        return [false, error];
    }
    let ledgerIndex = await this.api.getLedgerVersion();
    return [((ledgerIndex - txJson.outcome.ledgerVersion) >= 1), txJson.outcome.result];
}

BlockChain.prototype.getAccountInfo = async function (address) {
    let result = await this.api.getAccountInfo(address);
    return result
}

BlockChain.prototype.rawGetApi = async function () {
    return this.api;
}

BlockChain.prototype.keepAlive = async function () {
    while (true) {
        try {
            if (!this.api.isConnected()) {
                await this.api.connect();
            }   
        } catch (error) {
            plog.error('blockchain keepAlive: ' + error.stack);
        } finally {
            await tools.sleep(5*1000);
        }
    }
}

BlockChain.prototype.createAccount = async function () {
    return this.api.generateAddress();
}

BlockChain.prototype.withdraw = async function (to, currency, amount, mones = null) {
    let result = await this.rawWithdraw(this.server_address.total.address, this.server_address.total.secret, to, currency, amount, mones);
    return result;
}

BlockChain.prototype.gatewaySetting = async function(address, key) {
    let settings = {
        defaultRipple: true,
    };
    let txUnsigned = await this.api.prepareSettings(address, settings);
    let txSigned = this.api.sign(txUnsigned.txJSON, key);
    try {
        let result = await this.api.submit(txSigned.signedTransaction);
        if (result.resultCode == "tesSUCCESS") {
            return { tx: txSigned.id };
        } else {
            plog.error("gatewaySetting " + currency + " FAILED, address: " + address + ", amount: " + amount.toString() + ", " + result.resultCode + ", " + result.resultMessage);
        }   
    } catch (error) {
        plog.error(error);
    }
    return null;
}

BlockChain.prototype.makeTrustLine = async function(gateway, address, key, currency, amount) {
    let trustLine = {
        "currency": currency.toUpperCase(),
        "counterparty": gateway,
        "limit": amount.toString(),
    };
    let txUnsigned = await this.api.prepareTrustline(address, trustLine);
    plog.info(JSON.stringify(txUnsigned));
    let txSigned = this.api.sign(txUnsigned.txJSON, key);

    try {
        let result = await this.api.submit(txSigned.signedTransaction);
        if (result.resultCode == "tesSUCCESS") {
            return { tx: txSigned.id };
        } else {
            plog.error("makeTrustLine " + currency + " FAILED, address: " + address + ", amount: " + amount.toString() + ", " + result.resultCode + ", " + result.resultMessage);
        }   
    } catch (error) {
        plog.error(error);
    }
    return null;
}

BlockChain.prototype.checkTrustBtcGateway = async function(address) {
    let result = await this.api.getBalances(address);
    for (let index = 0; index < result.length; index++) {
        const element = result[index];
        if (element.currency == settings.gatewayCurrency.toUpperCase()) {
            return true;
        }
    }
    return false;
}

BlockChain.prototype.gatewayWithdraw = async function (gateway, from, fromPrivateKey, to, currency, amount, memos = null, type = "") {
    let arr = to.split(".");
    let toAddress = arr[0];
    let payTag = arr[1];
    plog.info("gatewayWithdraw " + currency + " to: " + to + ", amount: " + amount + ", tag: " + payTag);

    let payment = {
        source: {
            address: from,
            maxAmount: {
                value: amount.toString(),
                currency: currency.toUpperCase(),
                counterparty: gateway,
            }
        },
        destination: {
            address: toAddress,
            amount: {
                value: amount.toString(),
                currency: currency.toUpperCase(),
                counterparty: gateway,
            }
        }
    };

    if (memos) {
        payment.memos = [memos];
    }

    plog.info("gatewayWithdraw", JSON.stringify(payment));

    if (payTag) {
        payment.destination.tag = parseInt(payTag);
    }

    let txUnsigned = await this.api.preparePayment(from, payment);
    let txSigned = this.api.sign(txUnsigned.txJSON, fromPrivateKey);
    let result = await this.api.submit(txSigned.signedTransaction);
    if (result.resultCode == "tesSUCCESS") {
        let asset = {};
        asset[currency] = parseFloat(amount);
        if (type == "" || !type) {
            type = "transfer_asset";
        }
        muiltiAssetLog(from, to, asset, "transfer_asset", type, txSigned.id);
        return { tx: txSigned.id };
    } else {
        plog.error("gatewayWithdraw " + currency + " FAILED, to: " + to + ", amount: " + amount + ", tag: " + payTag + ", " + result.resultCode + ", " + result.resultMessage);
    }
    return null;
}

BlockChain.prototype.rawWithdraw = async function (from, fromPrivateKey, to, currency, amount, memos = null, type = "", sequence = 0) {
    let arr = to.split(".");
    let address = arr[0];
    let payTag = arr[1];
    plog.info("rawWithdraw " + currency + " to: " + to + ", amount: " + amount + ", tag: " + payTag);

    // amount = tools.mulDecimals(amount, 6);

    let payment = {
        source: {
            address: from,
            maxAmount: {
                value: amount.toString(),
                currency: currency.toUpperCase(),
            }
        },
        destination: {
            address: address,
            amount: {
                value: amount.toString(),
                currency: currency.toUpperCase(),
            }
        }
    };

    if (memos) {
        payment.memos = [memos];
    }

    plog.info("rawWithdraw", JSON.stringify(payment));

    if (payTag) {
        payment.destination.tag = parseInt(payTag);
    }

    let txUnsigned = await this.api.preparePayment(from, payment);
    let txSigned = this.api.sign(txUnsigned.txJSON, fromPrivateKey);
    let result = await this.api.submit(txSigned.signedTransaction);
    if (result.resultCode == "tesSUCCESS") {
        let asset = {};
        asset[currency] = parseFloat(amount);
        if (type == "" || !type) {
            type = "transfer_asset";
        }
        muiltiAssetLog(from, to, asset, "transfer_asset", type, txSigned.id);
        return { tx: txSigned.id };
    } else {
        plog.error("rawWithdraw " + currency + " FAILED, to: " + to + ", amount: " + amount + ", tag: " + payTag + ", " + result.resultCode + ", " + result.resultMessage);
    }
    return null;
}

module.exports = BlockChain;
