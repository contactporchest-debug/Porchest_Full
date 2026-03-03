const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brandController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware, roleMiddleware('brand'));

// Dashboard & Profile
router.get('/dashboard', brandController.getDashboard);
router.put('/profile', brandController.updateProfile);

// Campaign Requests (structured collaboration documents)
router.post('/requests', brandController.createRequest);
router.get('/requests', brandController.getRequests);
router.get('/requests/:id', brandController.getRequest);

// Verification data (post-admin-approval)
router.get('/verifications', brandController.getBrandVerifications);

// Influencer discovery
router.get('/influencers', brandController.getMatchedInfluencers);

// Legacy campaign CRUD (kept for reference)
router.post('/campaigns', brandController.createCampaign);
router.get('/campaigns', brandController.getCampaigns);
router.put('/campaigns/:id', brandController.updateCampaign);

module.exports = router;
