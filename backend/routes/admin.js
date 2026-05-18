const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {
    getStats,
    getUsers,
    updateUserStatus,
    updateUserRole,
    deleteUser,
    getRequests,
    getPayments,
    getVerificationQueue,
    reviewVerification,
    verifyPayment,
    rejectPayment,
} = require('../controllers/adminController');
const {
    getFraudDetection,
    analyzeFraud,
    requestFraudVerification,
    flagFraudInfluencers,
    hardDeleteFraudInfluencers,
} = require('../controllers/adminFraudController');
const adminCampaignController = require('../controllers/adminCampaignController');
const cashoutController = require('../controllers/cashoutController');

// All admin routes require authentication + admin role
router.use(authMiddleware, roleMiddleware('admin'));

// ── Stats ──────────────────────────────────────────────
router.get('/stats', getStats);

// ── Users ──────────────────────────────────────────────
router.get('/users',                   getUsers);
router.patch('/users/:id/status',      updateUserStatus);
router.patch('/users/:id/role',        updateUserRole);
router.delete('/users/:id',            deleteUser);

// ── Campaign Requests ──────────────────────────────────
router.get('/requests',                getRequests);

// ── Payments ───────────────────────────────────────────
router.get('/payments',                getPayments);
router.patch('/payments/:id/verify',   verifyPayment);
router.patch('/payments/:id/reject',   rejectPayment);

// ── Campaigns ──────────────────────────────────────────
router.get('/campaigns',               adminCampaignController.getCampaigns);
router.get('/campaigns/:id',           adminCampaignController.getCampaignById);
router.patch('/campaigns/:id/status',  adminCampaignController.updateCampaignStatus);

// ── Verification Queue ─────────────────────────────────
router.get('/verifications',           getVerificationQueue);
router.patch('/verifications/:id',     reviewVerification);

// ── Fraud Detection ────────────────────────────────────
router.get('/fraud-detection', getFraudDetection);
router.post('/fraud-detection/analyze', analyzeFraud);
router.post('/fraud-detection/request-verification', requestFraudVerification);
router.post('/fraud-detection/flag', flagFraudInfluencers);
router.delete('/fraud-detection/delete', hardDeleteFraudInfluencers);

// ── Cashouts ───────────────────────────────────────────
router.get('/cashouts',                cashoutController.listCashouts);
router.patch('/cashouts/:id',           cashoutController.reviewCashout);

module.exports = router;
