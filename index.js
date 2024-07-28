const express = require('express');
const mongoose = require('mongoose');
const Models = require('./models.js');
const { check, validationResult } = require('express-validator');

const dotenv = require('dotenv');
dotenv.config();
mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true })
//connect LOCAL database
//mongoose.connect('mongodb://localhost:27017/myFlixDB', {useNewUrlParser: true, useUnifiedTopology: true,});

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const Movies = Models.Movie;
const Users = Models.User;

const cors = require('cors');
let allowedOrigins = [
	'http://localhost:8080', 
	'https://bflixb.netlify.app', 
	'http://localhost:1234', 
	'https://movie-api-o5p9.onrender.com',
	'http://localhost:4200'
];
	


app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) { // If a specific origin isn’t found on the list of allowed origins
      let message = 'The CORS policy for this application doesn’t allow access from origin ' + origin;
      return callback(new Error(message), false);
    }
    return callback(null, true);
  }
}));

let auth = require('./auth/auth.js')(app);
const passport = require('passport');
require('./auth/passport.js');

app.get('/', (req, res) => {
	res.send('Welcome to myFlix!');
});

app.use(express.static('public'));

//AUTHENTICATION
app.post(
	'/users',
	[
		check('username', 'Username is required').isLength({ min: 5 }),
		check(
			'username',
			'Username contains non alphanumeric characters - not allowed.',
		).isAlphanumeric(),
		check('password', 'Password is required').not().isEmpty(),
		check('email', 'Email does not appear to be valid').isEmail(),
	],
	async (req, res) => {
		let errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422).json({ errors: errors.array() });
		}

		let hashedPassword = Users.hashPassword(req.body.password);
		await Users.findOne({ username: req.body.username })
			.then((user) => {
				if (user) {
					return res.status(400).send(req.body.username + ' already exists');
				} else {
					Users.create({
						username: req.body.username,
						password: hashedPassword,
						email: req.body.email,
						birthday: req.body.birthday,
					})
						.then((user) => {
							res.status(201).json(user);
						})
						.catch((error) => {
							console.error(error);
							res.status(500).send('Error: ' + error);
						});
				}
			})
			.catch((error) => {
				console.log(error);
				res.status(500).send('Error: ' + error);
			});
	},
);

//GET USER BY ID
app.get(
	'/users/:id',
	passport.authenticate('jwt', { session: false }),
	async (req, res) => {
		await Users.findById(req.params.id)
			.then((user) => {
				res.json(user);
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send('Error: ' + error);
			});
	},
);

//GET USER BY USERNAME
app.get(
	'/users/:username',
	passport.authenticate('jwt', { session: false }),
	async (req, res) => {
		await Users.findOne({ username: req.params.username })
			.then((user) => {
				res.json(user);
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send('Error: ' + error);
			});
	},
);

//UPDATE USER BY ID
app.put(
	'/users/:id',
	passport.authenticate('jwt', { session: false }),
	async (req, res) => {
		try {
			// Verify user authorization
			if (req.user._id.toString() !== req.params.id) {
				return res
					.status(403)
					.send('You are not authorized to update this user profile.');
			}

			// Hash password if provided
			const hashedPassword = req.body.password
				? await Users.hashPassword(req.body.password)
				: undefined;

			// Update user profile
			const updatedUser = await Users.findOneAndUpdate(
				{ _id: req.params.id }, // Filter by user ID
				{
					$set: {
						username: req.body.username,
						password: hashedPassword,
						email: req.body.email,
						birthday: req.body.birthday,
						favoriteMovies: req.body.favoriteMovies,
					},
				},
				{ new: true },
			);

			// Check if user was found and updated
			if (!updatedUser) {
				return res.status(404).send('User not found.');
			}

			// Return updated user profile
			res.json(updatedUser);
		} catch (error) {
			console.error(error);
			res.status(500).send('Error: ' + error.message);
		}
	},
);

//GET USER BY ID AND DELETE
app.delete(
	'/users/:id',
	passport.authenticate('jwt', { session: false }),
	async (req, res) => {
		await Users.findByIdAndDelete(req.params.id)
			.then((user) => {
				if (!user) {
					res.status(400).send(req.params.id + ' was not found');
				} else {
					res.status(200).send(req.params.id + ' was deleted.');
				}
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send('Error: ' + error);
			});
	},
);
// GET USER'S FAVORITE MOVIES BY USER'S ID
app.get(
	'/users/:id/favoriteMovies',
	passport.authenticate('jwt', { session: false }),
	async (req, res) => {
	  try {
		const user = await Users.findById(req.params.id).populate('favoriteMovies');
		if (!user) {
		  return res.status(404).send('User not found');
		}
		res.json(user.favoriteMovies);
	  } catch (error) {
		console.error(error);
		res.status(500).send('Error: ' + error);
	  }
	}
  );


