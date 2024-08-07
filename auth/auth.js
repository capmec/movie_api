const jwtSecret = 'your_jwt_secret';
const jwt = require('jsonwebtoken');
const passport = require('passport');
require('./passport'); // Your local passport file

/**
 * Generate JWT Token
 * @param {object} user - User object
 * @returns {string} - JWT token
 */
let generateJWTToken = (user) => {
  return jwt.sign(user, jwtSecret, {
    subject: user.username, // This is the username you’re encoding in the JWT
    expiresIn: '3h', // This specifies that the token will expire in 3 hours
    algorithm: 'HS256', // This is the algorithm used to “sign” or encode the values of the JWT
  });
};

/**
 * @param {object} router - Express router
 */
module.exports = (router) => {
  /**
   * POST login
   * @route POST /login
   * @param {object} req - Request object
   * @param {object} res - Response object
   * @returns {object} 200 - User and token
   * @returns {Error} 400 - Bad Request
   */
  router.post('/login', (req, res) => {
    passport.authenticate('local', { session: false }, (error, user, info) => {
      if (error || !user) {
        return res.status(400).json({
          message: 'Something is not right',
          user: user,
        });
      }
      req.login(user, { session: false }, (error) => {
        if (error) {
          res.send(error);
        }
        let token = generateJWTToken(user.toJSON());
        return res.json({ user, token });
      });
    })(req, res);
  });
};
