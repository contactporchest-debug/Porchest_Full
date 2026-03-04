const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );
};

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
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

        // Generate OTP
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        userData.otp = otp;
        userData.otpExpires = otpExpires;
        userData.status = 'pending';
        userData.isVerified = false;

        const user = await User.create(userData);

        // Send OTP via email
        try {
            await sendEmail({
                email: user.email,
                subject: 'Verify your Porchest account',
                message: `Your OTP for account verification is: ${otp}. It expires in 10 minutes.`,
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                        <h2 style="color: #6d28d9;">Welcome to Porchest!</h2>
                        <p>Thank you for signing up. Please use the following OTP to verify your account:</p>
                        <div style="font-size: 24px; font-weight: bold; padding: 10px; background: #f3f4f6; text-align: center; border-radius: 8px; margin: 20px 0;">
                            ${otp}
                        </div>
                        <p>This code will expire in 10 minutes.</p>
                        <p>If you didn't request this, please ignore this email.</p>
                    </div>
                `
            });
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
            // We still created the user, they can request resend
        }

        res.status(201).json({
            success: true,
            message: 'Registration successful. Please verify your email with the OTP sent.',
            email: user.email
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
exports.verifyOTP = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ success: false, message: 'Email and OTP are required' });
        }

        const user = await User.findOne({
            email,
            otp,
            otpExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        user.isVerified = true;
        user.status = 'active';
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        const token = generateToken(user);

        res.json({
            success: true,
            message: 'Email verified successfully',
            token,
            user: user.toJSON()
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
exports.resendOTP = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ success: false, message: 'User is already verified' });
        }

        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();

        await sendEmail({
            email: user.email,
            subject: 'Your new Porchest verification code',
            message: `Your new OTP is: ${otp}`,
            html: `<p>Your new OTP is: <strong>${otp}</strong>. It expires in 10 minutes.</p>`
        });

        res.json({ success: true, message: 'OTP resent successfully' });
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
