const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'bloodbank_jwt_secret_key_2024_secure';

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { generateToken, verifyToken };
