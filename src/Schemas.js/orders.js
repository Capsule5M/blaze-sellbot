const {model, Schema} = require('mongoose');

let orderSchema = new Schema({
    discordID: String,
    orderID: String,
    sellixID: String,
    amount: String,
    email: String,
    token: String,
    refresh: String,
    paid: Boolean,
});

module.exports = model("orderSchema", orderSchema);