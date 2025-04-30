// Datei: messages.js (im utils-Verzeichnis)
const moment = require('moment');

function formatMessage(username, text, senderId = null, role = null) {
    return {
        username,
        text,
        time: moment().format('HH:mm'),
        senderId,
        role,
    };
}

module.exports = formatMessage;
