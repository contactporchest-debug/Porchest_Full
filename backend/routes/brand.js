const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brandController');
const brandInstagramController = require('../controllers/brandInstagramController');
const campaignRequestController = require('../controllers/campaignRequestController');
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Public callback — handles redirect from Meta/Facebook
// Validation is handled via 'state' parameter inside the controller
router.get('/instagram/callback', brandInstagramController.handleCallback);

router.use(authMiddleware, roleMiddleware('brand'));

// ── Brand Dashboard & Profile ──────────────────────────────────────
router.get('/dashboard', brandController.getDashboard);
router.get('/profile', brandController.getBrandProfile);
router.put('/profile', brandController.updateProfile);

// ── Brand Instagram OAuth ──────────────────────────────────────────
// Step 1: Get Meta authorization URL
router.get('/instagram/connect', brandInstagramController.initiateConnect);
// Disconnect
router.post('/instagram/disconnect', brandInstagramController.disconnect);
// Refresh sync
router.post('/instagram/refresh', brandInstagramController.refreshSync);

router.get('/instagram/profile', brandInstagramController.getProfile);
router.get('/instagram/analytics', brandInstagramController.getAnalytics);
router.get('/instagram/media', brandInstagramController.getMedia);
router.post('/instagram/post-lookup', brandInstagramController.lookupPostByUrl);

// ── Campaign Requests ──────────────────────────────────────────────
router.post('/requests', campaignRequestController.createRequest);
router.get('/requests', campaignRequestController.getBrandRequests);
router.get('/requests/:id', campaignRequestController.getBrandRequestDetail);
router.patch('/requests/:id', campaignRequestController.brandRespondToRequest);

// ── Verifications (Completed Collaborations) ───────────────────────
router.get('/verifications', campaignRequestController.getBrandVerifications);


// ── Notifications ──────────────────────────────────────────────────
router.get('/notifications', notificationController.getNotifications);
router.get('/notifications/count', notificationController.getUnreadCount);
router.patch('/notifications/:id/read', notificationController.markAsRead);
router.patch('/notifications/read-all', notificationController.markAllAsRead);

// ── Influencer Discovery ───────────────────────────────────────────
router.get('/influencers', brandController.getMatchedInfluencers);
router.post('/influencers/matching', brandController.aiMatching);
router.get('/influencers/:id/details', brandController.getInfluencerDetail);

module.exports = router;
