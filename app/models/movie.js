var mongoose = require('mongoose');

module.exports = mongoose.model('movie', {
    Title: String,
	Year: String,
	ID: String,
	Type: String,
	Poster: String,
	
	DetailCached: {
		type: Boolean,
		default: false
	},
	// All values past this point are fetched using the ID, these may or may not have been cached yet
	
	Rated: String,
	Released: Date,
	Runtime: String,
	Genre: String,
	Director: String,
	Writer: String,
	Actors: String,
	Plot: String,
	Language: String,
	Country: String,
	Metascore: Number,
	Rating: Number,
	Votes: String,
	Price: Number
});