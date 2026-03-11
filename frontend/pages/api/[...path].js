/**
 * Next.js catch-all API route — serverless Express adapter.
 *
 * All /api/* requests on Vercel hit this handler automatically.
 * Connects to MongoDB once (warm-instance cached) then delegates to Express.
 *
 * File: frontend/pages/api/[...path].js
 * Backend:  ../../../backend/app  (root/backend/app.js)
 */

const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '../backend/.env') });

const app = require('../../../backend/app');
const connectDB = require('../../../backend/config/db');

let isConnected = false;

export default async function handler(req, res) {
    // Connect once; reused across warm serverless invocations
    if (!isConnected) {
        try {
            await connectDB();
            isConnected = true;
        } catch (err) {
            console.error('DB connect error:', err.message);
            return res.status(500).json({ success: false, message: 'Database connection failed' });
        }
    }

    // Hand off to Express app and wait for it to finish
    return new Promise((resolve) => {
        app(req, res, (err) => {
            if (err) {
                console.error('Express handler error:', err);
                if (!res.headersSent) {
                    res.status(500).json({ success: false, message: err.message || 'Server error' });
                }
            }
            resolve();
        });
    });
}

export const config = {
    api: {
        bodyParser: false,      // Express handles body parsing itself
        externalResolver: true, // Suppress Next.js "no response sent" warnings
    },
};
