const express = require('express');
const router = express.Router();
const influencerController = require('../controllers/influencerController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware, roleMiddleware('influencer'));

// Dashboard
router.get('/dashboard', influencerController.getDashboard);

// Profile (limited fields — followers/engagement locked to API)
router.put('/profile', influencerController.updateProfile);

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
