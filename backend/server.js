require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { initScheduler } = require('./utils/scheduler');
const ensureAdminUser = require('./utils/ensureAdminUser');
const { ensureDemoInfluencers } = require('./utils/ensureDemoInfluencers');
const socketIO = require('socket.io');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIO(server, {
    cors: {
        origin: [
            'http://localhost:3000',
            'http://localhost:3001',
            process.env.FRONTEND_URL,
            /\.vercel\.app$/,
            /\.porchest\.com$/,
        ],
        credentials: true,
    },
    transports: ['websocket', 'polling'],
});

// Make io accessible to routes/controllers via app.locals
app.locals.io = io;

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`[Socket.IO] User connected: ${socket.id}`);

    // User joins their personal room (e.g., room: "user-{userId}")
    socket.on('join-user-room', (userId) => {
        socket.join(`user-${userId}`);
        console.log(`[Socket.IO] User ${userId} joined personal room`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`[Socket.IO] User disconnected: ${socket.id}`);
    });
});

connectDB().then(() => {
    return ensureAdminUser();
}).then(() => {
    return ensureDemoInfluencers();
}).then(() => {
    // Initialize scheduled cron jobs
    initScheduler();

    server.listen(PORT, () => {
        console.log(`\n🚀 Porchest API running on http://localhost:${PORT}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
    });
});
