const express = require('express');
const router = express.Router();
const { register, login, getMe, verifyOtp, resendOtp } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.get('/me', authMiddleware, getMe);

module.exports = router;
