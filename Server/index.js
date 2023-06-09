const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pg = require("pg");
const { verifyToken, verifyAdmin } = require("./utils/MiddleWares");
const config = require("./config.json");
const { generateAccessToken, generateRefreshToken } = require("./utils/Tokens");
const nodemailer = require("nodemailer");
var cors = require("cors");

//////////////////////////////

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "godenhamster@gmail.com",
        pass: "efnuyagyumrulnwt",
    },
});

const dbConfig = config.dbConfig;

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

const pool = new pg.Pool(dbConfig);

const verifyAdmin_bnd = verifyAdmin.bind({}, { pool });
const verifyToken_bnd = verifyToken.bind({}, {});

app.post("/auth/register", (req, res) => {
    const {
        username,
        password,
        email,
        country = null,
        city = null,
        language = null,
        age = null,
        gender = null,
    } = req.body;
    if (!username || !password || !email) {
        return res.status(400).send({ message: "Пожалуйста, заполните все поля." });
    }
    const hashedPassword = bcrypt.hashSync(password, 8);
    const query = 'SELECT * FROM "Users" WHERE email = $1 OR username = $2';
    const values = [email, username];
    pool.query(query, values, async(error, result) => {
        if (error) {
            console.error(error);
            return res
                .status(500)
                .send({ message: "Ошибка сервера.", error: error.toString() });
        }
        if (result.rows.length > 0) {
            return res
                .status(400)
                .send({ message: "Такой пользователь уже зарегистрирован." });
        }
        const insertQuery =
            'INSERT INTO "Users" (username, password_hash, email, country, city, language, age, gender) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *';
        const insertValues = [
            username,
            hashedPassword,
            email,
            country,
            city,
            language,
            age,
            gender,
        ];
        pool.query(insertQuery, insertValues, (insertError, insertResult) => {
            if (insertError) {
                console.error(insertError);
                return res
                    .status(500)
                    .send({ message: "Ошибка сервера.", error: error.toString() });
            }
            const token = generateAccessToken(insertResult.rows[0].id);
            return res.status(201).send({ auth: true, token: token });
        });

        const token = jwt.sign({ email }, config.tokens.email_confirm.secretKey, {
            expiresIn: config.tokens.email_confirm.expiresIn,
        });
        const mailOptions = {
            from: "godenhamster@gmail.com",
            to: email,
            subject: "Подтверждение регистрации",
            text: `Перейдите по ссылке для подтверждения регистрации: http://localhost:8080/auth/confirm?token=${token}`,
        };
        await transporter.sendMail(mailOptions);
    });
});

app.get("/auth/confirm", (req, res) => {
    const { token } = req.query;
    try {
        jwt.verify(token, config.tokens.email_confirm.secretKey, (err, decoded) => {
            if (err) {
                return res.status(401).send({ message: "Токен недействителен" });
            }
            const email = decoded.email;

            const query = 'UPDATE "Users" SET email_confirmed = $1 WHERE email = $2';
            const values = [true, email];
            pool.query(query, values, (err, result) => {
                if (err) {
                    console.error(err);
                    return res
                        .status(500)
                        .send({
                            message: "Ошибка сервера.",
                            error: err.toString(),
                            email_confirmed: false,
                        });
                }
                return res.status(200).send({ email_confirmed: true });
            });
        });
    } catch (error) {
        console.error(error);
    }
});

app.post("/auth/login", (req, res) => {
    const { email, password } = req.body;

    console.log(req.body);

    if (!email || !password) {
        return res.status(400).send({ message: "Пожалуйста, заполните все поля." });
    }

    const query = 'SELECT * FROM "Users" WHERE email = $1';
    const values = [email];
    pool.query(query, values, (error, result) => {
        if (error) {
            return res
                .status(500)
                .send({ message: "Ошибка сервера.", error: error.toString() });
        }
        if (!result.rows.length) {
            return res.status(404).send({ message: "Пользователь не найден." });
        }
        const passwordIsValid = bcrypt.compareSync(
            password,
            result.rows[0].password_hash
        );
        if (!passwordIsValid) {
            return res
                .status(401)
                .send({ auth: false, token: null, message: "Неверный пароль." });
        }

        const accessToken = generateAccessToken(result.rows[0].id);

        const refreshToken = generateRefreshToken(result.rows[0].id);

        // const updateQuery = 'UPDATE "Users" SET refresh_token = $1 WHERE id = $2';
        // const updateValues = [refreshToken, result.rows[0].id];
        // pool.query(updateQuery, updateValues, (updateError, updateResult) => {
        //     if (updateError) {
        //         console.error(updateError);
        //         return res.status(500).send({ message: 'Ошибка сервера.', error: error.toString() });
        //     }

        res.cookie('acs', accessToken, { maxAge: 3600000, sameSite: 'strict' });
        res.cookie('rfs', refreshToken, { maxAge: 3600000, sameSite: 'strict' });

        return res
            .status(200)
            .send({
                auth: true,
                access_token: accessToken,
                refresh_token: refreshToken,
            });
        // });
    });
});

app.post("/auth/refresh-token", (req, res) => {
    const refreshToken = req.body.refreshToken;
    if (!refreshToken) {
        return res.status(401).send({ message: "Требуется рефреш токен." });
    }

    jwt.verify(refreshToken, refreshSecretKey, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: "Рефреш токен недействителен." });
        }

        const userId = decoded.id;

        const token = generateAccessToken(userId);
        const newRefreshToken = generateRefreshToken(userId);

        return res
            .status(200)
            .send({ auth: true, token: token, refreshToken: newRefreshToken });
    });
});

