const express = require('express');
const router = express.Router();
const { register, login, getMe, verifyOTP, resendOTP, googleAuth } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.get('/me', authMiddleware, getMe);

module.exports = router;
