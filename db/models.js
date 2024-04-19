const mongoose = require('mongoose');

let movieSchema = mongoose.Schema({
	Title: { type: String, required: true },
	Year: { type: String, required: true },
	Genre: { Name: String, Description: String },
	Director: { Name: String, Bio: String, Birth: String, Death: String },
	Actors: [String],
	ImagePath: String,
	Featured: Boolean,
});

let userSchema = mongoose.Schema({
	Username: { type: String, required: true },
	Password: { type: String, required: true },
	Email: { type: String, required: true },
	Birthday: Date,
	FavoriteMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],
});

module.exports.Movie = mongoose.model('Movie', movieSchema);
module.exports.User = mongoose.model('User', userSchema);
