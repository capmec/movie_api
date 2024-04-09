const express = require('express');
morgan = require('morgan');
path = require('path');

const app = express();

//Use the Morgan middleware library to log all requests (instead of using the fs module to write to a text file).
app.use(morgan('common'));

let topMovies = [
	{
		title: 'Inception',
		year: 2010,
		genre: ['Action', 'Sci-Fi', 'Thriller'],
		director: 'Christopher Nolan',
		rating: 8.8,
	},
	{
		title: 'The Shawshank Redemption',
		year: 1994,
		genre: ['Drama'],
		director: 'Frank Darabont',
		rating: 9.3,
	},
	{
		title: 'The Godfather',
		year: 1972,
		genre: ['Crime', 'Drama'],
		director: 'Francis Ford Coppola',
		rating: 9.2,
	},
	{
		title: 'The Dark Knight',
		year: 2008,
		genre: ['Action', 'Crime', 'Drama'],
		director: 'Christopher Nolan',
		rating: 9.0,
	},
	{
		title: 'Pulp Fiction',
		year: 1994,
		genre: ['Crime', 'Drama'],
		director: 'Quentin Tarantino',
		rating: 8.9,
	},
	{
		title: 'The Matrix',
		year: 1999,
		genre: ['Action', 'Sci-Fi'],
		director: 'Lana Wachowski, Lilly Wachowski',
		rating: 8.7,
	},
	{
		title: 'Interstellar',
		year: 2014,
		genre: ['Adventure', 'Drama', 'Sci-Fi'],
		director: 'Christopher Nolan',
		rating: 8.6,
	},
	{
		title: 'Forrest Gump',
		year: 1994,
		genre: ['Drama', 'Romance'],
		director: 'Robert Zemeckis',
		rating: 8.8,
	},
	{
		title: 'Fight Club',
		year: 1999,
		genre: ['Drama'],
		director: 'David Fincher',
		rating: 8.8,
	},
	{
		title: 'The Lord of the Rings: The Fellowship of the Ring',
		year: 2001,
		genre: ['Adventure', 'Drama', 'Fantasy'],
		director: 'Peter Jackson',
		rating: 8.8,
	},
];

app.get('/movies', (req, res) => {
	res.json(topMovies);
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
