const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const brandRoutes = require('./routes/brand');
const influencerRoutes = require('./routes/influencer');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// CORS
const corsOptions = {
    origin: function (origin, callback) {
        const allowed = [
            'http://localhost:3000',
            'http://localhost:3001',
            process.env.FRONTEND_URL,
        ].filter(Boolean);

        // Allow requests with no origin (curl, Postman, server-side)
        if (!origin) return callback(null, true);

        // Allow production domain and Vercel preview deployments
        if (
            allowed.includes(origin) ||
            /\.vercel\.app$/.test(origin) ||
            /\.porchest\.com$/.test(origin)
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
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Porchest API is running 🚀', timestamp: new Date() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/brand', brandRoutes);
app.use('/api/influencer', influencerRoutes);

// 404
app.use('*', (req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use(errorHandler);

module.exports = app;
