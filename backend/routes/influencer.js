const express = require('express');
const router = express.Router();
const influencerController = require('../controllers/influencerController');
const financeController = require('../controllers/influencerFinanceController');
const instagramController = require('../controllers/instagramController');
const campaignRequestController = require('../controllers/campaignRequestController');
const notificationController = require('../controllers/notificationController');
const InfluencerProfile = require('../models/InfluencerProfile');
const { getInfluencerAnalytics } = require('../services/brandInfluencerAnalyticsService');
const { buildInfluencerPerformanceReport } = require('../services/influencerPerformanceService');
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
router.get('/instagram/analytics/60', async (req, res, next) => {
    try {
        const profile = await InfluencerProfile.findOne({
            $or: [
                { userId: req.user._id },
                req.user?.influencerProfileId ? { _id: req.user.influencerProfileId } : null,
            ].filter(Boolean),
        }).select('_id userId').lean();
        if (!profile) {
            return res.status(404).json({ success: false, message: 'Influencer profile not found' });
        }

        const result = await getInfluencerAnalytics({
            id: profile._id,
            period: 60,
        });

        return res.json({
            success: true,
            ...result,
        });
    } catch (error) {
        next(error);
    }
});
router.get('/instagram/media', instagramController.getMedia);
router.post('/instagram/post-lookup', instagramController.lookupPostByUrl);

router.get('/performance', async (req, res, next) => {
    try {
        const profile = await InfluencerProfile.findOne({
            $or: [
                { userId: req.user._id },
                req.user?.influencerProfileId ? { _id: req.user.influencerProfileId } : null,
            ].filter(Boolean),
        }).select('_id userId').lean();
        if (!profile) {
            return res.status(404).json({ success: false, error: 'Influencer profile not found' });
        }

        const report = await buildInfluencerPerformanceReport({
            influencerProfileId: profile._id,
            influencerUserId: profile.userId,
        });

        return res.json({
            success: true,
            ...report,
        });
    } catch (error) {
        next(error);
    }
});

// ── Campaign Requests (incoming) ──
router.get('/requests', campaignRequestController.getInfluencerRequests);
router.patch('/requests/:id', campaignRequestController.respondToRequest);

// ── Verifications (Completed Collaborations) ───────────────────────
router.get('/verifications', campaignRequestController.getInfluencerVerifications);

// ── Earnings & Cashouts ───────────────────────────────────────────
router.get('/earnings', financeController.getEarnings);
router.get('/cashouts', financeController.getCashouts);
router.post('/cashout', financeController.requestCashout);

// ── Notifications ──
router.get('/notifications', notificationController.getNotifications);
router.get('/notifications/count', notificationController.getUnreadCount);
router.patch('/notifications/:id/read', notificationController.markAsRead);
router.patch('/notifications/read-all', notificationController.markAllAsRead);

module.exports = router;
