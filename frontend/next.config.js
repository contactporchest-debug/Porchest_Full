/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
    images: {
        domains: ['api.dicebear.com', 'ui-avatars.com'],
    },
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://www.porchest.com/api',
        NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || 'https://www.porchest.com',
    },
    // Tell Next.js NOT to webpack-bundle these packages — they are resolved
    // at runtime from node_modules (prevents the aws4/mongodb bundling warning)
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
