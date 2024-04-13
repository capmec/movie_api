const express = require('express');
morgan = require('morgan');
path = require('path');
bodyParser = require('body-parser');
uuid = require('uuid');

const app = express();

app.use(bodyParser.json());

//Use the Morgan middleware library to log all requests (instead of using the fs module to write to a text file).
app.use(morgan('common'));

let movies = [
	{
		id: 1,
		title: 'Inception',
		year: 2010,
		genre: ['Action', 'Sci-Fi', 'Thriller'],
		director: 'Christopher Nolan',
		rating: 8.8,
	},
	{
		id: 25,
		title: 'The Shawshank Redemption',
		year: 1994,
		genre: ['Drama'],
		director: 'Frank Darabont',
		rating: 9.3,
	},
	{
		id: 3,
		title: 'The Godfather',
		year: 1972,
		genre: ['Crime', 'Drama'],
		director: 'Francis Ford Coppola',
		rating: 9.2,
	},
	{
		id: 4,
		title: 'The Dark Knight',
		year: 2008,
		genre: ['Action', 'Crime', 'Drama'],
		director: 'Christopher Nolan',
		rating: 9.0,
	},
	{
		id: 5,
		title: 'Pulp Fiction',
		year: 1994,
		genre: ['Crime', 'Drama'],
		director: 'Quentin Tarantino',
		rating: 8.9,
	},
	{
		id: 6,
		title: 'The Matrix',
		year: 1999,
		genre: ['Action', 'Sci-Fi'],
		director: 'Lana Wachowski, Lilly Wachowski',
		rating: 8.7,
	},
	{
		id: 7,
		title: 'Interstellar',
		year: 2014,
		genre: ['Adventure', 'Drama', 'Sci-Fi'],
		director: 'Christopher Nolan',
		rating: 8.6,
	},
	{
		id: 8,
		title: 'Forrest Gump',
		year: 1994,
		genre: ['Drama', 'Romance'],
		director: 'Robert Zemeckis',
		rating: 8.8,
	},
	{
		id: 9,
		title: 'Fight Club',
		year: 1999,
		genre: ['Drama'],
		director: 'David Fincher',
		rating: 8.8,
	},
	{
		id: 10,
		title: 'The Lord of the Rings: The Fellowship of the Ring',
		year: 2001,
		genre: ['Adventure', 'Drama', 'Fantasy'],
		director: 'Peter Jackson',
		rating: 8.8,
	},
];

let directors = [
	{
		name: 'Christopher Nolan',
		birthdate: 'July 30, 1970',
		deathdate: null,
		bio: 'Christopher Edward Nolan is a British-American film director, producer, and screenwriter. He is known for making personal, distinctive films within the Hollywood mainstream.',
	},
	{
		name: 'Frank Darabont',
		birthdate: 'January 28, 1959',
		deathdate: null,
		bio: 'Frank Darabont is a Hungarian-American film director, screenwriter, and producer. He is best known for his work on the films The Shawshank Redemption, The Green Mile, and The Mist.',
	},
	{
		name: 'Francis Ford Coppola',
		birthdate: 'April 7, 1939',
		deathdate: null,
		bio: 'Francis Ford Coppola is an American film director, producer, and screenwriter. He is widely regarded as one of the greatest filmmakers of all time.',
	},
	{
		name: 'Quentin Tarantino',
		birthdate: 'March 27, 1963',
		deathdate: null,
		bio: 'Quentin Jerome Tarantino is an American film director, screenwriter, producer, and actor. His films are characterized by nonlinear storylines, aestheticization of violence, extended dialogue scenes, and ensemble casts.',
	},
	{
		name: 'Lana Wachowski',
		birthdate: 'June 21, 1965',
		deathdate: null,
		bio: 'Lana Wachowski is an American film director, screenwriter, and producer. She is best known for co-directing The Matrix trilogy with her sister, Lilly Wachowski.',
	},
	{
		name: 'Lilly Wachowski',
		birthdate: 'December 29, 1967',
		deathdate: null,
		bio: 'Lilly Wachowski is an American film director, screenwriter, and producer. She is best known for co-directing The Matrix trilogy with her sister, Lana Wachowski.',
	},
	{
		name: 'Robert Zemeckis',
		birthdate: 'May 14, 1952',
		deathdate: null,
		bio: 'Robert Zemeckis is an American film director, producer, and screenwriter. He is best known for directing the Back to the Future trilogy, Forrest Gump, and Cast Away.',
	},
	{
		name: 'David Fincher',
		birthdate: 'August 28, 1962',
		deathdate: null,
		bio: 'David Andrew Leo Fincher is an American film director. He is known for his psychological thrillers, including Seven, Fight Club, and Zodiac.',
	},
	{
		name: 'Peter Jackson',
		birthdate: 'October 31, 1961',
		deathdate: null,
		bio: 'Sir Peter Robert Jackson is a New Zealand film director, producer, and screenwriter. He is best known for directing The Lord of the Rings trilogy and The Hobbit trilogy.',
	},
];

