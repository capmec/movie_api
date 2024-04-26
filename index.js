const express = require('express'),
	mongoose = require('mongoose'),
	Models = require('./models.js'),
	{ check, validationResult } = require('express-validator');

const dotenv = require('dotenv');

const app = express(); //use this variable to route HTTP requests and responses
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//connect LOCAL database
//mongoose.connect('mongodb://localhost:27017/myFlixDB', { useNewUrlParser: true, useUnifiedTopology: true });

//connects to MongoDB Atlas database
dotenv.config();
mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const Movies = Models.Movie;
const Users = Models.User;

const cors = require('cors');
app.use(cors());

let auth = require('./auth/auth.js')(app); //(app) ensures Express is available in the .auth.js file
const passport = require('passport');
require('./auth/passport.js');

//Create another GET route located at the endpoint “/” that returns a default textual response of your choosing.
app.get('/', (req, res) => {
	res.send('Welcome to myFlix!');
});

//Use express.static to serve your “documentation.html” file from the public folder (rather than using the http, url, and fs modules).
app.use(express.static('public'));

/******************** USERS CRUD ********************/

// Allow new users to register (CREATE)
app.post(
	'/users',
	[
		//input validation here
		check('Username', 'Username is required').isLength({ min: 5 }),
		check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
		check('Password', 'Password is required').not().isEmpty(),
		check('Email', 'Email does not appear to be valid').isEmail(),
	],
	async (req, res) => {
		//check validation object for errors
		let errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422).json({ errors: errors.array() });
		}

		let hashedPassword = Users.hashPassword(req.body.Password);
		await Users.findOne({ Username: req.body.Username })
			.then((user) => {
				if (user) {
					return res.status(400).send(req.body.Username + ' already exists');
				} else {
					Users.create({
						Username: req.body.Username,
						Password: hashedPassword,
						Email: req.body.Email,
						Birthday: req.body.Birthday,
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

//CREATE a new movie entry
app.post('/movies', passport.authenticate('jwt', { session: false }), async (req, res) => {
	await Movies.findOne({ Title: req.body.Title })
		.then((movie) => {
			if (movie) {
				return res.status(400).send(req.body.Title + ' already exists');
			} else {
				Movies.create({
					Title: req.body.Title,
					Year: req.body.Year,
					Description: req.body.Description,
					Genre: req.body.Genre,
					Director: req.body.Director,
					Actors: req.body.Actors,
					ImagePath: req.body.ImagePath,
					Featured: req.body.Featured,
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

//GET all movies
app.get('/movies', passport.authenticate('jwt', { session: false }), async (req, res) => {
	await Movies.find()
		.then((movies) => {
			res.json(movies);
		})
		.catch((error) => {
			console.error(error);
			res.status(500).send('Error: ' + error);
		});
});

// Return a film from the title (READ)
app.get('/movies/:Title', passport.authenticate('jwt', { session: false }), async (req, res) => {
	await Movies.findOne({ Title: req.params.Title })
		.then((movie) => {
			res.json(movie);
		})
		.catch((error) => {
			console.error(error);
			res.status(500).send('Error: ' + error);
		});
});

// Return a film by the genre (READ)
app.get('/movies/Genre/:Genre', passport.authenticate('jwt', { session: false }), async (req, res) => {
	await Movies.find({ 'Genre.Name': req.params.Genre })
		.then((movies) => {
			res.json(movies);
		})
		.catch((error) => {
			console.error(error);
			res.status(500).send('Error: ' + error);
		});
});

// Return Director data (READ)\
app.get('/movies/Director/:Director', passport.authenticate('jwt', { session: false }), async (req, res) => {
	await Movies.findOne({ 'Director.Name': req.params.Director })
		.then((director) => {
			res.json(director.Director);
		})
		.catch((error) => {
			console.error(error);
			res.status(500).send('Error: ' + error);
		});
});

//Allow users to update their user info (username) (UPDATE)
app.put('/users/:Username', passport.authenticate('jwt', { session: false }), async (req, res) => {
	//CONDITIONAL TO CHECK IF THE USERNAME IS THE SAME AS THE ONE IN THE BODY
	if (req.user.Username !== req.params.Username) {
		return res.status(403).send(req.user.Username + ' does not match ' + req.params.Username);
	}
	await Users.findOneAndUpdate(
		{ Username: req.params.Username },
		{
			$set: {
				Username: req.body.Username,
				Password: req.body.Password,
				Email: req.body.Email,
				Birthday: req.body.Birthday,
				FavoriteMovies: req.body.FavoriteMovies,
			},
		},
		{ new: true }, // This line makes sure that the updated document is returned
	)
		.then((updatedUser) => {
			res.json(updatedUser);
		})
		.catch((error) => {
			console.error(error);
			res.status(500).send('Error: ' + error);
		});
});

//GET all users
app.get('/users', passport.authenticate('jwt', { session: false }), async (req, res) => {
	await Users.find()
		.then((users) => {
			res.json(users);
		})
		.catch((error) => {
			console.error(error);
			res.status(500).send('Error: ' + error);
		});
});

//GET a user by username
app.get('/users/:Username', passport.authenticate('jwt', { session: false }), async (req, res) => {
	await Users.findOne({ Username: req.params.Username })
		.then((user) => {
			res.json(user);
		})
		.catch((error) => {
			console.error(error);
			res.status(500).send('Error: ' + error);
		});
});

// DELETE a user by username
app.delete('/users/:Username', passport.authenticate('jwt', { session: false }), async (req, res) => {
	await Users.findOneAndDelete({ Username: req.params.Username })
		.then((user) => {
			if (!user) {
				res.status(400).send(req.params.Username + ' was not found');
			} else {
				res.status(200).send(req.params.Username + ' was deleted.');
			}
		})
		.catch((error) => {
			console.error(error);
			res.status(500).send('Error: ' + error);
		});
});

//Allow users to add a movie to their list of favorites (UPDATE)
app.post(
	'/users/:Username/FavoriteMovies/:MovieID',
	passport.authenticate('jwt', { session: false }),
	async (req, res) => {
		await Users.findOneAndUpdate(
			{ Username: req.params.Username },
			{
				$push: { FavoriteMovies: req.params.MovieID },
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

//Allow users to remove a movie from their list of favorites (DELETE)
app.delete(
	'/users/:Username/FavoriteMovies/:MovieID',
	passport.authenticate('jwt', { session: false }),
	async (req, res) => {
		await Users.findOneAndUpdate(
			{ Username: req.params.Username },
			{
				$pull: { FavoriteMovies: req.params.MovieID },
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

//Allow existing users to deregister(DELETE)
app.delete('/users/:Username', passport.authenticate('jwt', { session: false }), async (req, res) => {
	await Users.findOneAndRemove({ Username: req.params.Username })
		.then((user) => {
			if (!user) {
				res.status(400).send(req.params.Username + ' was not found');
			} else {
				res.status(200).send(req.params.Username + ' was deleted.');
			}
		})
		.catch((error) => {
			console.error(error);
			res.status(500).send('Error: ' + error);
		});
});

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
	console.log('Listening on Port ' + port);
});
