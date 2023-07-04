const jwt = require('jsonwebtoken');
const config = require('../config.json');

//////////////////////

async function jwtVerify(token, key) {
    return new Promise((resolve, reject) => {
        if (!token) return resolve(null);
        return jwt.verify(token, key, (err, decoded) => err ? resolve(null) :
            resolve(decoded))
    });
}

async function verifyToken(token) {
    if (!token) {
        return {
            status: 403
        }
    }

    const verify = await jwtVerify(token, config.tokens.access.secretKey, (err, decoded) => {
        if (err) {
            return {
                status: 401
            }
        }
    });
    return verify || {
        status: 200
    }
}

function generateAccessToken(id) {
    return jwt.sign({ id }, config.tokens.access.secretKey, { expiresIn: config.tokens.access.expiresIn });
}

function generateRefreshToken(id) {
    return jwt.sign({ id }, config.tokens.refresh.secretKey, { expiresIn: config.tokens.refresh.expiresIn });
}

module.exports = {
    verifyToken,
    jwtVerify,
    generateAccessToken,
    generateRefreshToken
}