app.post("/admin/data/users", verifyToken_bnd, verifyAdmin_bnd, (req, res) => {
    const {
        username,
        password,
        email,
        country = null,
        city = null,
        language = null,
        age = null,
        gender = null,
        role = 0,
    } = req.body;
    if (!username || !password || !email) {
        return res.status(400).send({ message: "Пожалуйста, заполните все поля." });
    }
    const hashedPassword = bcrypt.hashSync(password, 8);
    const query =
        'INSERT INTO "Users" (username, password_hash, email, country, city, language, age, gender, role) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *';
    const values = [
        username,
        hashedPassword,
        email,
        country,
        city,
        language,
        age,
        gender,
        role,
    ];
    pool.query(query, values, (error, result) => {
        if (error) {
            return res
                .status(500)
                .send({ message: "Ошибка сервера.", error: error.toString() });
        }
        const user = result.rows[0];
        return res
            .status(201)
            .send({ message: "Пользователь создан успешно.", user });
    });
});

app.get("/admin/data/users", verifyToken_bnd, verifyAdmin_bnd, (req, res) => {
    const query = 'SELECT * FROM "Users"';
    pool.query(query, (error, result) => {
        if (error) {
            console.error(error);
            return res
                .status(500)
                .send({ message: "Ошибка сервера.", error: error.toString() });
        }
        const users = result.rows;
        return res.status(200).send(users);
    });
});

app.get(
    "/admin/data/users/:id",
    verifyToken_bnd,
    verifyAdmin_bnd,
    (req, res) => {
        const { id } = req.params;
        const query = 'SELECT * FROM "Users" WHERE id = $1';
        const values = [id];
        pool.query(query, values, (error, result) => {
            if (error) {
                return res
                    .status(500)
                    .send({ message: "Ошибка сервера.", error: error.toString() });
            }
            if (!result.rows.length) {
                return res.status(404).send({ message: "Пользователь не найден." });
            }
            const user = result.rows[0];
            return res.status(200).send(user);
        });
    }
);

app.put(
    "/admin/data/users/:id",
    verifyToken_bnd,
    verifyAdmin_bnd,
    (req, res) => {
        const { id } = req.params;
        const { username, password, role } = req.body;
        if (!username || !password || !role) {
            return res
                .status(400)
                .send({ message: "Пожалуйста, заполните все поля." });
        }
        const hashedPassword = bcrypt.hashSync(password, 8);
        const query =
            'UPDATE "Users" SET username = $1, password = $2, role = $3 WHERE id = $4 RETURNING *';
        const values = [username, hashedPassword, role, id];
        pool.query(query, values, (error, result) => {
            if (error) {
                return res
                    .status(500)
                    .send({ message: "Ошибка сервера.", error: error.toString() });
            }
            if (!result.rows.length) {
                return res.status(404).send({ message: "Пользователь не найден." });
            }
            const user = result.rows[0];
            return res
                .status(200)
                .send({ message: "Данные пользователя обновлены успешно.", user });
        });
    }
);

app.delete(
    "/admin/data/users/:id",
    verifyToken_bnd,
    verifyAdmin_bnd,
    (req, res) => {
        const { id } = req.params;
        const query = 'DELETE FROM "Users" WHERE id = $1 RETURNING *';
        const values = [id];
        pool.query(query, values, (error, result) => {
            if (error) {
                return res
                    .status(500)
                    .send({ message: "Ошибка сервера.", error: error.toString() });
            }
            if (!result.rows.length) {
                return res.status(404).send({ message: "Пользователь не найден." });
            }
            const user = result.rows[0];
            return res
                .status(200)
                .send({ message: "Пользователь удален успешно.", user });
        });
    }
);

app.post("/userInitialData", verifyToken_bnd, (req, res) => {
    const { access_token } = req.body;

    console.log(req.body);

    jwt.verify(access_token, config.tokens.access.secretKey, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: "Токен недействителен" });
        }

        const query = 'SELECT * FROM "Users" WHERE id = $1';
        const values = [decoded.id];
        pool.query(query, values, (error, result) => {
            if (error) {
                return res.status(500).send({
                    message: "Ошибка сервера.",
                    error: error.toString()
                });
            }
            if (!result.rows.length) {
                return res.status(404).send({
                    message: "Пользователь не найден."
                });
            }
            const user = result.rows[0];

            return res.status(200).send({
                message: "Ok",
                data: {
                    loggedIn: true,
                    info: {
                        id: user.id,
                        username: user.username,
                        avatarUrl: user.avatar_url,
                    },
                },
            });
        });
    });
});

app.post("/complaint/create", verifyToken_bnd, (req, res) => {
    const { access_token, complaint } = req.body;
    const { reason, description, creator_id, to_message_id, target_id, room_id } = complaint;

    jwt.verify(access_token, config.tokens.access.secretKey, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: "Токен недействителен" });
        }

        const query = 'INSERT INTO "Complaints" (reason,description,creator_id,to_message_id,target_id,room_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *';
        const values = [reason, description, creator_id, to_message_id, target_id, room_id];
        pool.query(query, values, (error, result) => {
            if (error) {
                return res.status(500).send({
                    message: "Ошибка сервера.",
                    error: error.toString()
                });
            }

            const complaintRes = result.rows[0];

            return res.status(200).send({
                message: "Ok",
                data: {
                    complaint: complaintRes
                },
            });
        });
    });
});

////////////////////////////

app.listen(config.server.PORT, () => {
    console.log(`Сервер запущен на порту ${config.server.PORT}.`);
});