# Movie API

This project is a movie API built with Node.js, Express.js, and MongoDB. It allows users to access a collection of
movies, store user data (including favorite films), and implements JWT authentication for secure user sessions.

## Features

- User authentication using JWT (JSON Web Tokens) and bcrypt for password hashing.
- MongoDB database integration to store movies and user data.
- RESTful API endpoints for movie retrieval, user management, and authentication.
- Input validation using `express-validator` for data integrity.
- CORS handling for cross-origin requests.
- Logging with `morgan` for HTTP request logging.

## Dependencies

- bcrypt: ^5.1.1
- body-parser: ^1.20.2
- cors: ^2.8.5
- dotenv: ^16.4.5
- express: ^4.19.2
- express-validator: ^7.0.1
- jsonwebtoken: ^9.0.2
- mongoose: ^8.3.2
- morgan: ^1.10.0
- passport: ^0.7.0
- passport-jwt: ^4.0.1
- passport-local: ^1.0.0

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/capmec/movie_api.git
   cd repository
   start:
   node index.js
   ```
