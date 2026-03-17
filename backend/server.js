require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { initScheduler } = require('./utils/scheduler');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

connectDB().then(() => {
    // Initialize scheduled cron jobs
    initScheduler();

    server.listen(PORT, () => {
        console.log(`\n🚀 Porchest API running on http://localhost:${PORT}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
    });
});
