const jwt = require('jsonwebtoken');
const config = require('../config.json');

//////////////////////

async function jwtVerify(token, key) {
    if (!token) return {};
    return new Promise((resolve, reject) =>
        jwt.verify(token, key, (err, decoded) => err ? reject({}) :
            resolve(decoded))
    );
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

module.exports = {
    verifyToken,
    jwtVerify
}