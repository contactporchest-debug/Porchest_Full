const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const analyticsController = require('../controllers/analyticsController');

const router = express.Router();

router.use(authMiddleware, roleMiddleware('admin', 'brand', 'influencer'));

router.get('/influencers', analyticsController.listInfluencers);
router.get('/influencers/:id', analyticsController.getInfluencerById);
router.post('/influencers/:id/recalculate', analyticsController.recalculateInfluencer);

module.exports = router;
