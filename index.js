const express = require('express');
const mongoose = require('mongoose');
const Models = require('./models.js');
const { check, validationResult } = require('express-validator');
const dotenv = require('dotenv');
const cors = require('cors');
const passport = require('passport');
const jwt = require('jsonwebtoken');

dotenv.config();
mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });
//connect LOCAL database
//mongoose.connect('mongodb://localhost:27017/myFlixDB', { useNewUrlParser: true, useUnifiedTopology: true });

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const Movies = Models.Movie;
const Users = Models.User;

// CORS setup
let allowedOrigins = [
  'http://localhost:8080',
  'https://bflixb.netlify.app',
  'http://localhost:1234',
  'https://movie-api-o5p9.onrender.com',
  'http://localhost:4200',
  'https://capmec.github.io',
  

];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      let message = 'The CORS policy for this application doesn’t allow access from origin ' + origin;
      return callback(new Error(message), false);
    }
    return callback(null, true);
  }
}));

// Import authentication routes
let auth = require('./auth/auth.js')(app);
require('./auth/passport.js');

// Main route
/**
 * @route GET /
 * @group Main
 * @returns {string} 200 - Welcome message
 */
app.get('/', (req, res) => {
  res.send('Welcome to myFlix!');
});
app.use(express.static('public'));

/**
 * @route POST /users
 * @group Users
 * @param {string} username.body.required - Username
 * @param {string} password.body.required - Password
 * @param {string} email.body.required - Email
 * @param {string} birthday.body - Birthday
 * @returns {object} 201 - Created user
 * @returns {Error} 400 - Bad Request
 * @returns {Error} 500 - Internal Server Error
 */
app.post(
  '/users',
  [
    check('username', 'Username is required').isLength({ min: 5 }),
    check('username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
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

/**
 * @route POST /login
 * @group Users
 * @param {string} username.body.required - Username
 * @param {string} password.body.required - Password
 * @returns {object} 200 - Logged in user and JWT token
 * @returns {Error} 400 - Bad Request
 */
app.post('/login', [
  check('username', 'Username is required').isLength({ min: 5 }),
  check('password', 'Password is required').not().isEmpty(),
], async (req, res) => {
  let errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  let user = await Users.findOne({ username: req.body.username });

  if (!user) {
    return res.status(400).json({ message: 'Incorrect username or password', user: false });
  }

  let isPasswordValid = await user.validatePassword(req.body.password);
  if (!isPasswordValid) {
    return res.status(400).json({ message: 'Incorrect username or password', user: false });
  }

  let token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

  return res.status(200).json({ user: user, token: token });
});

/**
 * @route GET /users/:id
 * @group Users
 * @param {string} id.path.required - User ID
 * @returns {object} 200 - User details
 * @returns {Error} 500 - Internal Server Error
 */
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

/**
 * @route GET /users/:username
 * @group Users
 * @param {string} username.path.required - Username
 * @returns {object} 200 - User details
 * @returns {Error} 500 - Internal Server Error
 */
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

/**
 * @route PUT /users/:id
 * @group Users
 * @param {string} id.path.required - User ID
 * @param {string} username.body - Username
 * @param {string} password.body - Password
 * @param {string} email.body - Email
 * @param {string} birthday.body - Birthday
 * @param {array} favoriteMovies.body - Favorite Movies
 * @returns {object} 200 - Updated user
 * @returns {Error} 403 - Forbidden
 * @returns {Error} 404 - User not found
 * @returns {Error} 500 - Internal Server Error
 */
app.put(
  '/users/:id',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      if (req.user._id.toString() !== req.params.id) {
        return res.status(403).send('You are not authorized to update this user profile.');
      }

      const hashedPassword = req.body.password
        ? await Users.hashPassword(req.body.password)
        : undefined;

      const updatedUser = await Users.findOneAndUpdate(
        { _id: req.params.id },
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

      if (!updatedUser) {
        return res.status(404).send('User not found.');
      }

      res.json(updatedUser);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error: ' + error.message);
    }
  },
);

/**
 * @route DELETE /users/:id
 * @group Users
 * @param {string} id.path.required - User ID
 * @returns {string} 200 - Deleted user message
 * @returns {Error} 400 - Bad Request
 * @returns {Error} 500 - Internal Server Error
 */
app.delete(
  '/users/:id',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const user = await Users.findByIdAndDelete(req.params.id);
      if (!user) {
        return res.status(400).send(req.params.id + ' was not found');
      }
      return res.status(200).send(req.params.id + ' was deleted.');
    } catch (error) {
      console.error(error);
      return res.status(500).send('Error: ' + error);
    }
  }
);

