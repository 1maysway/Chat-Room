const jwt = require('jsonwebtoken');
const config = require('../config.json');

function verifyToken(init, req, res, next) {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(403).send({ auth: false, message: 'Необходим JWT токен для доступа к ресурсу.' });
    }

    jwt.verify(token, config.tokens.access.secretKey, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'Токен недействителен' });
        }
        req.user = decoded;
        next();
    });
}

function verifyAdmin(init, req, res, next) {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(403).send({ auth: false, message: 'Необходим JWT токен для доступа к ресурсу.' });
    }
    jwt.verify(token, config.tokens.access.secretKey, (error, decoded) => {
        console.log(token);
        if (error) {
            console.error(error);
            return res.status(500).send({ auth: false, message: 'Ошибка сервера.', error: error.toString() });
        }
        const userId = decoded.id;
        const query = 'SELECT * FROM \"Users\" WHERE id = $1';
        const values = [userId];
        init.pool.query(query, values, (error, result) => {
            if (error) {
                console.error(error);
                return res.status(500).send({ auth: false, message: 'Ошибка сервера.', error: error.toString() });
            }
            if (!result.rows.length) {
                return res.status(404).send({ auth: false, message: 'Пользователь не найден.' });
            }
            const userRole = result.rows[0].role;
            if (userRole !== 1) {
                return res.status(403).send({ auth: false, message: 'Доступ запрещен.' });
            }
            next();
        });
    });
}

module.exports = {
    verifyToken,
    verifyAdmin
}