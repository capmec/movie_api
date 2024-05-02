const passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy,
	Models = require('../models'),
	passportJWT = require('passport-jwt')

let Users = Models.User,
	JWTStrategy = passportJWT.Strategy,
	ExtractJWT = passportJWT.ExtractJwt

passport.use(
	new LocalStrategy(
		{
			usernameField: 'Username',
			passwordField: 'Password',
		},
		async (username, password, callback) => {
			console.log(`${username} ${password}`)
			await Users.findOne({ username: username })
				.then((user) => {
					if (!user) {
						console.log('incorrect username')
						return callback(null, false, {
							message: 'Incorrect username or password.',
						})
					}
					if (!user.validatePassword(password)) {
						console.log('incorrect password')
						return callback(null, false, { message: 'Incorrect password.' })
					}
					console.log('finished')
					return callback(null, user)
				})
				.catch((error) => {
					if (error) {
						console.log(error)
						return callback(error)
					}
				})
		},
	),
)

//Authenticate users based on JWT submitted with their request.
passport.use(
	new JWTStrategy(
		{
			jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(), //JWT is extracted from HTTP request header
			secretOrKey: 'your_jwt_secret', //use secret key to verify signature of the JWT (ensure client is who it says it is and JWT hasn't been altered)
		},
		async (jwtPayload, callback) => {
			//take the object literal of the decoded JWT payload as a parameter
			return await Users.findById(jwtPayload._id)
				.then((user) => {
					return callback(null, user)
				})
				.catch((error) => {
					return callback(error)
				})
		},
	),
)
