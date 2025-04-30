// Datei: users.js (im utils-Verzeichnis)
const users = [];

// Join user to chat
function userJoin(id, username, kanal, role = 'user') {
    const user = { id, username, kanal, role };

    users.push(user);

    return user;
}

// Get current user
function getCurrentUser(id) {
    return users.find((user) => user.id === id);
}

// Get user by name
function getUserByName(username) {
    return users.find((user) => user.username === username);
}

// User leaves chat
function userLeave(id) {
    const index = users.findIndex((user) => user.id === id);

    if (index !== -1) {
        return users.splice(index, 1)[0];
    }
}

// Get kanal users (all users in a kanal)
function getKanalUsers(kanal) {
    return users.filter((user) => user.kanal === kanal);
}

// Get kanal operators (only users with role 'operator' in a kanal)
function getKanalOperators(kanal) {
    return users.filter((user) => user.kanal === kanal && user.role === 'operator');
}

module.exports = {
    userJoin,
    getCurrentUser,
    getUserByName,
    userLeave,
    getKanalUsers,
    getKanalOperators,
};
