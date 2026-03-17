const express = require('express');
const router = express.Router();
const influencerController = require('../controllers/influencerController');
const instagramController = require('../controllers/instagramController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Public callback — handles redirect from Meta/Facebook
router.get('/instagram/callback', instagramController.handleCallback);

router.use(authMiddleware, roleMiddleware('influencer'));

// Profile
router.get('/dashboard', influencerController.getDashboard);
router.get('/profile', influencerController.getProfile);
router.put('/profile', influencerController.updateProfile);

// ── Instagram OAuth ──
router.get('/instagram/connect', instagramController.initiateConnect);
router.post('/instagram/disconnect', instagramController.disconnect);
router.post('/instagram/refresh', instagramController.refreshSync);

// ── Instagram Data ──
router.get('/instagram/profile', instagramController.getProfile);
router.get('/instagram/analytics', instagramController.getAnalytics);
router.get('/instagram/media', instagramController.getMedia);

module.exports = router;
