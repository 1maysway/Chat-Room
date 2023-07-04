const jwt = require('jsonwebtoken');
const config = require('../config.json');

function generateAccessToken(id, rememberBrowser = 0) {
    return jwt.sign({ id, rememberBrowser }, config.tokens.access.secretKey, { expiresIn: config.tokens.access.expiresIn });
}

function generateRefreshToken(id, rememberBrowser = true) {
    return jwt.sign({ id, rememberBrowser }, config.tokens.refresh.secretKey, { expiresIn: config.tokens.refresh.expiresIn });
}

module.exports = {
    generateAccessToken,
    generateRefreshToken
}