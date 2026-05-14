const express = require('express');
const router = express.Router();
const SoftwareClientProfile = require('../models/SoftwareClientProfile');
const authMiddleware = require('../middleware/authMiddleware');

// @route   GET /api/client/profile
// @desc    Get current software client profile
// @access  Private (software-client only)
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'software-client') {
            return res.status(403).json({ message: 'Access denied. Software clients only.' });
        }

        const profile = await SoftwareClientProfile.findOne({ userId: req.user._id });
        if (!profile) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        res.json({ profile });
    } catch (err) {
        console.error('Error fetching software client profile:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
