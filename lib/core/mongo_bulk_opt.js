"use strict";
const mongoose = require('mongoose');

class MongoBulkOpt {
    constructor(modelTable, batchNumber) {
        this.modelTable = modelTable;
        this.bulk = modelTable.collection.initializeOrderedBulkOp();
        this.batchNumber = batchNumber;
    }
}

MongoBulkOpt.prototype.getBulk = function() {
    return this.bulk;
}

MongoBulkOpt.prototype.storeBulk = async function() {
    if (!this.modelTable || !this.bulk || !this.batchNumber) {
        return false;
    }
    if (this.bulk.length >= this.batchNumber) {
        try {
            await this.bulk.execute();
            this.bulk = this.modelTable.collection.initializeOrderedBulkOp();
        } catch (Err) {
            plog.error(Err);
        }
    }
    return true;
}

MongoBulkOpt.prototype.throwBulk = async function(log = false) {
    if (this.bulk && this.bulk.length > 0) {
        try {
            if (log) {
                plog.info("上次还没有保存完整，执行保存");
            }
            await this.bulk.execute();
        } catch (Err) {
            plog.error(Err);
        }
    }
}

module.exports = MongoBulkOpt;