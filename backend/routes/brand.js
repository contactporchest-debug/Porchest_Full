const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brandController');
const brandInstagramController = require('../controllers/brandInstagramController');
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
// Step 2 handled above as a public route
// router.get('/instagram/callback', brandInstagramController.handleCallback);
// Disconnect
router.post('/instagram/disconnect', brandInstagramController.disconnect);
// Refresh sync
router.post('/instagram/refresh', brandInstagramController.refreshSync);

// ── Brand Instagram Data ───────────────────────────────────────────
router.get('/instagram/profile', brandInstagramController.getProfile);
router.get('/instagram/analytics', brandInstagramController.getAnalytics);
router.get('/instagram/media', brandInstagramController.getMedia);
router.post('/instagram/post-lookup', brandInstagramController.lookupPostByUrl);

// ── Campaign Requests ──────────────────────────────────────────────
router.post('/requests', brandController.createRequest);
router.get('/requests', brandController.getRequests);
router.get('/requests/:id', brandController.getRequest);

// ── Verification data ──────────────────────────────────────────────
router.get('/verifications', brandController.getBrandVerifications);

// ── Influencer Discovery ───────────────────────────────────────────
router.get('/influencers', brandController.getMatchedInfluencers);
router.get('/influencers/:id/details', brandController.getInfluencerDetail);

module.exports = router;
