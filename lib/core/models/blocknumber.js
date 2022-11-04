'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    name: String,
    market_code: String,
    blockNumber: Number,
});

schema.index({ name: 1 });
schema.index({ market_code: 1 });
schema.index({ name: 1, market_code: 1 });

class BlockNumberClass {
    constructor() {
    }
}

schema.loadClass(BlockNumberClass);
module.exports = mongoose.model('blocknumber', schema);
