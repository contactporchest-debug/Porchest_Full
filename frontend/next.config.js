/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
    images: {
        domains: ['api.dicebear.com', 'ui-avatars.com'],
    },
    // NOTE: Do NOT hardcode NEXT_PUBLIC_API_URL here.
    // It is set via Vercel Environment Variables in the dashboard.
    // For local dev, it is set in frontend/.env.local
    serverExternalPackages: [
        'mongoose',
        'express',
        'bcryptjs',
        'jsonwebtoken',
        'nodemailer',
        'cors',
        'socket.io',
    ],
    webpack: (config) => {
        config.resolve.alias['@'] = path.resolve(__dirname);
        return config;
    },
};

module.exports = nextConfig;