let users = [
	{
		id: 1,
		name: 'John Doe',
		username: 'johndoe',
		email: 'filmsFan2000@aol.com',
		favouriteMovies: ['Inception', 'The Shawshank Redemption'],
	},
	{
		id: 2,
		name: 'Jane Doe',
		username: 'janedoe',
		email: 'flixfilm@gmail.com',
		favouriteMovies: ['The Mountain'],
	},
];

// Return a list of ALL films to the user (READ)
app.get('/movies', (req, res) => {
	res.json(movies);
});

// Return a film from the title (READ)
app.get('/movies/:title', (req, res) => {
	const { title } = req.params;
	const movie = movies.find((movie) => movie.title === title);

	if (movie) {
		res.status(200).json(movie);
	} else {
		res.status(404).send('Movie not found');
	}
});

// Return a film by the genre (READ)
app.get('/movies/genre/:genre', (req, res) => {
	const { genre } = req.params;
	const movie = movies.filter((movie) => movie.genre.includes(genre));

	if (movie) {
		res.status(200).json(movie);
	} else {
		res.status(404).send('Movie not found');
	}
});

// Return Director data (READ)\
app.get('/directors/:director', (req, res) => {
	const { director } = req.params;
	const directorData = directors.find((directorData) => directorData.name === director);

	if (directorData) {
		res.status(200).json(directorData);
	} else {
		res.status(404).send('Director not found');
	}
});

// Allow new users to register (CREATE)
app.post('/users', (req, res) => {
	const newUser = req.body;

	if (newUser.name) {
		newUser.id = uuid.v4();
		users.push(newUser);
		res.status(201).json(newUser);
	} else {
		res.status(400).send(message);
	}
});

//Allow users to update their user info (username) (UPDATE)
app.put('/users/:id', (req, res) => {
	const { id } = req.params;
	const updatedUser = req.body;
	let user = users.find((user) => user.id == id);

	if (user) {
		user.username = updatedUser.username;
		res.status(200).json(user);
	} else {
		res.status(404).send('User not found');
	}
});

//Allow users to add a movie to their list of favorites (CREATE)
app.post('/users/:id/:movieTitle', (req, res) => {
	//console.log(users);
	const { id, movieTitle } = req.params;
	//console.log(`id: ${id}, movieTitle: ${movieTitle}`);
	let user = users.find((user) => user.id == id);
	if (user) {
		user.favouriteMovies.push(movieTitle);
		res.status(200).send(`${movieTitle} has been added to ${user.name}'s favourite movies list`);
	} else {
		res.status(404).send('User not found');
	}
});

//Allow users to remove a movie from their list of favorites (DELETE)
app.delete('/users/:id/:movieTitle', (req, res) => {
	//console.log(users);
	const { id, movieTitle } = req.params;
	//console.log(`id: ${id}, movieTitle: ${movieTitle}`);
	let user = users.find((user) => user.id == id);

	if (user) {
		user.favouriteMovies = user.favouriteMovies.filter((title) => title !== movieTitle);
		res.status(200).send(`${movieTitle} has been deleted from ${user.name}'s favourite movies list`);
	} else {
		res.status(404).send('User not found');
	}
});

//Allow existing users to deregister(DELETE)
app.delete('/users/:id', (req, res) => {
	const { id } = req.params;

	let user = users.find((user) => user.id == id);

	if (user) {
		users = users.filter((user) => user.id != id);

		res.status(200).send(`User ${user.email} has been deleted`);
	} else {
		res.status(404).send('User not found');
	}
});

//Create another GET route located at the endpoint “/” that returns a default textual response of your choosing.
app.get('/', (req, res) => {
	res.send('Welcome to my movie club!');
});

//Use express.static to serve your “documentation.html” file from the public folder (rather than using the http, url, and fs modules).

app.use(express.static('public'));

//ERROR HANDLING WITH MORGAN
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).send('Something broke!');
});

//LISTEN FOR REQUESTS

app.listen(8000, () => {
	console.log('Your app is listening on port 8000.');
});
