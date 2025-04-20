const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    username: String,
    action: { type: String, enum: ['login', 'logout'] },
    time: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LoginLog', logSchema);
