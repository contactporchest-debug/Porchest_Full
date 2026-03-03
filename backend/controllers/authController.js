const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { sendOTPEmail } = require('../utils/emailService');

const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );
};

const generateOTPCode = () => String(Math.floor(100000 + Math.random() * 900000));

// @desc    Register user (brand or influencer) — sends OTP, account stays pending
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
            // If already registered but pending verification, resend OTP
            if (existing.status === 'pending') {
                const code = generateOTPCode();
                await OTP.deleteMany({ email });
                await OTP.create({ email, code, expiresAt: new Date(Date.now() + 10 * 60 * 1000) });
                await sendOTPEmail(email, code);
                return res.status(200).json({ success: true, message: 'OTP resent. Please verify your email.', email });
            }
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        const userData = { role, email, password, status: 'pending', ...profileData };
        if (role === 'influencer' && termsAccepted) {
            userData.termsAccepted = true;
            userData.termsAcceptedAt = new Date();
        }

        await User.create(userData);

        const code = generateOTPCode();
        await OTP.create({ email, code, expiresAt: new Date(Date.now() + 10 * 60 * 1000) });
        await sendOTPEmail(email, code);

        res.status(201).json({
            success: true,
            message: 'Account created. Please check your email for the verification code.',
            email,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Verify OTP and activate account
// @route   POST /api/auth/verify-otp
exports.verifyOtp = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
        }

        const record = await OTP.findOne({ email: email.toLowerCase(), used: false }).sort({ createdAt: -1 });

        if (!record) {
            return res.status(400).json({ success: false, message: 'No active OTP found. Please request a new one.' });
        }

        if (record.expiresAt < new Date()) {
            return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
        }

        if (record.code !== String(otp)) {
            return res.status(400).json({ success: false, message: 'Incorrect OTP. Please try again.' });
        }

        record.used = true;
        await record.save();

        const user = await User.findOneAndUpdate(
            { email: email.toLowerCase() },
            { status: 'active' },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const token = generateToken(user);

        res.json({ success: true, token, user: user.toJSON() });
    } catch (error) {
        next(error);
    }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
exports.resendOtp = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required.' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ success: false, message: 'No account found with this email.' });
        }

        if (user.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Account is already verified.' });
        }

        await OTP.deleteMany({ email: email.toLowerCase() });

        const code = generateOTPCode();
        await OTP.create({ email: email.toLowerCase(), code, expiresAt: new Date(Date.now() + 10 * 60 * 1000) });
        await sendOTPEmail(email, code);

        res.json({ success: true, message: 'New OTP sent to your email.' });
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

        if (user.status === 'pending') {
            return res.status(403).json({ success: false, message: 'Please verify your email before logging in.', needsVerification: true, email: user.email });
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
