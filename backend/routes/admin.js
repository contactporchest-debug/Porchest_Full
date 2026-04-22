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
    getVerificationQueue,
    reviewVerification,
} = require('../controllers/adminController');

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

// ── Verification Queue ─────────────────────────────────
router.get('/verifications',           getVerificationQueue);
router.patch('/verifications/:id',     reviewVerification);

module.exports = router;
