const WebSocket = require("ws");
const jwt = require("jsonwebtoken");
const { verifyToken, jwtVerify } = require("./utils/Tokens");
const config = require("./config.json");
const pg = require("pg");

/////////////////

const dbConfig = config.dbConfig;

const pool = new pg.Pool(dbConfig);

async function poolQuery(query, values) {
    return new Promise((resolve, reject) =>
        pool
        .query(...[query, values].filter((v) => !!v))
        .then((result) => resolve(result))
        .catch((error) => reject(error))
    );
}

let rooms = [];

async function findRoom(user, ws) {
    const upref = user.preferences;

    function checkForPreferences(user_preferences, partner) {
        console.log("- - -");
        console.log(partner);
        console.log(user_preferences);
        console.log("- - -");

        const check = Object.entries(user_preferences).map(([key, val]) => {
            switch (key) {
                case "age":
                    return [
                        key,
                        val ?
                        (val[0] ? val[0] <= partner.age : true) &&
                        (val[1] ? val[1] >= partner.age : true) :
                        true,
                    ];
                default:
                    return [key, val ? partner[key] === val : true];
            }
        });
        console.log(check);
        return {
            check,
            result: check.every((item) => item[1]),
        };
    }

    const query = `SELECT r.*
    FROM "Rooms" r
    LEFT JOIN (
    SELECT ru.room_id, COUNT(ru.id) as users_count
    FROM "Room_Users" ru
    GROUP BY ru.room_id
    HAVING COUNT(ru.id) = 1
    ) ru_count ON r.id = ru_count.room_id
    LEFT JOIN "Room_Users" ru ON r.id = ru.room_id
    LEFT JOIN "Users" u ON u.id = ru.user_id
    LEFT JOIN "Users" u2 ON u2.id = $1
    LEFT JOIN "Room_Users_Preferences" up ON up.room_users_id = ru.id
    WHERE (
    ru_count.users_count = 1
    AND (
    (up.country = u2.country OR up.country IS NULL)
    AND (up.city = u2.city OR up.city IS NULL)
    AND (up.language = u2.language OR up.language IS NULL)
    AND (up.age_from <= u2.age OR up.age_from IS NULL)
    AND (up.age_to >= u2.age OR up.age_to IS NULL)
    AND (up.gender = u2.gender OR up.gender IS NULL)
    )
    AND (
    ($2 = u.country OR $2 IS NULL)
    AND ($3 = u.city OR $3 IS NULL)
    AND ($4 = u.language OR $4 IS NULL)
    AND ($5 <= u.age OR $5 IS NULL)
    AND ($6 >= u.age OR $6 IS NULL)
    AND ($7 = u.gender OR $7 IS NULL)
    )
    )
    AND (
        (r.status=1)
        AND (ru.user_id != $1)
    )
    ;
    `;
    const values = [
        user.id,
        upref.country,
        upref.city,
        upref.language,
        upref.age_from,
        upref.age_to,
        upref.gender,
    ];

    const user_obj = {
        info: {
            id: user.id,
            username: user.username,
            avatar_url: user.avatar_url,
        },
        ws,
    };

    let room = null;

    await poolQuery(query, values)
        .then(async(res) => {
            if (res.rows.length > 0) {
                room = rooms.find((r) => r.info.id === res.rows[0].id);
                room.users.push(user_obj);

                const query =
                    'INSERT INTO "Room_Users" (room_id,user_id) VALUES ($1, $2)';
                const values = [room.info.id, user.id];
                await poolQuery(query, values)
                    .then((res) => {})
                    .catch(console.error);
            } else {
                const query = 'INSERT INTO "Rooms" DEFAULT VALUES RETURNING *';
                await poolQuery(query)
                    .then(async(res) => {
                        room = {
                            info: res.rows[0],
                            users: [user_obj],
                        };

                        rooms.push(room);

                        const query =
                            'INSERT INTO "Room_Users" (room_id,user_id) VALUES ($1, $2) RETURNING *';
                        const values = [room.info.id, user.id];
                        await poolQuery(query, values)
                            .then(async(res) => {
                                const query =
                                    'INSERT INTO "Room_Users_Preferences" (room_users_id,country,city,language,gender,age_from,age_to) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *';
                                const values = [
                                    res.rows[0].id,
                                    upref.country,
                                    upref.city,
                                    upref.language,
                                    upref.gender,
                                    upref.age_from,
                                    upref.age_to,
                                ];
                                await poolQuery(query, values)
                                    .then((res) => {})
                                    .catch(console.error);
                            })
                            .catch(console.error);
                    })
                    .catch(console.error);
            }
        })
        .catch(console.error);

    // const room = rooms.find(
    //     (room) =>
    //     !room.partner &&
    //     checkForPreferences(user.preferences, room.user.prefData).result &&
    //     checkForPreferences(user.prefData, room.user.preferences).result
    // );

    return room;
}

