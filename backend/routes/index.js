const express = require('express');
const { getUsersInRoom } = require('../controllers/roomController');

const router = express.Router();

router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'nextmeet-backend',
        timestamp: new Date().toISOString(),
    });
});

router.get('/api/rooms/:roomID', (req, res) => {
    const { roomID } = req.params;
    const users = getUsersInRoom(roomID);
    res.json({
        roomID,
        participantCount: users.length,
        participants: users.map((u) => ({
            name: u.user?.name || 'Anonymous',
            photoURL: u.user?.photoURL || null,
        })),
    });
});

module.exports = router;
