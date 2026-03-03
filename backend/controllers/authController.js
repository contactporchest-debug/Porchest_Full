const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );
};

// @desc    Register user (brand or influencer)
// @route   POST /api/auth/register
exports.register = async (req, res, next) => {
    try {
        const { role, email, password, termsAccepted, ...profileData } = req.body;

        if (!['brand', 'influencer'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role. Must be brand or influencer.' });
        }

        if (role === 'influencer' && !termsAccepted) {
            return res.status(400).json({ success: false, message: 'You must accept the Terms & Conditions to register.' });
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        const userData = { role, email, password, ...profileData };
        if (role === 'influencer' && termsAccepted) {
            userData.termsAccepted = true;
            userData.termsAcceptedAt = new Date();
        }

        const user = await User.create(userData);
        const token = generateToken(user);

        res.status(201).json({
            success: true,
            token,
            user: user.toJSON(),
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (user.status === 'suspended') {
            return res.status(403).json({ success: false, message: 'Account suspended. Contact support.' });
        }

        const token = generateToken(user);
        res.json({ success: true, token, user: user.toJSON() });
    } catch (error) {
        next(error);
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
    res.json({ success: true, user: req.user });
};
