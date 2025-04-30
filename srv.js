// Datei: srv.js
const express = require('express');
const https = require('https');
const fs = require('fs');
const cors = require('cors');
const app = express();
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, getUserByName, userLeave, getKanalUsers, getKanalOperators } = require('./utils/users');

/**
 *
 *
 * START THIS SERVER via Linux start stop script
 * https://stackoverflow.com/questions/4018154/how-do-i-run-a-node-js-app-as-a-background-service/29042953#29042953
 *
 *
 */

// https://www.section.io/engineering-education/how-to-use-cors-in-nodejs-with-express/
// http://expressjs.com/en/resources/middleware/cors.html
// https://socket.io/docs/v3/handling-cors/
app.use(
    cors({
        //origin: ["https://www.host-x.de", "https://www.google.com/"],
        origin: '*',
        methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH'],
        allowedHeaders: ['my-custom-header'],
        credentials: true,
    })
);

/**
 *
 * serve https
 *
 */
const Server = https.createServer(
    {
        key: fs.readFileSync('/etc/letsencrypt/live/www.host-x.de/privkey.pem'),
        cert: fs.readFileSync('/etc/letsencrypt/live/www.host-x.de/cert.pem'),
    },
    app
);

const io = require('socket.io')(Server, {
    cors: {
        origin: ['https://www.host-x.de', 'https://www.google.com/'],
        //origin: "*",
        methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH'],
        allowedHeaders: ['my-custom-header'],
        credentials: true,
    },
});

app.use(express.static(process.cwd() + '/htdocs')); // server folder 'htdocs'
const port = 3000;
const botName = 'ChatBot';

