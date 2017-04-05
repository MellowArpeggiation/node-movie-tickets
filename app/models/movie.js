var mongoose = require('mongoose');

var detail = new Schema({
	rated: String,
	released: Date,
	runtime: String,
	genre: String,
	director: String,
	writer: String,
	actors: String,
	plot: String,
	language: String,
	country: String,
	metascore: Number,
	rating: Number,
	votes: String,
	price: Number
});

module.exports = mongoose.model('movie', {
    title: String,
	year: String,
	id: String,
	type: String,
	poster: String,
	
	detailCached: {
		type: Boolean,
		default: false
	},
	// All values past this point are fetched using the ID, these may or may not have been cached yet
	
	
});