const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware, roleMiddleware('admin'));

// Stats & Users
router.get('/stats', adminController.getStats);
router.get('/users', adminController.getAllUsers);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.delete('/users/:id', adminController.deleteUser);

// Campaign Requests Overview
router.get('/requests', adminController.getAllRequests);

// Verification Queue
router.get('/verifications', adminController.getVerificationQueue);
router.patch('/verifications/:id', adminController.reviewVerification);


module.exports = router;
