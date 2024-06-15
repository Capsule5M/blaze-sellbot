const {model, Schema} = require('mongoose');

let pnlSchema = new Schema({
    guild: String,
    total: Number,
    pnl: Number,

});

module.exports = model("pnlSchema", pnlSchema);