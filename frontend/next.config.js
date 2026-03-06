/** @type {import('next').NextConfig} */
const path = require('path');

// Backend URL: Render in production, localhost in local dev
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001';

const nextConfig = {
    images: {
        domains: ['api.dicebear.com', 'ui-avatars.com'],
    },
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://www.porchest.com/api',
        NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || 'https://www.porchest.com',
    },
    // Proxy all /api/* requests to the backend (server-side, no CORS issues)
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: `${BACKEND_URL}/api/:path*`,
            },
        ];
    },
    webpack: (config) => {
        config.resolve.alias['@'] = path.resolve(__dirname);
        return config;
    },
};

module.exports = nextConfig;
