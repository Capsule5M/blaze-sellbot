const {model, Schema} = require('mongoose');

const sticky = new Schema({
    Message: {type: String},
    ChannelID: {type: String},
    LastMessage: {type: String},
    LastMessageID: {type: String},
    MaxCount: {type: Number, default : 6},
    CurrentCount: {type: Number, default : 0}
});

module.exports = model('sticky', sticky);