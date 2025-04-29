const moment = require('moment');

function formatMessage(username, text, from) {
    return {
        username,
        text,
        time: moment().locale('de').format('H:mm'),
        from: from,
    };
}

module.exports = formatMessage;
