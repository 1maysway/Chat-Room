const jwt = require('jsonwebtoken');
const config = require('../config.json');
const cookies = require('cookie');
const { generateAccessToken, generateRefreshToken } = require('./Tokens');

function verifyToken(init, req, res, next) {
    // const cookie = cookies.parse(req.headers.cookie);
    const { acs: access_token = req.cookies.acs, rfs: refresh_token = req.cookies.rfs } = req.session;

    if (!access_token && !refresh_token) {
        return res.status(403).send({
            data: {
                auth: false,
            }
        });
    }

    jwt.verify(access_token, config.tokens.access.secretKey, (err, decoded) => {
        if (err) {
            jwt.verify(refresh_token, config.tokens.refresh.secretKey, (err, decoded) => {
                if (err) {
                    return res.status(401).send({
                        data: {
                            auth: false
                        }
                    });
                }

                const newACS = generateAccessToken(decoded.id, decoded.rememberBrowser);
                const newRFS = generateRefreshToken(decoded.id, decoded.rememberBrowser);

                if (!req.session.rfs) {
                    res.cookie("acs", newACS, {
                        maxAge: config.tokens.access.expiresIn * 1000,
                        sameSite: "strict",
                        expires: new Date(
                            new Date().getTime() + config.tokens.access.expiresIn * 1000
                        ).toUTCString(),
                    });

                    res.cookie("rfs", newRFS, {
                        maxAge: config.tokens.refresh.expiresIn * 1000,
                        sameSite: "strict",
                        expires: new Date(
                            new Date().getTime() + config.tokens.refresh.expiresIn * 1000
                        ).toUTCString(),
                    });
                } else {
                    req.session.acs = newACS;
                    req.session.rfs = newRFS;
                }

                if (req.session.rfs !== undefined) {
                    req.session.acs = newACS;
                    req.session.rfs = newRFS;
                } else {
                    req.cookies.acs = newACS;
                    req.cookies.rfs = newRFS;
                }

                req.user = decoded;
                next();
            });
        } else {
            req.user = decoded;
            next();
        }
    });
}

function verifyAdmin(init, req, res, next) {
    const { acs: access_token = req.cookies.acs, rfs: refresh_token = req.cookies.rfs } = req.session;

    if (!access_token) {
        return res.status(403).send({
            data: {
                auth: false
            }
        });
    }

    console.log("AA", access_token);

    jwt.verify(access_token, config.tokens.access.secretKey, (error, decoded) => {
        if (error) {
            console.error(error);
            return res.status(500).send({
                data: {
                    auth: false,
                    message: {
                        content: 'Ошибка сервера.',
                        type: "error"
                    },
                    error: error.toString()
                }
            });
        }
        const userId = decoded.id;
        const query = 'SELECT * FROM \"Users\" WHERE id = $1';
        const values = [userId];
        init.pool.query(query, values, (error, result) => {
            if (error) {
                console.error(error);
                return res.status(500).send({
                    data: {
                        auth: false,
                        message: {
                            content: 'Ошибка сервера.',
                            type: "error"
                        },
                        error: error.toString()
                    }
                });
            }
            if (!result.rows.length) {
                return res.status(404).send({
                    data: {
                        auth: false,
                        message: {
                            content: 'Пользователь не найден.',
                            type: "error"
                        }
                    }
                });
            }
            const userRole = result.rows[0].role;
            if (userRole !== 1) {
                return res.status(403).send({
                    data: {
                        auth: false,
                        message: {
                            content: 'Доступ запрещен.',
                            type: "error"
                        }
                    }
                });
            }
            next();
        });
    });
}

function synthSessionWithCookies(req, res, next) {
    console.log('acs', req.session.acs);
    if (req.session.acs && req.cookies.acs) {
        res.cookie("acs", req.session.acs, {
            maxAge: config.tokens.access.expiresIn * 1000,
            sameSite: "strict",
            expires: new Date(
                new Date().getTime() + config.tokens.access.expiresIn * 1000
            ).toUTCString(),
        });
    } else if (req.cookies.acs) {
        req.session.acs = req.cookies.acs;
    }
    if (req.session.rfs && req.cookies.rfs) {
        res.cookie("acs", req.session.rfs, {
            maxAge: config.tokens.refresh.expiresIn * 1000,
            sameSite: "strict",
            expires: new Date(
                new Date().getTime() + config.tokens.refresh.expiresIn * 1000
            ).toUTCString(),
        });
    } else if (req.cookies.rfs) {
        req.session.rfs = req.cookies.rfs;
    }
    next();
}

module.exports = {
    verifyToken,
    verifyAdmin,
    synthSessionWithCookies
}