/**
 * Catch-all API route: wraps the Express backend as a Next.js serverless function.
 * All requests to /api/* are handled here and passed to the Express app.
 *
 * This runs on Vercel as a serverless function. The Express app is at
 * ../../backend/app relative to this file (frontend/pages/api → backend/).
 */

const app = require('../../../backend/app');
const connectDB = require('../../../backend/config/db');

let isConnected = false;

export default async function handler(req, res) {
    // Establish DB connection on first invocation (reused in warm instances)
    if (!isConnected) {
        await connectDB();
        isConnected = true;
    }

    // Pass the request to Express
    return new Promise((resolve, reject) => {
        app(req, res, (err) => {
            if (err) return reject(err);
            resolve();
        });
    });
}

export const config = {
    api: {
        // Disable Next.js body parsing — Express handles it
        bodyParser: false,
        externalResolver: true,
    },
};
