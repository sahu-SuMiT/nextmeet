const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const config = require('./config');
const routes = require('./routes');
const registerSocketHandlers = require('./socket/socketHandler');

const app = express();
app.use(cors(config.corsOptions));
app.use(express.json());
app.use('/', routes);

const server = http.createServer(app);
const io = new Server(server, {
    cors: config.corsOptions,
});

io.on('connection', (socket) => {
    registerSocketHandlers(io, socket);
});

server.listen(config.port, () => {
    console.log(`\n🚀 NextMeet Backend running on port ${config.port}`);
    console.log(`   Health: http://localhost:${config.port}/health`);
    console.log(`   CORS:   ${config.clientUrl}\n`);
});
