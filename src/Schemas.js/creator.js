const {model, Schema} = require('mongoose');

let creator = new Schema({
    displayId: String,
    sellixId: String,
});

module.exports = model("creator", creator);