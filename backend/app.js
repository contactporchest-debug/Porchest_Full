const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const brandRoutes = require('./routes/brand');
const influencerRoutes = require('./routes/influencer');
const adminRoutes = require('./routes/admin');
const instagramRoutes = require('./routes/instagramRoutes');
const trackingRoutes = require('./routes/trackingRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const pixelRoutes = require('./routes/pixelRoutes');
const analyticsRoutes = require('./routes/analytics');
const softwareClientRoutes = require('./routes/softwareClient');
const profileRoutes = require('./routes/profileRoutes');
const influencerDiscoveryRoutes = require('./routes/influencerDiscoveryRoutes');
const collaborationRoutes = require('./routes/collaborationRoutes');
const clientRoutes = require('./routes/client');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// CORS
const corsOptionsDelegate = function (req, callback) {
    const origin = req.header('Origin');
    const requestPath = req.path || '';

    // Pixel tracking must work from external brand domains, so allow it broadly.
    if (requestPath.startsWith('/api/pixel')) {
        return callback(null, {
            origin: true,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
        });
    }

    const options = {
        origin: function (requestOrigin, callback) {
            const allowed = [
                'http://localhost:3000',
                'http://localhost:3001',
                process.env.FRONTEND_URL,
            ].filter(Boolean);

            // Allow requests with no origin (curl, Postman, server-side)
            if (!requestOrigin) return callback(null, true);

            // Allow production domain and Vercel preview deployments
            if (
                allowed.includes(requestOrigin) ||
                /\.vercel\.app$/.test(requestOrigin) ||
                /\.porchest\.com$/.test(requestOrigin)
            ) {
                return callback(null, true);
            }

            // Allow all in non-production for dev flexibility
            if (process.env.NODE_ENV !== 'production') {
                return callback(null, true);
            }

            callback(new Error('Not allowed by CORS'));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    };

    callback(null, options);
};
app.use(cors(corsOptionsDelegate));
app.options('*', cors(corsOptionsDelegate));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Porchest API is running 🚀', timestamp: new Date() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/brand', brandRoutes);
app.use('/api/influencer', influencerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/instagram', instagramRoutes);
app.use('/', trackingRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/pixel', pixelRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/software-client', softwareClientRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/discover', influencerDiscoveryRoutes);
app.use('/api/collaborations', collaborationRoutes);

// 404
app.use('*', (req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use(errorHandler);

module.exports = app;