//ADD A MOVIE TO USER'S FAVORITE MOVIES
app.post(
	'/users/:username/movies/:id',
	passport.authenticate('jwt', { session: false }),
	async (req, res) => {
		await Users.findOneAndUpdate(
			{ username: req.params.username },
			{ $push: { favoriteMovies: req.params.id } },
			{ new: true },
		)
			.then((updatedUser) => {
				res.json(updatedUser);
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send('Error: ' + error);
			});
	},
);

//DELETE A MOVIE FROM USER'S FAVORITE MOVIES
app.delete(
	'/users/:username/movies/:id',
	passport.authenticate('jwt', { session: false }),
	async (req, res) => {
		await Users.findOneAndUpdate(
			{ username: req.params.username },
			{
				$pull: { favoriteMovies: req.params.id },
			},
			{ new: true },
		)
			.then((updatedUser) => {
				res.json(updatedUser);
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send('Error: ' + error);
			});
	},
);

//CREATE MOVIE
app.post('/movies', async (req, res) => {
	await Movies.findOne({ title: req.body.title })
		.then((movie) => {
			if (movie) {
				return res.status(400).send(req.body.title + ' already exists');
			} else {
				Movies.create({
					title: req.body.title,
					year: req.body.year,
					description: req.body.description,
					genre: req.body.genre,
					director: req.body.director,
					actors: req.body.actors,
					image: req.body.image,
					featured: req.body.featured,
				})
					.then((movie) => {
						res.status(201).json(movie);
					})
					.catch((error) => {
						console.error(error);
						res.status(500).send('Error: ' + error);
					});
			}
		})
		.catch((error) => {
			console.log(error);
			res.status(500).send('Error: ' + error);
		});
});

//GET ALL MOVIES
app.get(
	'/movies',
	passport.authenticate('jwt', { session: false }),
	async (req, res) => {
		await Movies.find()
			.then((movies) => {
				res.json(movies);
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send('Error: ' + error);
			});
	},
);

//GET MOVIE BY ID
app.get(
	'/movies/:id',
	passport.authenticate('jwt', { session: false }),
	async (req, res) => {
		await Movies.findById(req.params.id)
			.then((movie) => {
				res.json(movie);
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send('Error: ' + error);
			});
	},
);

//GET MOVIE BY TITLE
app.get(
	'/movies/:title',
	passport.authenticate('jwt', { session: false }),
	async (req, res) => {
		await Movies.findOne({ title: req.params.title })
			.then((movie) => {
				res.json(movie);
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send('Error: ' + error);
			});
	},
);

//GET MOVIE BY GENRE
app.get(
	'/movies/genre/:genre',
	passport.authenticate('jwt', { session: false }),
	async (req, res) => {
		await Movies.find({ 'genre.name': req.params.genre })
			.then((movies) => {
				res.json(movies);
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send('Error: ' + error);
			});
	},
);

//GET MOVIE BY DIRECTOR
app.get(
	'/movies/director/:director',
	passport.authenticate('jwt', { session: false }),
	async (req, res) => {
		await Movies.findOne({ 'director.name': req.params.director })
			.then((director) => {
				res.json(director.director);
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send('Error: ' + error);
			});
	},
);

// GET MOVIE BY ACTOR
app.get(
	'/movies/actors/:actors',
	passport.authenticate('jwt', { session: false }),
	async (req, res) => {
		await Movies.findOne({ actors: req.params.actors })
			.then((actor) => {
				res.json(actor.Actors);
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send('Error: ' + error);
			});
	},
);

//UPDATE MOVIE BY ID
app.put(
	'/movies/:id',
	passport.authenticate('jwt', { session: false }),
	async (req, res) => {
		await Movies.findOneAndUpdate(
			{ title: req.params.title },
			{
				$set: {
					title: req.body.title,
					year: req.body.year,
					description: req.body.description,
					genre: req.body.genre,
					director: req.body.director,
					actors: req.body.actors,
					image: req.body.image,
					featured: req.body.featured,
				},
			},
			{ new: true },
		)
			.then((updatedMovie) => {
				res.json(updatedMovie);
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send('Error: ' + error);
			});
	},
);

//DELETE MOVIE BY ID
app.delete(
	'/movies/:id',
	passport.authenticate('jwt', { session: false }),
	async (req, res) => {
		await Movies.findOneAndRemove({ title: req.params.title })
			.then((movie) => {
				if (!movie) {
					res.status(400).send(req.params.title + ' was not found');
				} else {
					res.status(200).send(req.params.title + ' was deleted.');
				}
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send('Error: ' + error);
			});
	},
);

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
	console.log('Listening on Port ' + port);
});

// app.listen(8000, () => {
// 	console.log('Your app is listening on port 8000.')
// })