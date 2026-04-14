const rooms = {};
const socketToRoom = {};

const findExistingUser = (roomID, uid) => {
    if (!rooms[roomID] || !uid) return null;
    const existing = rooms[roomID].find((u) => u.user?.uid === uid);
    return existing ? existing.userId : null;
};

const removeSocket = (socketId) => {
    const roomID = socketToRoom[socketId];
    if (!roomID || !rooms[roomID]) return null;
    rooms[roomID] = rooms[roomID].filter((u) => u.userId !== socketId);
    delete socketToRoom[socketId];
    if (rooms[roomID].length === 0) {
        delete rooms[roomID];
    }
    return roomID;
};

const joinRoom = (roomID, socketId, user) => {
    if (!rooms[roomID]) {
        rooms[roomID] = [];
    }
    rooms[roomID] = rooms[roomID].filter((u) => u.userId !== socketId);
    const existingUsers = [...rooms[roomID]];
    rooms[roomID].push({ userId: socketId, user });
    socketToRoom[socketId] = roomID;
    return existingUsers;
};

const leaveRoom = (socketId) => {
    const roomID = socketToRoom[socketId];
    if (!roomID || !rooms[roomID]) return null;
    rooms[roomID] = rooms[roomID].filter((u) => u.userId !== socketId);
    delete socketToRoom[socketId];
    if (rooms[roomID].length === 0) {
        delete rooms[roomID];
    }
    return { roomID, remainingUsers: rooms[roomID] || [] };
};

const getRoomBySocket = (socketId) => {
    return socketToRoom[socketId];
};

const getUsersInRoom = (roomID) => {
    return rooms[roomID] || [];
};

module.exports = {
    joinRoom,
    leaveRoom,
    getRoomBySocket,
    getUsersInRoom,
    findExistingUser,
    removeSocket,
};
