var mongoose = require('mongoose');

module.exports = mongoose.model('movie', {
    Title: {
        type: String,
        default: ''
    },
	
	Year: {
		type: String,
		default: ''
	},
	
	ID: {
		type: String,
		default: ''
	},
	
	Type: {
		type: String,
		default: ''
	},
	
	Poster: {
		type: String,
		default: ''
	}
});