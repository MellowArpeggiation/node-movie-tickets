var mongoose = require('mongoose');

module.exports = mongoose.model('movie', {
    text: {
        type: String,
        default: ''
    }
});