io.on('connection', (socket) => {
    /**
     *
     * User joined the chat
     *
     * https://stackoverflow.com/questions/20632401/how-to-send-two-variables-in-one-message-using-socket-io
     *
     */
    socket.on('send-user-and-kanal-name', ({ username, kanal, role }) => {
        if (username != '' && kanal != '') {
            /** */
            // Default role to 'user' if not provided
            role = role || 'user';

            const user = userJoin(socket.id, username, kanal, role);
            // Find operators in this kanal
            const operators = getKanalOperators(kanal);

            console.log(`✅ New ${role}: ${username} joined chat.`);

            socket.join(user.kanal);

            /**
             *
             * Send Welcome message for current user
             *
             */
            if (role === 'user') {
                if (operators.length > 0) {
                    socket.emit('message', formatMessage(botName, `Willkommen ${user.username}. Ein Operator wird gesucht. Einen Augenblick...`));
                } else {
                    socket.emit('message', formatMessage(botName, `Willkommen ${user.username}. Leider ist derzeit kein Operator verfügbar.`));
                }
            }

            /**
             *
             * Send users and kanal info
             *
             */
            io.to(user.kanal).emit('kanalUsers', {
                kanal: user.kanal,
                users: getKanalUsers(user.kanal).filter((u) => u.role === 'user'),
                operators: getKanalOperators(user.kanal),
            });

            /**
             *
             * Send Sound Play to operators when a new user joins
             *
             */
            if (role === 'user') {
                operators.forEach((operator) => {
                    io.to(operator.id).emit('userRing', { for: operator.id });
                });
            }
        }
    });

    io.emit('userJoin', { for: 'everyone' });

    /**
     *
     * User leaves kanal
     *
     */
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if (user) {
            io.to(user.kanal).emit('message', formatMessage(botName, `${user.username} hat den Chat verlassen.`));

            // Send users and kanal info
            io.to(user.kanal).emit('kanalUsers', {
                kanal: user.kanal,
                users: getKanalUsers(user.kanal).filter((u) => u.role === 'user'),
                operators: getKanalOperators(user.kanal),
            });
        }
    });

    /**
     *
     * Emit some message
     *
     */
    socket.on('ChatMessageOneToOne', ({ msg, ReceiversSocketId, role }) => {
        let receiver = '';
        const from = getCurrentUser(socket.id); // from user

        if (ReceiversSocketId && ReceiversSocketId.length > 3) {
            receiver = ReceiversSocketId;
        } else {
            try {
                // Try to find an operator
                const operators = getKanalOperators(from.kanal);
                if (operators.length > 0) {
                    receiver = operators[0].id;
                } else {
                    socket.emit('message', formatMessage(botName, 'Es ist noch kein Mitarbeiter im Chat.'));
                    return;
                }
            } catch (e) {
                socket.emit('message', formatMessage(botName, 'Es ist noch kein Mitarbeiter im Chat.'));
                console.log(e);
                return;
            }
        }

        try {
            console.log('✅ SEND MESSAGE: Sender: ' + from.id + ' - Receiver: ' + receiver);
            io.to(receiver).to(socket.id).emit('message', formatMessage(from.username, msg, socket.id, from.role));
        } catch (e) {
            console.log(e);
        }
    });

    /**
     * Typing Indicator Handling
     */
    socket.on('typing', ({ username, role, receiverSocketId }) => {
        try {
            if (receiverSocketId && receiverSocketId.length > 3) {
                // Sende Typing-Indikator nur an den spezifischen Empfänger
                io.to(receiverSocketId).emit('typing', { username, role });
                console.log(`✅ TYPING: ${username} (${role}) is typing (to ${receiverSocketId})`);
            } else {
                // Wenn kein spezifischer Empfänger angegeben ist
                const user = getCurrentUser(socket.id);
                if (user) {
                    // Wenn der Tipper ein Client ist, sende an alle Operatoren im Kanal
                    if (user.role === 'user') {
                        const operators = getKanalOperators(user.kanal);
                        operators.forEach((operator) => {
                            io.to(operator.id).emit('typing', { username, role });
                        });
                        console.log(`✅ TYPING: ${username} (${role}) is typing (to all operators)`);
                    } else {
                        // Wenn der Tipper ein Operator ist, sende an den ausgewählten User
                        if (receiverSocketId) {
                            io.to(receiverSocketId).emit('typing', { username, role });
                            console.log(`✅ TYPING: ${username} (${role}) is typing (to specific user)`);
                        }
                    }
                }
            }
        } catch (e) {
            console.log('Error in typing event:', e);
        }
    });

    /**
     * Stop Typing Indicator Handling
     */
    socket.on('stopTyping', ({ username, role, receiverSocketId }) => {
        try {
            if (receiverSocketId && receiverSocketId.length > 3) {
                // Sende StopTyping-Indikator nur an den spezifischen Empfänger
                io.to(receiverSocketId).emit('stopTyping', { username, role });
                console.log(`✅ STOP TYPING: ${username} (${role}) stopped typing (to ${receiverSocketId})`);
            } else {
                // Wenn kein spezifischer Empfänger angegeben ist
                const user = getCurrentUser(socket.id);
                if (user) {
                    // Wenn der Tipper ein Client ist, sende an alle Operatoren im Kanal
                    if (user.role === 'user') {
                        const operators = getKanalOperators(user.kanal);
                        operators.forEach((operator) => {
                            io.to(operator.id).emit('stopTyping', { username, role });
                        });
                        console.log(`✅ STOP TYPING: ${username} (${role}) stopped typing (to all operators)`);
                    } else {
                        // Wenn der Tipper ein Operator ist, sende an den ausgewählten User
                        if (receiverSocketId) {
                            io.to(receiverSocketId).emit('stopTyping', { username, role });
                            console.log(`✅ STOP TYPING: ${username} (${role}) stopped typing (to specific user)`);
                        }
                    }
                }
            }
        } catch (e) {
            console.log('Error in stopTyping event:', e);
        }
    });
});

/**
 *
 * Start the server
 *
 */
Server.listen(port, () => {
    console.log('Server started at port ' + port);
});
