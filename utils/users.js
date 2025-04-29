const users = [];

/**
 *
 * Join user to chat
 *
 */
function userJoin(id, username, room) {
    const user = { id, username, room };

    //console.log(id);

    /**
     * Get unique user from array -> by Nick
     * instead of:  users.push(user);
     */
    const index = users.findIndex((user) => user.id === id);
    if (index === -1) {
        users.push(user);
    }

    return user;
}

/**
 *
 * Get current user by id
 *
 */
function getCurrentUser(id) {
    return users.find((user) => user.id === id);
}

/**
 *
 * Get current user by Name
 *
 */
function getUserByName(username) {
    return users.find((user) => user.username === username);
}

/**
 *
 * User leaves chat
 *
 */
function userLeave(id) {
    const index = users.findIndex((user) => user.id === id);

    if (index !== -1) {
        return users.splice(index, 1)[0];
    }
}

/**
 *
 * Get room users
 *
 */
function getRoomUsers(room) {
    return users.filter((user) => user.room === room);
}

/**
 *
 */
module.exports = {
    userJoin,
    getCurrentUser,
    getUserByName,
    userLeave,
    getRoomUsers,
};
