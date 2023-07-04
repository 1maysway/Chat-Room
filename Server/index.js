const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pg = require("pg");
const {
    verifyToken,
    verifyAdmin,
    synthSessionWithCookies,
} = require("./utils/MiddleWares");
const config = require("./config.json");
const { generateAccessToken, generateRefreshToken } = require("./utils/Tokens");
const nodemailer = require("nodemailer");
var cors = require("cors");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const RedisStore = require("connect-redis").default;
const ioredis = require("ioredis");
const { createClient } = require("redis");
const generateId = require("./utils/utils").generateId;

//////////////////////////////////

const confirmCodes = {};
const confirmTokens = {};

let redisClient = createClient({
    port: 6379,
});
redisClient.connect().catch(console.error);

let redisStore = new RedisStore({
    client: redisClient,
    prefix: "myapp:",
});

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
app.use(cookieParser());
app.use(
    session({
        store: redisStore,
        secret: "secret_key",
        resave: false,
        saveUninitialized: true,
    })
);
app.use(
    cors({
        origin: "http://192.168.31.60:3000",
        credentials: true,
    })
);
app.use(synthSessionWithCookies);

const pool = new pg.Pool(dbConfig);

const verifyAdmin_bnd = verifyAdmin.bind({}, { pool });
const verifyToken_bnd = verifyToken.bind({}, {});

////////////////////////////// FUNCTIONS

const sendConfirmCode = (email, id) => {
    const prevCodeObj = confirmCodes[id];
    prevCodeObj && clearTimeout(prevCodeObj.timeoutId);

    const chars = "0123456789";
    const confirmCode = Array(6)
        .fill("")
        .map(() => chars[Math.floor(Math.random() * (chars.length - 1))])
        .join("");

    const mailOptions = {
        from: "godenhamster@gmail.com",
        to: email,
        subject: "Подтверждение регистрации",
        text: `Код для подтверждения электронной почты: ${confirmCode}`,
    };
    transporter.sendMail(mailOptions);

    confirmCodes[id] = {
        confirmCode,
        timeoutId: setTimeout(() => {
            delete confirmCodes[id];
        }, config.emailConfirm.emailConfirmCodeExpires),
    };
};

const sendConfirmLink = (email, type, data) => {
    const id = generateId(10);

    const token = jwt.sign({ id, type }, config.tokens.other.secretKey, {
        expiresIn: config.tokens.other.expiresIn,
    });

    switch (type) {
        case "email_change":
            {
                const mailOptions = {
                    from: "godenhamster@gmail.com",
                    to: email,
                    subject: "Email change",
                    html: `<a href="http://192.168.31.60:3000/email-confirm?t=${token}" target="_blank">Confirm email change</a>`,
                };

                transporter.sendMail(mailOptions);

                confirmTokens[id] = {
                    confirmToken: token,
                    timeoutId: setTimeout(() => {
                        delete confirmTokens[id];
                    }, config.emailConfirm.emailConfirmCodeExpires),
                    data,
                };

                break;
            }
    }
};

//////////////////////////////

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
        return res.status(400).send({
            data: {
                content: "Пожалуйста, заполните все поля.",
                type: "error",
            },
        });
    }
    const hashedPassword = bcrypt.hashSync(password, 8);
    const query = 'SELECT * FROM "Users" WHERE email = $1 OR username = $2';
    const values = [email, username];
    pool.query(query, values, async(error, result) => {
        if (error) {
            console.error(error);
            return res.status(500).send({
                data: {
                    message: {
                        content: "Ошибка сервера.",
                        type: "error",
                    },
                    error: error.toString(),
                },
            });
        }
        if (result.rows.length > 0) {
            return res.status(400).send({
                data: {
                    message: {
                        content: "Такой пользователь уже зарегистрирован.",
                        type: "error",
                    },
                },
            });
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
        pool.query(insertQuery, insertValues, async(insertError, insertResult) => {
            if (insertError) {
                console.error(insertError);
                return res.status(500).send({
                    data: {
                        message: {
                            content: "Ошибка сервера.",
                            type: "error",
                        },
                        error: error.toString(),
                    },
                    ok: false,
                });
            }
            try {
                sendConfirmCode(email, insertResult.rows[0].id);

                return res.status(200).send({
                    ok: true,
                    data: {
                        user_id: insertResult.rows[0].id,
                        emailConfirmCodeExpires: config.emailConfirm.emailConfirmCodeExpires,
                        canSendNewCodeIn: config.emailConfirm.canSendNewCodeIn,
                    },
                });
            } catch (error) {
                console.error(error);

                return res.status(500).send({
                    ok: false,
                    data: {
                        message: {
                            content: "Ошибка на сервере.",
                            type: "error",
                        },
                        error: error.toString(),
                    },
                });
            }
        });
    });
});

