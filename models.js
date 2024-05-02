const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

let movieSchema = mongoose.Schema({
	title: { type: String, required: true },
	year: { type: String, required: true },
	genre: { name: String, description: String },
	director: { name: String, bio: String, birth: String, death: String },
	actors: [String],
	image: String,
	featured: Boolean,
})

let userSchema = mongoose.Schema({
	username: { type: String, required: true },
	password: { type: String, required: true },
	email: { type: String, required: true },
	birthday: Date,
	favoriteMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],
})

userSchema.statics.hashPassword = (password) => {
	return bcrypt.hashSync(password, 10)
}

userSchema.methods.validatePassword = function (password) {
	return bcrypt.compareSync(password, this.Password)
}

module.exports.Movie = mongoose.model('Movie', movieSchema)
module.exports.User = mongoose.model('User', userSchema)
