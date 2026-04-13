const { joinRoom, leaveRoom, getRoomBySocket, findExistingUser, removeSocket } = require('../controllers/roomController');

const registerSocketHandlers = (io, socket) => {
    socket.on('join room', ({ roomID, user }) => {
        const existingSocketId = findExistingUser(roomID, user?.uid);
        if (existingSocketId && existingSocketId !== socket.id) {
            const oldSocket = io.sockets.sockets.get(existingSocketId);
            if (oldSocket) {
                oldSocket.emit('duplicate session', {
                    message: 'You joined from another tab. This session has been disconnected.',
                });
                oldSocket.leave(roomID);
                setTimeout(() => {
                    oldSocket.disconnect(true);
                }, 1000);
            }
            removeSocket(existingSocketId);
            socket.to(roomID).emit('user left', existingSocketId);
        }

        socket.join(roomID);
        const existingUsers = joinRoom(roomID, socket.id, user);
        socket.emit('all users', existingUsers);
    });

    socket.on('sending signal', ({ userToSignal, callerID, signal, user }) => {
        io.to(userToSignal).emit('user joined', {
            signal,
            callerID,
            user,
        });
    });

    socket.on('returning signal', ({ signal, callerID }) => {
        io.to(callerID).emit('receiving returned signal', {
            signal,
            id: socket.id,
        });
    });

    socket.on('video permission', (payload) => {
        const roomID = getRoomBySocket(socket.id);
        if (roomID) {
            socket.to(roomID).emit('video permission', payload);
        }
    });

    socket.on('disconnect', () => {
        const result = leaveRoom(socket.id);
        if (result) {
            socket.to(result.roomID).emit('user left', socket.id);
        }
    });
};

module.exports = registerSocketHandlers;
