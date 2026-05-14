const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const rawToken = req.headers['x-access-token'];
        const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
        const token = bearerToken || rawToken || (typeof authHeader === 'string' ? authHeader.trim() : '');

        if (!token) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const account = await User.findById(decoded.id);

        if (!account) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        const hydrated = account.toJSON ? account.toJSON() : account;
        if (hydrated.status === 'suspended') {
            return res.status(403).json({ success: false, message: 'Account suspended' });
        }

        const tokenVersion = Number.isFinite(Number(decoded.tokenVersion)) ? Number(decoded.tokenVersion) : 0;
        const currentTokenVersion = Number.isFinite(Number(hydrated.tokenVersion)) ? Number(hydrated.tokenVersion) : 0;
        if (tokenVersion !== currentTokenVersion) {
            return res.status(401).json({ success: false, message: 'Session expired. Please sign in again.' });
        }

        req.user = hydrated;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};

module.exports = authMiddleware;
