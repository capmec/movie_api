const express = require('express'),
	mongoose = require('mongoose'),
	Models = require('./models.js'),
	{ check: e, validationResult: s } = require('express-validator'),
	dotenv = require('dotenv'),
	app = express()
app.use(express.json()),
	app.use(express.urlencoded({ extended: !0 })),
	dotenv.config(),
	mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: !0, useUnifiedTopology: !0 })
const Movies = Models.Movie,
	Users = Models.User,
	cors = require('cors')
app.use(cors())
let auth = require('./auth/auth.js')(app)
const passport = require('passport')
require('./auth/passport.js'),
	app.get('/', (e, s) => {
		s.send('Welcome to myFlix!')
	}),
	app.use(express.static('public')),
	app.post(
		'/users',
		[
			e('Username', 'Username is required').isLength({ min: 5 }),
			e('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
			e('Password', 'Password is required').not().isEmpty(),
			e('Email', 'Email does not appear to be valid').isEmail(),
		],
		async (e, a) => {
			let r = s(e)
			if (!r.isEmpty()) return a.status(422).json({ errors: r.array() })
			let t = Users.hashPassword(e.body.Password)
			await Users.findOne({ Username: e.body.Username })
				.then((s) => {
					if (s) return a.status(400).send(e.body.Username + ' already exists')
					Users.create({ Username: e.body.Username, Password: t, Email: e.body.Email, Birthday: e.body.Birthday })
						.then((e) => {
							a.status(201).json(e)
						})
						.catch((e) => {
							console.error(e), a.status(500).send('Error: ' + e)
						})
				})
				.catch((e) => {
					console.log(e), a.status(500).send('Error: ' + e)
				})
		},
	),
	app.post('/movies', passport.authenticate('jwt', { session: !1 }), async (e, s) => {
		await Movies.findOne({ Title: e.body.Title })
			.then((a) => {
				if (a) return s.status(400).send(e.body.Title + ' already exists')
				Movies.create({
					Title: e.body.Title,
					Year: e.body.Year,
					Description: e.body.Description,
					Genre: e.body.Genre,
					Director: e.body.Director,
					Actors: e.body.Actors,
					ImagePath: e.body.ImagePath,
					Featured: e.body.Featured,
				})
					.then((e) => {
						s.status(201).json(e)
					})
					.catch((e) => {
						console.error(e), s.status(500).send('Error: ' + e)
					})
			})
			.catch((e) => {
				console.log(e), s.status(500).send('Error: ' + e)
			})
	}),
	app.get('/movies', passport.authenticate('jwt', { session: !1 }), async (e, s) => {
		await Movies.find()
			.then((e) => {
				s.json(e)
			})
			.catch((e) => {
				console.error(e), s.status(500).send('Error: ' + e)
			})
	}),
	app.get('/movies/:Title', passport.authenticate('jwt', { session: !1 }), async (e, s) => {
		await Movies.findOne({ Title: e.params.Title })
			.then((e) => {
				s.json(e)
			})
			.catch((e) => {
				console.error(e), s.status(500).send('Error: ' + e)
			})
	}),
	app.get('/movies/Genre/:Genre', passport.authenticate('jwt', { session: !1 }), async (e, s) => {
		await Movies.find({ 'Genre.Name': e.params.Genre })
			.then((e) => {
				s.json(e)
			})
			.catch((e) => {
				console.error(e), s.status(500).send('Error: ' + e)
			})
	}),
	app.get('/movies/Director/:Director', passport.authenticate('jwt', { session: !1 }), async (e, s) => {
		await Movies.findOne({ 'Director.Name': e.params.Director })
			.then((e) => {
				s.json(e.Director)
			})
			.catch((e) => {
				console.error(e), s.status(500).send('Error: ' + e)
			})
	}),
	app.put('/users/:Username', passport.authenticate('jwt', { session: !1 }), async (e, s) => {
		if (e.user.Username !== e.params.Username)
			return s.status(403).send(e.user.Username + ' does not match ' + e.params.Username)
		await Users.findOneAndUpdate(
			{ Username: e.params.Username },
			{
				$set: {
					Username: e.body.Username,
					Password: e.body.Password,
					Email: e.body.Email,
					Birthday: e.body.Birthday,
					FavoriteMovies: e.body.FavoriteMovies,
				},
			},
			{ new: !0 },
		)
			.then((e) => {
				s.json(e)
			})
			.catch((e) => {
				console.error(e), s.status(500).send('Error: ' + e)
			})
	}),
	app.get('/users', passport.authenticate('jwt', { session: !1 }), async (e, s) => {
		await Users.find()
			.then((e) => {
				s.json(e)
			})
			.catch((e) => {
				console.error(e), s.status(500).send('Error: ' + e)
			})
	}),
	app.get('/users/:Username', passport.authenticate('jwt', { session: !1 }), async (e, s) => {
		await Users.findOne({ Username: e.params.Username })
			.then((e) => {
				s.json(e)
			})
			.catch((e) => {
				console.error(e), s.status(500).send('Error: ' + e)
			})
	}),
	app.delete('/users/:Username', passport.authenticate('jwt', { session: !1 }), async (e, s) => {
		await Users.findOneAndDelete({ Username: e.params.Username })
			.then((a) => {
				a
					? s.status(200).send(e.params.Username + ' was deleted.')
					: s.status(400).send(e.params.Username + ' was not found')
			})
			.catch((e) => {
				console.error(e), s.status(500).send('Error: ' + e)
			})
	}),
	app.post('/users/:Username/FavoriteMovies/:MovieID', passport.authenticate('jwt', { session: !1 }), async (e, s) => {
		await Users.findOneAndUpdate(
			{ Username: e.params.Username },
			{ $push: { FavoriteMovies: e.params.MovieID } },
			{ new: !0 },
		)
			.then((e) => {
				s.json(e)
			})
			.catch((e) => {
				console.error(e), s.status(500).send('Error: ' + e)
			})
	}),
	app.delete(
		'/users/:Username/FavoriteMovies/:MovieID',
		passport.authenticate('jwt', { session: !1 }),
		async (e, s) => {
			await Users.findOneAndUpdate(
				{ Username: e.params.Username },
				{ $pull: { FavoriteMovies: e.params.MovieID } },
				{ new: !0 },
			)
				.then((e) => {
					s.json(e)
				})
				.catch((e) => {
					console.error(e), s.status(500).send('Error: ' + e)
				})
		},
	),
	app.delete('/users/:Username', passport.authenticate('jwt', { session: !1 }), async (e, s) => {
		await Users.findOneAndRemove({ Username: e.params.Username })
			.then((a) => {
				a
					? s.status(200).send(e.params.Username + ' was deleted.')
					: s.status(400).send(e.params.Username + ' was not found')
			})
			.catch((e) => {
				console.error(e), s.status(500).send('Error: ' + e)
			})
	})
const port = process.env.PORT || 8080
app.listen(port, '0.0.0.0', () => {
	console.log('Listening on Port ' + port)
})
