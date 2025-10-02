require('dotenv').config();

module.exports = {
    JWT_SECRET: process.env.JWT_SECRET || 'tu-jwt-secret-key',
    PORT: process.env.PORT || 3000,
    BCRYPT_ROUNDS: 10,
    TOKEN_EXPIRATION: process.env.TOKEN_EXPIRATION || '24h',
    APP_URL: process.env.APP_URL || 'http://localhost:3000'
};