const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

let movieSchema = mongoose.Schema({
  title: { type: String, required: true },
  year: { type: String, required: true },
  description: { type: String, required: true },
  genre: [String],
  director: { name: String, bio: String, birth: String, death: String },
  actors: [String],
  image: String,
  featured: Boolean,
});

let userSchema = mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  birthday: Date,
  favoriteMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],
});

/**
 * Hash user password
 * @param {string} password - User's password
 * @returns {string} - Hashed password
 */
userSchema.statics.hashPassword = (password) => {
  return bcrypt.hashSync(password, 10);
};

/**
 * Validate user password
 * @param {string} password - User's password
 * @returns {boolean} - Password validation result
 */
userSchema.methods.validatePassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};

module.exports.Movie = mongoose.model('Movie', movieSchema);
module.exports.User = mongoose.model('User', userSchema);
