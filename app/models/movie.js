var mongoose = require('mongoose');

var movieDetail = new mongoose.Schema({
	Rated: String,
	Released: String,
	Runtime: String,
	Genre: String,
	Director: String,
	Writer: String,
	Actors: String,
	Plot: String,
	Language: String,
	Country: String,
	Metascore: String,
	Rating: String,
	Votes: String,
	Price: String
});

module.exports = mongoose.model('movie', {
	dbName: String,
    Title: String,
	Year: String,
	ID: String,
	Type: String,
	Poster: String,
	
	DetailCached: {
		type: Boolean,
		default: false
	},
	
	Detail: movieDetail
});