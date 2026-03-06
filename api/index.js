/**
 * Vercel Serverless Adapter for Express backend.
 * This file wraps the Express app so Vercel can run it as a serverless function.
 * All /api/* requests from the Vercel routing rules land here.
 *
 * Local dev: the backend still runs as a normal Express server via server.js
 * Production (Vercel): this file is the serverless entry point
 */
const app = require('../backend/app');

// Ensure DB is connected before handling requests (serverless-safe)
const connectDB = require('../backend/config/db');

let dbConnected = false;

module.exports = async (req, res) => {
    if (!dbConnected) {
        await connectDB();
        dbConnected = true;
    }
    return app(req, res);
};