async function removeRoom(id) {
    const room = rooms.find((room) => room.info.id === id);

    const response = {
        type: "room_closed",
        message: "Room closed",
    };

    room.users.forEach((user) => {
        user.ws.send(JSON.stringify(response));
    });

    rooms = rooms.filter((room) => room.info.id !== id);
    const query = `
    UPDATE "Rooms"
    SET status = $1
    WHERE id = $2
    `;
    const values = [3, id];
    await poolQuery(query, values);
}

function findRoomById(id) {
    return rooms.find((room) => room.info.id === id);
}

const wss = new WebSocket.Server({ port: config.server.PORT });

wss.on("connection", (ws, req) => {
    console.log("Client connected");

    let user_data = null;
    let room_id = null;

    ws.on("message", async(message) => {
        try {
            const data = JSON.parse(message);

            const tokenValidation = await verifyToken(data.data.auth.access_token);

            switch (tokenValidation.status) {
                case 401:
                    ws.send(JSON.stringify({ status: 401, message: "Invalid token" }));
                    return;
                case 403:
                    ws.send(JSON.stringify({ status: 403, message: "Forbidden" }));
                    return;
            }

            if (!user_data) {
                await jwtVerify(
                        data.data.auth.access_token,
                        config.tokens.access.secretKey
                    )
                    .then(async(decoded) => {
                        const selectedKeys = [
                            "country",
                            "city",
                            "language",
                            "age",
                            "gender",
                        ];

                        const query = 'SELECT * FROM "Users" WHERE id = $1';
                        const values = [decoded.id];
                        await poolQuery(query, values)
                            .then((result) => {
                                const user = result.rows[0];
                                user_data = {
                                    prefData: Object.fromEntries(
                                        Object.entries(user).filter(([key, value]) =>
                                            selectedKeys.includes(key)
                                        )
                                    ),
                                    username: user.username,
                                    id: user.id,
                                    avatar_url: user.avatar_url,
                                    ws,
                                };
                            })
                            .catch((error) => {
                                console.error(error);
                            });
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            }

            console.log(data.type);

            switch (data.type) {
                case "find_room":
                    {
                        if (findRoomById(room_id)) {
                            ws.send(
                                JSON.stringify({ status: 403, message: "Room already exists" })
                            );
                            break;
                        }
                        const preferences = {
                            country: null,
                            city: null,
                            language: null,
                            age_from: null,
                            age_to: null,
                            gender: null,
                            ...data.data.preferences,
                        };
                        user_data.preferences = preferences;

                        const room = await findRoom(user_data, ws);
                        console.log(room);
                        room_id = room.info.id;
                        const response = {
                            type: "room_searching",
                            message: room.users.length > 1 ? "Room found" : "Searching...",
                            data: {
                                room_found: room.users.length > 1,
                                users: room.users.map((user) => user.info),
                                room_id
                            },
                        };

                        room.users.forEach((user) => {
                            user.ws.send(JSON.stringify(response));
                        });
                        break;
                    }
                case "leave_room":
                    {
                        if (!findRoomById(room_id)) {
                            ws.send(JSON.stringify({ status: 403, message: "Room not found" }));
                            break;
                        }
                        removeRoom(room_id);
                        break;
                    }
                case "send_message":
                    {
                        console.log(room_id);
                        if (!findRoomById(room_id)) {
                            ws.send(JSON.stringify({ status: 403, message: "Room not found" }));
                            break;
                        }

                        const room = findRoomById(room_id);
                        console.log(room.info);

                        const query =
                            'INSERT INTO "Messages" (room_id,sender_id,text,to_message_id,type) VALUES ($1, $2, $3, $4, $5) RETURNING id,sender_id,text,in_room_id,to_message_id,type,timestamp';
                        const values = [
                            room_id,
                            user_data.id,
                            data.data.message.text,
                            data.data.message.to_message_id || null,
                            data.data.message.type || 0,
                        ];
                        const message_to_send = (await poolQuery(query, values)).rows[0];

                        room.users.forEach((user) => {
                            user.ws.send(
                                JSON.stringify({
                                    type: "new_message",
                                    data: {
                                        message: message_to_send,
                                    },
                                })
                            );
                        });

                        break;
                    }
            }
        } catch (error) {
            console.error(error);

            ws.send(
                JSON.stringify({
                    status: 500,
                    message: "Internal server error",
                })
            );
        }
    });

    ws.on("close", () => {
        console.log("Client disconnected");

        if (room_id) {
            const room = findRoomById(room_id);
            room && removeRoom(room.info.id);
        }
    });
});