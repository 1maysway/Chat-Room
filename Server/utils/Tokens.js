const jwt = require('jsonwebtoken');
const config = require('../config.json');

function generateAccessToken(id) {
    return jwt.sign({ id }, config.tokens.access.secretKey, { expiresIn: config.tokens.access.expiresIn });
}

function generateRefreshToken(id) {
    return jwt.sign({ id }, config.tokens.refresh.secretKey, { expiresIn: config.tokens.refresh.expiresIn });
}

module.exports = {
    generateAccessToken,
    generateRefreshToken
}