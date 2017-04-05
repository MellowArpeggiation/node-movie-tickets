var mongoose = require('mongoose');

var detail = new mongoose.Schema({
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
	dbName: String,
    title: String,
	year: String,
	id: String,
	type: String,
	poster: String,
	
	detailCached: {
		type: Boolean,
		default: false
	},
	
	movieDetail: detail
});