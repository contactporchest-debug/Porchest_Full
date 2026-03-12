const express = require('express');
const router = express.Router();
const influencerController = require('../controllers/influencerController');
const instagramController = require('../controllers/instagramController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware, roleMiddleware('influencer'));

// Dashboard
router.get('/dashboard', influencerController.getDashboard);

// Profile
router.get('/profile', influencerController.getProfile);
router.put('/profile', influencerController.updateProfile);

// ── Instagram OAuth ──
// Step 1: Get authorization URL (frontend will redirect to it)
router.get('/instagram/connect', instagramController.initiateConnect);
// Step 2: Meta calls this back with the code
router.get('/instagram/callback', instagramController.handleCallback);
// Disconnect
router.post('/instagram/disconnect', instagramController.disconnect);
// Refresh sync
router.post('/instagram/refresh', instagramController.refreshSync);

// ── Instagram Data ──
router.get('/instagram/profile', instagramController.getProfile);
router.get('/instagram/analytics', instagramController.getAnalytics);
router.get('/instagram/media', instagramController.getMedia);

// Campaign Requests (incoming from brands)
router.get('/requests', influencerController.getRequests);
router.patch('/requests/:id', influencerController.respondToRequest);

// Content Verification
router.post('/verify', influencerController.submitVerification);
router.get('/verifications', influencerController.getVerifications);

// Earnings
router.get('/earnings', influencerController.getEarnings);

// Cashouts
router.post('/cashout', influencerController.requestCashout);
router.get('/cashouts', influencerController.getCashouts);

module.exports = router;
