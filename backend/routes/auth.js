const express = require('express');
const router = express.Router();
const { register, login, getMe, verifyOTP, resendOTP, googleAuth, logout } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { validateAuthRequest } = require('../middleware/validateRequest');

router.post('/register', validateAuthRequest('register'), register);
router.post('/login', validateAuthRequest('login'), login);
router.post('/google', validateAuthRequest('google'), googleAuth);
router.post('/verify-otp', validateAuthRequest('verify-otp'), verifyOTP);
router.post('/resend-otp', validateAuthRequest('resend-otp'), resendOTP);
router.get('/me', authMiddleware, getMe);
router.post('/logout', authMiddleware, logout);

module.exports = router;
