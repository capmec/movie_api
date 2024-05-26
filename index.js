const express = require('express');
const mongoose = require('mongoose');
const Models = require('./models.js');
const { check, validationResult } = require('express-validator');
const dotenv = require('dotenv');
const cors = require('cors');
const passport = require('passport');

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('public'));


mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true })
//connect LOCAL database
//mongoose.connect('mongodb://localhost:27017/myFlixDB', { useNewUrlParser: true, useUnifiedTopology: true });

const Movies = Models.Movie;
const Users = Models.User;

require('./auth/auth.js')(app);
require('./auth/passport.js');

app.get('/', (req, res) => {
    res.send('Welcome to myFlix!');
});

app.post(
    '/users',
    [
        check('username', 'Username is required').isLength({ min: 5 }),
        check('username', 'Username contains non-alphanumeric characters - not allowed.').isAlphanumeric(),
        check('password', 'Password is required').not().isEmpty(),
        check('email', 'Email does not appear to be valid').isEmail(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
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
    }
);

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

app.get('/movies/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Movies.findById(req.params.id)
        .then((movie) => {
            res.json(movie);
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
        });
});

app.get('/movies/title/:title', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Movies.findOne({ title: req.params.title })
        .then((movie) => {
            res.json(movie);
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
        });
});

app.get('/movies/genre/:genre', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Movies.find({ 'genre.name': req.params.genre })
        .then((movies) => {
            res.json(movies);
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
        });
});

app.get('/movies/director/:director', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Movies.findOne({ 'director.name': req.params.director })
        .then((movie) => {
            res.json(movie.director);
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
        });
});

app.get('/movies/actors/:actors', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Movies.findOne({ actors: req.params.actors })
        .then((movie) => {
            res.json(movie.actors);
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
        });
});

app.put('/movies/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Movies.findByIdAndUpdate(
        req.params.id,
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
        { new: true }
    )
        .then((updatedMovie) => {
            res.json(updatedMovie);
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
        });
});

app.delete('/movies/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Movies.findByIdAndRemove(req.params.id)
        .then((movie) => {
            if (!movie) {
                res.status(400).send(req.params.id + ' was not found');
            } else {
                res.status(200).send(req.params.id + ' was deleted.');
            }
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
        });
});

app.put('/users/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    if (req.user._id.toString() !== req.params.id) {
        return res.status(403).send('Permission denied');
    }
    const hashedPassword = req.body.password ? Users.hashPassword(req.body.password) : undefined;
    await Users.findByIdAndUpdate(
        req.params.id,
        {
            $set: {
                username: req.body.username,
                password: hashedPassword,
                email: req.body.email,
                birthday: req.body.birthday,
                favoriteMovies: req.body.favoriteMovies,
            },
        },
        { new: true }
    )
        .then((updatedUser) => {
            res.json(updatedUser);
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
        });
});

app.get('/users/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Users.findById(req.params.id)
        .then((user) => {
            res.json(user);
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
        });
});

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

app.get('/users/:username', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Users.findOne({ username: req.params.username })
        .then((user) => {
            res.json(user);
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
        });
});

app.delete('/users/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Users.findByIdAndRemove(req.params.id)
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
});

// Add a movie to a user's favoriteMovies array
app.post('/users/:username/movies/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    if (req.user.username !== req.params.username) {
        return res.status(403).send('Permission denied');
    }
    await Users.findOneAndUpdate(
        { username: req.params.username },
        { $push: { favoriteMovies: req.params.id } },
        { new: true }
    )
        .then((updatedUser) => {
            res.json(updatedUser);
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
        });
});

// DELETE a movie from a user's favoriteMovies array
app.delete('/users/:username/movies/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    if (req.user.username !== req.params.username) {
        return res.status(403).send('Permission denied');
    }
    await Users.findOneAndUpdate(
        { username: req.params.username },
        { $pull: { favoriteMovies: req.params.id } },
        { new: true }
    )
        .then((updatedUser) => {
            res.json(updatedUser);
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
        });
});

// Get a user's favorite movies from the favoriteMovies array
app.get('/users/:username/favoriteMovies', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const user = await Users.findOne({ username: req.params.username }).populate('favoriteMovies');
        res.json(user.favoriteMovies);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error: ' + error);
    }
});

app.delete('/users/:username', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Users.findOneAndRemove({ username: req.params.username })
        .then((user) => {
            if (!user) {
                res.status(400).send(req.params.username + ' was not found');
            } else {
                res.status(200).send(req.params.username + ' was deleted.');
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
