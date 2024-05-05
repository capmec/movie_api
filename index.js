const express = require('express'),
	mongoose = require('mongoose'),
	Models = require('./models.js'),
	{ check, validationResult } = require('express-validator')

const dotenv = require('dotenv')
dotenv.config()
mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true })
//connect LOCAL database
// mongoose.connect('mongodb://localhost:27017/myFlixDB', { useNewUrlParser: true, useUnifiedTopology: true })

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const Movies = Models.Movie
const Users = Models.User

const cors = require('cors')
app.use(cors())

let auth = require('./auth/auth.js')(app)
const passport = require('passport')
require('./auth/passport.js')

app.get('/', (req, res) => {
	res.send('Welcome to myFlix!')
})

app.use(express.static('public'))

app.post(
	'/users',
	[
		check('username', 'Username is required').isLength({ min: 5 }),
		check('username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
		check('password', 'Password is required').not().isEmpty(),
		check('email', 'Email does not appear to be valid').isEmail(),
	],
	async (req, res) => {
		let errors = validationResult(req)
		if (!errors.isEmpty()) {
			return res.status(422).json({ errors: errors.array() })
		}

		let hashedPassword = Users.hashPassword(req.body.password)
		await Users.findOne({ username: req.body.username })
			.then((user) => {
				if (user) {
					return res.status(400).send(req.body.username + ' already exists')
				} else {
					Users.create({
						username: req.body.username,
						password: hashedPassword,
						email: req.body.email,
						birthday: req.body.birthday,
					})
						.then((user) => {
							res.status(201).json(user)
						})
						.catch((error) => {
							console.error(error)
							res.status(500).send('Error: ' + error)
						})
				}
			})
			.catch((error) => {
				console.log(error)
				res.status(500).send('Error: ' + error)
			})
	},
)

app.post('/movies', passport.authenticate('jwt', { session: false }), async (req, res) => {
	await Movies.findOne({ title: req.body.title })
		.then((movie) => {
			if (movie) {
				return res.status(400).send(req.body.title + ' already exists')
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
						res.status(201).json(movie)
					})
					.catch((error) => {
						console.error(error)
						res.status(500).send('Error: ' + error)
					})
			}
		})
		.catch((error) => {
			console.log(error)
			res.status(500).send('Error: ' + error)
		})
})

app.get('/movies', passport.authenticate('jwt', { session: false }), async (req, res) => {
	await Movies.find()
		.then((movies) => {
			res.json(movies)
		})
		.catch((error) => {
			console.error(error)
			res.status(500).send('Error: ' + error)
		})
})

app.get('/movies/:title', passport.authenticate('jwt', { session: false }), async (req, res) => {
	await Movies.findOne({ title: req.params.title })
		.then((movie) => {
			res.json(movie)
		})
		.catch((error) => {
			console.error(error)
			res.status(500).send('Error: ' + error)
		})
})

app.get('/movies/genre/:genre', passport.authenticate('jwt', { session: false }), async (req, res) => {
	await Movies.find({ 'genre.name': req.params.genre })
		.then((movies) => {
			res.json(movies)
		})
		.catch((error) => {
			console.error(error)
			res.status(500).send('Error: ' + error)
		})
})

app.get('/movies/director/:director', passport.authenticate('jwt', { session: false }), async (req, res) => {
	await Movies.findOne({ 'director.name': req.params.director })
		.then((director) => {
			res.json(director.Director)
		})
		.catch((error) => {
			console.error(error)
			res.status(500).send('Error: ' + error)
		})
})

app.put('/users/:username', passport.authenticate('jwt', { session: false }), async (req, res) => {
	if (req.user.username !== req.params.username) {
		return res.status(403).send(req.user.username + ' does not match ' + req.params.username)
	}
	await Users.findOneAndUpdate(
		{ username: req.params.username },
		{
			$set: {
				username: req.body.username,
				password: req.body.password,
				email: req.body.email,
				birthday: req.body.birthday,
				favoriteMovies: req.body.favoriteMovies,
			},
		},
		{ new: true },
	)
		.then((updatedUser) => {
			res.json(updatedUser)
		})
		.catch((error) => {
			console.error(error)
			res.status(500).send('Error: ' + error)
		})
})

app.get('/users', passport.authenticate('jwt', { session: false }), async (req, res) => {
	await Users.find()
		.then((users) => {
			res.json(users)
		})
		.catch((error) => {
			console.error(error)
			res.status(500).send('Error: ' + error)
		})
})

app.get('/users/:username', passport.authenticate('jwt', { session: false }), async (req, res) => {
	await Users.findOne({ username: req.params.username })
		.then((user) => {
			res.json(user)
		})
		.catch((error) => {
			console.error(error)
			res.status(500).send('Error: ' + error)
		})
})

app.delete('/users/:username', passport.authenticate('jwt', { session: false }), async (req, res) => {
	await Users.findOneAndDelete({ username: req.params.username })
		.then((user) => {
			if (!user) {
				res.status(400).send(req.params.username + ' was not found')
			} else {
				res.status(200).send(req.params.username + ' was deleted.')
			}
		})
		.catch((error) => {
			console.error(error)
			res.status(500).send('Error: ' + error)
		})
})

app.post(
	'/users/:username/favoriteMovies/:movieId',
	passport.authenticate('jwt', { session: false }),
	async (req, res) => {
		await Users.findOneAndUpdate(
			{ username: req.params.username },
			{
				$push: { favoriteMovies: req.params.movieId },
			},
			{ new: true },
		)
			.then((updatedUser) => {
				res.json(updatedUser)
			})
			.catch((error) => {
				console.error(error)
				res.status(500).send('Error: ' + error)
			})
	},
)

app.delete(
	'/users/:username/favoriteMovies/:movieId',
	passport.authenticate('jwt', { session: false }),
	async (req, res) => {
		await Users.findOneAndUpdate(
			{ username: req.params.username },
			{
				$pull: { favoriteMovies: req.params.movieId },
			},
			{ new: true },
		)
			.then((updatedUser) => {
				res.json(updatedUser)
			})
			.catch((error) => {
				console.error(error)
				res.status(500).send('Error: ' + error)
			})
	},
)

app.delete('/users/:username', passport.authenticate('jwt', { session: false }), async (req, res) => {
	await Users.findOneAndRemove({ username: req.params.username })
		.then((user) => {
			if (!user) {
				res.status(400).send(req.params.username + ' was not found')
			} else {
				res.status(200).send(req.params.username + ' was deleted.')
			}
		})
		.catch((error) => {
			console.error(error)
			res.status(500).send('Error: ' + error)
		})
})

const port = process.env.PORT || 8080
app.listen(port, '0.0.0.0', () => {
	console.log('Listening on Port ' + port)
})

// app.listen(8000, () => {
// 	console.log('Your app is listening on port 8000.')
// })
