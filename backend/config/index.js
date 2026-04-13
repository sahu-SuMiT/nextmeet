require('dotenv').config();

const allowedOrigins = [
    process.env.CLIENT_URL || 'http://localhost:3000',
    'https://nextmeetvideochat.vercel.app',
    'https://nextmeetvideochat-git-main-sumit-sahus-projects-83ef9bf1.vercel.app',
    'https://nextmeetvideochat-b3giy6sbo-sumit-sahus-projects-83ef9bf1.vercel.app',
];

module.exports = {
    port: process.env.PORT || 5000,
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
    corsOptions: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
    },
};
