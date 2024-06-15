const {model, Schema} = require('mongoose');

let accounts = new Schema({
    discordID: String,
    coins: Number,
    email: String,
    total: Number,
    creator: String,
    vip: String,
    active: Boolean,
});

module.exports = model("accounts", accounts);