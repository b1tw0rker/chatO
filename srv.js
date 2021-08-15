const express = require("express");
const https = require("https");
const fs = require("fs");
const cors = require("cors");
const app = express();
const formatMessage = require("./utils/messages");
const { userJoin, getCurrentUser, getUserByName, userLeave, getRoomUsers } = require("./utils/users");

/**
 *
 *
 * TODO START THIS SERVER via Linux start stop script
 * https://stackoverflow.com/questions/4018154/how-do-i-run-a-node-js-app-as-a-background-service/29042953#29042953
 *
 *
 */

// https://www.section.io/engineering-education/how-to-use-cors-in-nodejs-with-express/
// http://expressjs.com/en/resources/middleware/cors.html
app.use(
    cors({
        //origin: ["https://www.section.io", "https://www.google.com/"],
        origin: "*",
    })
);

/**
 *
 * serve https
 *
 */
const Server = https.createServer(
    {
        key: fs.readFileSync("/etc/letsencrypt/live/www.bitw0rker.de/privkey.pem"),
        cert: fs.readFileSync("/etc/letsencrypt/live/www.bitw0rker.de/cert.pem"),
    },
    app
);

const io = require("socket.io")(Server);
app.use(express.static("htdocs")); // server folder 'htdocs'
const port = 3000;
const botName = "ChatBot";

io.on("connection", (socket) => {
    /**
     *
     * User joined the chat
     *
     */
    // socket.on("send-user-and-room-name", function (username, roomname) {
    // https://stackoverflow.com/questions/20632401/how-to-send-two-variables-in-one-message-using-socket-io
    socket.on("send-user-and-room-name", ({ username, room }) => {
        if (username != "" && room != "") {
            const user = userJoin(socket.id, username, room);
            const operator = getUserByName("Nick"); // Get operator Nick

            socket.join(user.room);

            // Welcome current user
            if (operator) {
                if (operator.id != socket.id) {
                    socket.emit("message", formatMessage(botName, `Willkommen ${user.username}. Ein Operator wird gesucht. Einen Augenblick...`));
                }
            } else {
                socket.emit("message", formatMessage(botName, `Willkommen ${user.username}. Ein Operator wird gesucht. Einen Augenblick...`)); // Kein Operaotr(Nick) ist online.
            }

            /**
             *
             * Send users and room info
             *
             */
            io.to(user.room).emit("roomUsers", {
                room: user.room,
                users: getRoomUsers(user.room),
            });

            /**
             * Send Sound Play
             */
            if (operator) {
                if (operator.id != socket.id) {
                    // do send a ring to my own
                    //console.log("Ring Receiver: " + operator.id);
                    io.emit("userRing", { for: operator.id });
                }
            }
        }
    });
    //console.log("✅ New User joined chat.");
    io.emit("userJoin", { for: "everyone" });

    /**
     *
     * User leaves room
     *
     */
    socket.on("disconnect", () => {
        const user = userLeave(socket.id);

        if (user) {
            io.to(user.room).emit("message", formatMessage(botName, `${user.username} hat den Chat verlassen.`));

            // Send users and room info
            io.to(user.room).emit("roomUsers", {
                room: user.room,
                users: getRoomUsers(user.room),
            });
        }
    });

    /**
     *
     * Emit some message
     *
     */
    /*     socket.on("chatMessage", (msg) => {
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit("message", formatMessage(user.username, msg));
    });
 */
    socket.on("ChatMessageOneToOne", ({ msg, ReceiversSocketId }) => {
        let receiver = "";
        const from = getCurrentUser(socket.id); // from user
        const to = getUserByName("Nick"); // to user
        if (ReceiversSocketId.length > 3) {
            receiver = ReceiversSocketId;
        } else {
            try {
                receiver = to.id;
            } catch (e) {
                socket.emit("message", formatMessage(botName, "Es ist noch kein Mitarbeiter im Chat."));
                console.log(e);
            }
        }
        try {
            console.log("✅ SEND MESSAGE: Receiver 001: " + receiver + " - Receiver 002: " + socket.id);
            io.to(receiver).to(socket.id).emit("message", formatMessage(from.username, msg, socket.id));
        } catch (e) {
            console.log(e);
        }
    });
});

/**
 *
 * Start the server
 *
 */
Server.listen(port, () => {
    console.log("Server started at port " + port);
});
