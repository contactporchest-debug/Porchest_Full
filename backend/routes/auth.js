const express = require('express');
const router = express.Router();
const { register, login, getMe, verifyOTP, resendOTP } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.get('/me', authMiddleware, getMe);

module.exports = router;