/**
 * @route GET /users/:id/favoriteMovies
 * @group Users
 * @param {string} id.path.required - User ID
 * @returns {object} 200 - List of favorite movies
 * @returns {Error} 404 - User not found
 * @returns {Error} 500 - Internal Server Error
 */
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

/**
 * @route POST /users/:id/movies/:movieId
 * @group Users
 * @param {string} id.path.required - User ID
 * @param {string} movieId.path.required - Movie ID
 * @returns {object} 200 - Updated user with added favorite movie
 * @returns {Error} 404 - User not found
 * @returns {Error} 400 - Movie already in favorites
 * @returns {Error} 500 - Internal Server Error
 */
app.post(
  '/users/:id/movies/:movieId',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const user = await Users.findById(req.params.id);
      if (!user) {
        return res.status(404).send('User not found');
      }
      if (user.favoriteMovies.includes(req.params.movieId)) {
        return res.status(400).send('Movie already in favorites');
      }
      user.favoriteMovies.push(req.params.movieId);
      await user.save();
      res.status(200).json(user);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error: ' + error);
    }
  }
);

/**
 * @route DELETE /users/:id/movies/:movieId
 * @group Users
 * @param {string} id.path.required - User ID
 * @param {string} movieId.path.required - Movie ID
 * @returns {object} 200 - Updated user with removed favorite movie
 * @returns {Error} 404 - User not found
 * @returns {Error} 500 - Internal Server Error
 */
app.delete(
  '/users/:id/movies/:movieId',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const user = await Users.findById(req.params.id);
      if (!user) {
        return res.status(404).send('User not found');
      }
      user.favoriteMovies = user.favoriteMovies.filter(
        (id) => id.toString() !== req.params.movieId
      );
      await user.save();
      res.status(200).json(user);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error: ' + error);
    }
  }
);

/**
 * @route POST /movies
 * @group Movies
 * @param {string} title.body.required - Movie title
 * @param {string} year.body - Movie year
 * @param {string} description.body - Movie description
 * @param {object} genre.body - Movie genre
 * @param {object} director.body - Movie director
 * @param {array} actors.body - Movie actors
 * @param {string} image.body - Movie image
 * @param {boolean} featured.body - Is movie featured
 * @returns {object} 201 - Created movie
 * @returns {Error} 400 - Bad Request
 * @returns {Error} 500 - Internal Server Error
 */
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

/**
 * @route GET /movies
 * @group Movies
 * @returns {object} 200 - List of all movies
 * @returns {Error} 500 - Internal Server Error
 */
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

/**
 * @route GET /movies/:id
 * @group Movies
 * @param {string} id.path.required - Movie ID
 * @returns {object} 200 - Movie details
 * @returns {Error} 500 - Internal Server Error
 */
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

/**
 * @route GET /movies/:title
 * @group Movies
 * @param {string} title.path.required - Movie title
 * @returns {object} 200 - Movie details
 * @returns {Error} 500 - Internal Server Error
 */
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

/**
 * @route GET /movies/genre/:genre
 * @group Movies
 * @param {string} genre.path.required - Genre
 * @returns {object} 200 - List of movies by genre
 * @returns {Error} 500 - Internal Server Error
 */
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

/**
 * @route GET /movies/director/:director
 * @group Movies
 * @param {string} director.path.required - Director name
 * @returns {object} 200 - Director details
 * @returns {Error} 500 - Internal Server Error
 */
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

/**
 * @route GET /movies/actors/:actors
 * @group Movies
 * @param {string} actors.path.required - Actor name
 * @returns {object} 200 - Actor details
 * @returns {Error} 500 - Internal Server Error
 */
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

/**
 * @route PUT /movies/:id
 * @group Movies
 * @param {string} id.path.required - Movie ID
 * @param {string} title.body - Movie title
 * @param {string} year.body - Movie year
 * @param {string} description.body - Movie description
 * @param {object} genre.body - Movie genre
 * @param {object} director.body - Movie director
 * @param {array} actors.body - Movie actors
 * @param {string} image.body - Movie image
 * @param {boolean} featured.body - Is movie featured
 * @returns {object} 200 - Updated movie
 * @returns {Error} 500 - Internal Server Error
 */
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

/**
 * @route DELETE /movies/:id
 * @group Movies
 * @param {string} id.path.required - Movie ID
 * @returns {string} 200 - Deleted movie message
 * @returns {Error} 400 - Bad Request
 * @returns {Error} 500 - Internal Server Error
 */
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

/**
 * @route GET /movies/director/:name
 * @group Movies
 * @param {string} name.path.required - Director name
 * @returns {object} 200 - Director details
 * @returns {Error} 500 - Internal Server Error
 */
app.get(
  '/movies/director/:name',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    await Movies.findOne({ 'director.name': req.params.name })
      .then((director) => {
        res.json(director.director);
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