// DEPRECATED
app.get("/auth/confirm", (req, res) => {
    const { token } = req.query;
    try {
        jwt.verify(token, config.tokens.email_confirm.secretKey, (err, decoded) => {
            if (err) {
                return res.status(401).send({
                    data: {
                        message: {
                            content: "Токен недействителен",
                            type: "error",
                        },
                    },
                });
            }
            const email = decoded.email;

            const query = 'UPDATE "Users" SET email_confirmed = $1 WHERE email = $2';
            const values = [true, email];
            pool.query(query, values, (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send({
                        data: {
                            message: {
                                content: "Ошибка сервера.",
                                type: "error",
                            },
                            error: err.toString(),
                            email_confirmed: false,
                        },
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
    console.log("LOGIN");
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send({
            data: {
                message: {
                    content: "Пожалуйста, заполните все поля.",
                    type: "error",
                },
            },
        });
    }

    const query = 'SELECT * FROM "Users" WHERE email = $1';
    const values = [email];
    pool.query(query, values, async(error, result) => {
        if (error) {
            return res.status(500).send({
                data: {
                    message: {
                        content: "Ошибка сервера.",
                        type: "error",
                    },
                    error: error.toString(),
                },
            });
        }
        if (!result.rows.length) {
            return res.status(404).send({
                data: {
                    message: {
                        message: {
                            content: "Пользователь не найден.",
                            type: "error",
                        },
                    },
                },
            });
        }
        const passwordIsValid = bcrypt.compareSync(
            password,
            result.rows[0].password_hash
        );
        if (!passwordIsValid) {
            return res.status(401).send({
                data: {
                    auth: false,
                    token: null,
                    message: {
                        content: "Неверный пароль.",
                        type: "error",
                    },
                },
            });
        }

        // const accessToken = generateAccessToken(result.rows[0].id);
        // const refreshToken = generateRefreshToken(result.rows[0].id);

        // res.cookie('acs', accessToken, { maxAge: 3600000, sameSite: 'strict' });
        // res.cookie('rfs', refreshToken, { maxAge: 3600000, sameSite: 'strict' });

        // return res
        //     .status(200)
        //     .send({
        //         auth: true,
        //         access_token: accessToken,
        //         refresh_token: refreshToken,
        //     });

        try {
            sendConfirmCode(email, result.rows[0].id);

            return res.status(200).send({
                ok: true,
                data: {
                    user_id: result.rows[0].id,
                    emailConfirmCodeExpires: config.emailConfirm.emailConfirmCodeExpires,
                    canSendNewCodeIn: config.emailConfirm.canSendNewCodeIn,
                },
            });
        } catch (error) {
            console.error(error);

            return res.status(500).send({
                ok: false,
                data: {
                    message: {
                        content: "Ошибка на сервере",
                        type: "error",
                    },
                    error: error.toString(),
                },
            });
        }
    });
});

// DEPRECATED
app.post("/auth/refresh-token", (req, res) => {
    const refreshToken = req.body.refreshToken;
    if (!refreshToken) {
        return res.status(401).send({ message: "Требуется рефреш токен." });
    }

    jwt.verify(refreshToken, refreshSecretKey, (err, decoded) => {
        if (err) {
            return res.status(404).send({ message: "Рефреш токен недействителен." });
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
        return res.status(400).send({
            data: {
                message: {
                    content: "Пожалуйста, заполните все поля.",
                    type: "error",
                },
            },
        });
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
            return res.status(500).send({
                data: {
                    message: {
                        content: "Ошибка сервера.",
                        type: "error",
                    },
                    error: error.toString(),
                },
            });
        }
        const user = result.rows[0];
        return res.status(201).send({
            data: {
                message: {
                    content: "Пользователь создан успешно.",
                    type: "success",
                },
                user,
            },
        });
    });
});

app.get("/admin/data/users", verifyToken_bnd, verifyAdmin_bnd, (req, res) => {
    const query = 'SELECT * FROM "Users"';
    pool.query(query, (error, result) => {
        if (error) {
            console.error(error);
            return res.status(500).send({
                data: {
                    message: {
                        content: "Ошибка сервера.",
                        type: "error",
                    },
                    error: error.toString(),
                },
            });
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
                return res.status(500).send({
                    data: {
                        message: {
                            content: "Ошибка сервера.",
                            type: "error",
                        },
                        error: error.toString(),
                    },
                });
            }
            if (!result.rows.length) {
                return res.status(404).send({
                    data: {
                        message: {
                            content: "Пользователь не найден.",
                            type: "error",
                        },
                    },
                });
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
            return res.status(400).send({
                data: {
                    message: {
                        content: "Пожалуйста, заполните все поля.",
                        type: "error",
                    },
                },
            });
        }
        const hashedPassword = bcrypt.hashSync(password, 8);
        const query =
            'UPDATE "Users" SET username = $1, password = $2, role = $3 WHERE id = $4 RETURNING *';
        const values = [username, hashedPassword, role, id];
        pool.query(query, values, (error, result) => {
            if (error) {
                return res.status(500).send({
                    data: {
                        message: {
                            content: "Ошибка сервера.",
                            type: "error",
                        },
                        error: error.toString(),
                    },
                });
            }
            if (!result.rows.length) {
                return res.status(404).send({
                    data: {
                        message: {
                            content: "Пользователь не найден.",
                            type: "error",
                        },
                    },
                });
            }
            const user = result.rows[0];
            return res.status(200).send({
                data: {
                    message: {
                        content: "Данные пользователя обновлены успешно.",
                        type: "error",
                    },
                    user,
                },
            });
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
                return res.status(500).send({
                    data: {
                        message: {
                            content: "Ошибка сервера.",
                            type: "error",
                        },
                        error: error.toString(),
                    },
                });
            }
            if (!result.rows.length) {
                return res.status(404).send({
                    data: {
                        message: {
                            content: "Пользователь не найден.",
                            type: "error",
                        },
                    },
                });
            }
            const user = result.rows[0];
            return res.status(200).send({
                data: {
                    message: {
                        content: "Пользователь удален успешно.",
                        type: "error",
                    },
                    user,
                },
            });
        });
    }
);

app.post("/auth", verifyToken_bnd, (req, res) => {
    console.log("AUTH");
    // const cookie = cookies.parse(req.headers.cookie);
    const { acs: access_token = req.cookies.acs } = req.session;

    console.log(access_token);

    jwt.verify(access_token, config.tokens.access.secretKey, (err, decoded) => {
        // if (err) {
        //     return res.status(401).send({ message: "Токен недействителен" });
        // }

        // console.log(decoded);

        // if (decoded.rememberBrowser === 0) {
        //     return res.status(401).send({ message: "Токен был действителен для одной сессии" });
        // }

        const query = 'SELECT * FROM "Users" WHERE id = $1';
        const values = [decoded.id];
        pool.query(query, values, (error, result) => {
            if (error) {
                return res.status(500).send({
                    data: {
                        message: {
                            content: "Ошибка сервера.",
                            type: "error",
                        },
                        error: error.toString(),
                    },
                });
            }
            if (!result.rows.length) {
                return res.status(404).send({
                    data: {
                        message: {
                            content: "Пользователь не найден.",
                            type: "error",
                        },
                    },
                });
            }
            const user = result.rows[0];

            // if (decoded.rememberBrowser === 2) {
            //     const newACS = generateAccessToken(decoded.id, 0);
            //     const newRFS = generateRefreshToken(decoded.id, 0);

            //     res.cookie("acs", newACS, {
            //         maxAge: config.tokens.access.expiresIn * 1000,
            //         sameSite: "strict",
            //         expires: new Date(
            //             new Date().getTime() + config.tokens.access.expiresIn * 1000
            //         ).toUTCString(),
            //     });
            //     res.cookie("rfs", newRFS, {
            //         maxAge: config.tokens.access.expiresIn * 1000,
            //         sameSite: "strict",
            //         expires: new Date(
            //             new Date().getTime() + config.tokens.refresh.expiresIn * 1000
            //         ).toUTCString(),
            //     });
            // }

            return res.status(200).send({
                data: {
                    loggedIn: true,
                    info: {
                        id: user.id,
                        username: user.username,
                        avatarUrl: user.avatar_url,
                        email_confirmed: user.email_confirmed,
                        status: user.status,
                        role: user.role,
                    },
                },
            });
        });
    });
});

app.post("/auth/two-step", (req, res) => {
    const { user_id, confirmCode } = req.body;
    const rememberBrowser = req.headers["remember-browser"] === "true";
    // console.log("headers: ", req.headers);

    if (confirmCodes[user_id].confirmCode !== confirmCode) {
        return res.status(404).send({
            data: {
                auth: false,
                message: {
                    content: "Код подтверждения введён неверно или его срок истек.",
                    type: "error",
                },
            },
        });
    }

    delete confirmCodes[user_id];

    // const query = 'UPDATE "Users" SET email_confirmed =$1 WHERE id = $2';
    // const values = [true, user_id];
    // pool.query(query, values, (error, result) => {
    // if (error) {
    //     console.error(error);

    //     return res.status(500).send({
    //         message: "Ошибка сервера.",
    //         error: error.toString(),
    //         data: {
    //             auth: false,
    //             access_token: null,
    //             refresh_token: null
    //         }
    //     });
    // }

    const accessToken = generateAccessToken(user_id, rememberBrowser ? 1 : 2);
    const refreshToken = generateRefreshToken(user_id, rememberBrowser ? 1 : 2);

    console.log(rememberBrowser);

    if (rememberBrowser) {
        res.cookie("acs", accessToken, {
            maxAge: config.tokens.access.expiresIn * 1000,
            sameSite: "strict",
            expires: new Date(
                new Date().getTime() + config.tokens.access.expiresIn * 1000
            ).toUTCString(),
            session,
        });

        res.cookie("rfs", refreshToken, {
            maxAge: config.tokens.refresh.expiresIn * 1000,
            sameSite: "strict",
            expires: new Date(
                new Date().getTime() + config.tokens.refresh.expiresIn * 1000
            ).toUTCString(),
        });
    } else {
        req.session.acs = accessToken;
        req.session.rfs = refreshToken;
    }

    return res.status(200).send({
        data: {
            auth: true,
            access_token: accessToken,
            refresh_token: refreshToken,
        },
    });
    // });
});

app.post("/complaint/create", verifyToken_bnd, (req, res) => {
    const { access_token, complaint } = req.body;
    const { reason, description, creator_id, to_message_id, target_id, room_id } =
    complaint;

    jwt.verify(access_token, config.tokens.access.secretKey, (err, decoded) => {
        // if (err) {
        //     return res.status(401).send({ message: "Токен недействителен" });
        // }

        const query =
            'INSERT INTO "Complaints" (reason,description,creator_id,to_message_id,target_id,room_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *';
        const values = [
            reason,
            description,
            creator_id,
            to_message_id,
            target_id,
            room_id,
        ];
        pool.query(query, values, (error, result) => {
            if (error) {
                return res.status(500).send({
                    data: {
                        message: {
                            content: "Ошибка сервера.",
                            type: "error",
                        },
                        error: error.toString(),
                    },
                });
            }

            const complaintRes = result.rows[0];

            return res.status(200).send({
                data: {
                    complaint: complaintRes,
                },
            });
        });
    });
});

app.post("/admin/complaints", verifyAdmin_bnd, (req, res) => {
    const { offset = 0, limit = 20, closed = null } = req.body;
    console.log(req.query);

    const query = `
    SELECT *
FROM "Complaints"
${closed===null?"":"WHERE closed = "+(closed?"TRUE":"FALSE")}
ORDER BY id
OFFSET $1
LIMIT $2
`;
    console.log(query);
    const values = [offset, limit];
    pool.query(query, values, async(error, result) => {
        if (error) {
            console.log('error');
            console.error(error);
            return res.status(500).send();
        }

        const query = `SELECT COUNT(*)
        FROM "Complaints"
        ${closed===null?"":"WHERE closed = "+(closed?"TRUE":"FALSE")}`;
        const values = [];
        pool.query(query, values, async(error, countResult) => {
            if (error) {
                console.error(error);
                return res.status(500).send();
            }
            res.send({
                data: {
                    complaints: result.rows,
                    offset,
                    closed,
                    limit,
                    count: parseInt(countResult.rows[0].count)
                }
            });
        });
    });
});

app.get("/admin/complaints/:id", verifyAdmin_bnd, (req, res) => {
    const id = parseInt(req.url.split("/").reverse()[0]);

    const query = 'SELECT * FROM "Complaints" WHERE id = $1';
    const values = [id];
    pool.query(query, values, async(error, result) => {
        if (error) {
            return res.status(500).send({
                data: {
                    message: {
                        content: "Ошибка сервера.",
                        type: "error",
                    },
                    error: error.toString(),
                },
            });
        }

        res.send({
            data: {
                complaint: result.rows[0]
            }
        })
    });
});

app.post("/auth/logout", verifyToken_bnd, (req, res) => {
    res.clearCookie("acs");
    res.clearCookie("rfs");
    req.session.destroy();

    return res.status(200).send();
});

app.get("/getProfile", verifyToken_bnd, (req, res) => {
    const { id } = req.user;

    console.log(id);

    const query = 'SELECT * FROM "Users" WHERE id = $1';
    const values = [id];
    pool.query(query, values, async(error, result) => {
        if (error) {
            return res.status(500).send({
                data: {
                    message: {
                        content: "Ошибка сервера.",
                        type: "error",
                    },
                    error: error.toString(),
                },
            });
        }

        if (result.rows.length === 0) {
            return res.status(500).send({
                data: {
                    message: {
                        content: "Пользователь не найден.",
                        type: "error",
                    },
                },
            });
        }

        const response = {
            data: {
                changeableData_public: {
                    email: result.rows[0].email,
                    country: result.rows[0].country,
                    city: result.rows[0].city,
                    language: result.rows[0].language,
                    age: result.rows[0].age,
                    gender: result.rows[0].gender,
                    avatar_url: result.rows[0].avatar_url,
                    username: result.rows[0].username,
                },
            },
        };

        return res.status(200).send(response);
    });
});

app.post("/checkForSameCredentials", verifyToken_bnd, (req, res) => {
    const { email = " ", username = " " } = req.body.data;

    console.log(email, username);

    const query = 'SELECT * FROM "Users" WHERE email = $1 OR username = $2';
    const values = [email, username];
    pool.query(query, values, async(error, result) => {
        if (error) {
            return res.status(500).send({
                data: {
                    message: {
                        content: "Server error.",
                        type: "error",
                    },
                    error: error.toString(),
                },
            });
        }

        return res.status(200).send({
            data: {
                canChoose: result.rows.length === 0,
            },
        });
    });
});

app.post("/changePassword", verifyToken_bnd, (req, res) => {
    const { id } = req.user;
    const { currentPassword, newPassword } = req.body.data;

    if (!currentPassword || !newPassword) {
        return res.status(400).send({
            data: {
                message: {
                    content: "Пожалуйста, заполните все поля.",
                    type: "error",
                },
            },
        });
    }

    const query = 'SELECT * FROM "Users" WHERE id = $1';
    const values = [id];
    pool.query(query, values, async(error, result) => {
        if (error) {
            return res.status(500).send({
                data: {
                    message: {
                        content: "Ошибка сервера.",
                        type: "error",
                    },
                    error: error.toString(),
                },
            });
        }
        if (!result.rows.length) {
            return res.status(404).send({
                data: {
                    message: {
                        content: "Пользователь не найден.",
                        type: "error",
                    },
                },
            });
        }
        const passwordIsValid = bcrypt.compareSync(
            currentPassword,
            result.rows[0].password_hash
        );
        if (!passwordIsValid) {
            return res.status(401).send({
                data: {
                    message: {
                        content: "Неверный пароль.",
                        type: "error",
                    },
                },
                ok: false,
            });
        }

        const hashedPassword = bcrypt.hashSync(newPassword, 8);

        const updatePasswordQuery =
            'UPDATE "Users" SET password_hash = $1 WHERE id = $2';
        const updatePasswordValues = [hashedPassword, id];
        pool.query(updatePasswordQuery, updatePasswordValues, (err, result) => {
            if (err) {
                return res.status(500).send({
                    ok: false,
                    data: {
                        message: {
                            content: "Ошибка на сервере",
                            type: "error",
                        },
                        error: err.toString(),
                    },
                });
            }

            return res.status(200).send({
                ok: true,
            });
        });
    });
});

app.post("/changePersonalInfo", verifyToken_bnd, (req, res) => {
    const { id } = req.user;
    const { email, country, city, language, age, gender } = req.body.data;

    const query = 'SELECT * FROM "Users" WHERE id = $1';
    const values = [id];
    pool.query(query, values, (err, result) => {
        const user = result.rows[0];

        if (err) {
            return res.status(500).send({
                ok: false,
                data: {
                    message: {
                        content: "Ошибка на сервере",
                        type: "error",
                    },
                    error: err.toString(),
                },
            });
        }

        let isEmailChanging = email !== user.email;

        if (email !== user.email) {
            const query = 'SELECT * FROM "Users" WHERE email = $1';
            const values = [email];
            pool.query(query, values, (err, result) => {
                if (err) {
                    return res.status(500).send({
                        ok: false,
                        data: {
                            message: {
                                content: "Ошибка на сервере",
                                type: "error",
                            },
                            error: err.toString(),
                        },
                    });
                }

                if (result.rows.length > 0) {
                    return res.status(500).send({
                        ok: false,
                        data: {
                            message: {
                                content: "Пользователь с таким email уже существует",
                                type: "error",
                            },
                        },
                    });
                }

                sendConfirmLink(email, "email_change", {
                    email,
                });
            });
        }

        if (!res.writableFinished) {
            const query =
                'UPDATE "Users" SET country = $2, city = $3, language = $4, age = $5, gender = $6 WHERE id = $1';
            const values = [id, country, city, language, age, gender];
            console.log(values);
            pool.query(query, values, (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send({
                        ok: false,
                        data: {
                            message: {
                                content: "Ошибка на сервере",
                                type: "error",
                            },
                            error: err.toString(),
                        },
                    });
                }

                return res.status(200).send({
                    ok: true,
                    data: {
                        ...(isEmailChanging && {
                            message: {
                                content: "Confirm email",
                                type: "success",
                            },
                        }),
                    },
                });
            });
        }
    });
});

app.post("/email-confirm", verifyToken_bnd, (req, res) => {
    const { token } = req.body.data;
    const { id } = req.user;

    jwt.verify(token, config.tokens.other.secretKey, (err, decoded) => {
        if (err) {
            return res.status(500).send({
                ok: false,
                data: {
                    message: {
                        content: "Token is invalid",
                        type: "error",
                    },
                    error: err.toString(),
                },
            });
        }

        const ctobj = confirmTokens[decoded.id];

        if (!ctobj) {
            return res.status(500).send({
                ok: false,
                data: {
                    message: {
                        content: "Time is over",
                        type: "error",
                    },
                },
            });
        }

        console.log(ctobj);

        const query = 'UPDATE "Users" SET email = $1 WHERE id = $2';
        const values = [ctobj.data.email, id];
        pool.query(query, values, (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send({
                    ok: false,
                    data: {
                        message: {
                            content: "Ошибка на сервере",
                            type: "error",
                        },
                        error: err.toString(),
                    },
                });
            }

            delete confirmTokens[decoded.id];

            return res.status(200).send({
                ok: true,
            });
        });
    });
});

app.post("/changeAnchatId", verifyToken_bnd, (req, res) => {
    const { id } = req.user;
    const { username } = req.body.data;

    const query = 'SELECT * FROM "Users" WHERE username = $1';
    const values = [username];
    pool.query(query, values, (err, result) => {
        if (err) {
            return res.status(500).send({
                ok: false,
                data: {
                    message: {
                        content: "Ошибка на сервере",
                        type: "error",
                    },
                    error: err.toString(),
                },
            });
        }

        if (result.rows.length > 0) {
            if (result.rows[0].id === id) {
                return res.status(409).send({
                    ok: false,
                    data: {
                        message: {
                            content: `Вы не можете изменить свой никнейм на уже заданный`,
                            type: "warning",
                        },
                    },
                });
            } else {
                return res.status(409).send({
                    ok: false,
                    data: {
                        message: {
                            content: `Пользователь с таким именем уже зарегистри
                        рован`,
                            type: "warning",
                        },
                    },
                });
            }
        }

        const updQuery = 'UPDATE "Users" SET username = $1 WHERE id = $2';
        const updVales = [username, id];
        pool.query(updQuery, updVales, (err, result) => {
            if (err) {
                return res.status(500).send({
                    ok: false,
                    data: {
                        message: {
                            content: "Ошибка на сервере",
                            type: "error",
                        },
                        error: err.toString(),
                    },
                });
            }
            return res.status(200).send();
        });
    });
});

app.post("/ping", (req, res) => {
    console.log(req.body);
    res.status(200).send();
});

////////////////////////////

app.listen(config.server.PORT, () => {
    console.log(`Сервер запущен на порту ${config.server.PORT}.`);
});