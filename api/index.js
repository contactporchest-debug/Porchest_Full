/**
 * Vercel Serverless Adapter for Express backend.
 *
 * All /api/* requests from the Vercel rewrite rules land here.
 * This file connects to MongoDB once (warm-instance caching) and
 * delegates every request to the Express app.
 *
 * Local dev  → backend runs normally via `backend/server.js`
 * Production → Vercel invokes this file as a serverless function
 */

// Load environment variables (works both locally and on Vercel)
require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });

const app = require('../backend/app');
const connectDB = require('../backend/config/db');

// Cache the DB connection across warm serverless invocations
let dbConnected = false;

module.exports = async (req, res) => {
    try {
        if (!dbConnected) {
            await connectDB();
            dbConnected = true;
        }
    } catch (err) {
        console.error('DB connection failed:', err.message);
        return res.status(500).json({ success: false, message: 'Database connection error' });
    }

    return app(req, res);
};
