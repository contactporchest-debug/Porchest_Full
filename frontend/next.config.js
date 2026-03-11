/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
    images: {
        domains: ['api.dicebear.com', 'ui-avatars.com'],
    },
    // Tell Next.js NOT to bundle these server-only packages
    // (they live in backend/node_modules and are required at runtime via pages/api)
    experimental: {
        serverComponentsExternalPackages: [
            'mongoose',
            'express',
            'bcryptjs',
            'jsonwebtoken',
            'nodemailer',
            'cors',
            'socket.io',
        ],
    },
    webpack: (config) => {
        config.resolve.alias['@'] = path.resolve(__dirname);
        // Suppress optional native module warnings from mongodb/mongoose
        config.resolve.fallback = {
            ...config.resolve.fallback,
            aws4: false,
            'mongodb-client-encryption': false,
            kerberos: false,
            snappy: false,
            '@mongodb-js/zstd': false,
            '@aws-sdk/credential-providers': false,
            'gcp-metadata': false,
            socks: false,
        };
        return config;
    },
};

module.exports = nextConfig;
