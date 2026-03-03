const User = require('../models/User');
const Campaign = require('../models/Campaign');
const CampaignRequest = require('../models/CampaignRequest');
const VerificationSubmission = require('../models/VerificationSubmission');

// @desc    Get platform stats
// @route   GET /api/admin/stats
exports.getStats = async (req, res, next) => {
    try {
        const [totalBrands, totalInfluencers, totalAdmins, totalRequests, pendingVerifications, pendingUsers] =
            await Promise.all([
                User.countDocuments({ role: 'brand' }),
                User.countDocuments({ role: 'influencer' }),
                User.countDocuments({ role: 'admin' }),
                CampaignRequest.countDocuments(),
                VerificationSubmission.countDocuments({ status: 'pending' }),
                User.countDocuments({ status: 'pending' }),
            ]);

        res.json({
            success: true,
            stats: {
                totalBrands,
                totalInfluencers,
                totalAdmins,
                totalRequests,
                pendingVerifications,
                pendingUsers,
                totalUsers: totalBrands + totalInfluencers + totalAdmins,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all users
// @route   GET /api/admin/users
exports.getAllUsers = async (req, res, next) => {
    try {
        const { role, status, page = 1, limit = 20 } = req.query;
        const filter = {};
        if (role) filter.role = role;
        if (status) filter.status = status;

        const users = await User.find(filter)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await User.countDocuments(filter);
        res.json({ success: true, users, total, page: Number(page), pages: Math.ceil(total / limit) });
    } catch (error) {
        next(error);
    }
};

// @desc    Update user status
// @route   PATCH /api/admin/users/:id/status
exports.updateUserStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!['active', 'suspended', 'pending'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }
        const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true }).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, user });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
exports.deleteUser = async (req, res, next) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, message: 'User deleted' });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all campaign requests
// @route   GET /api/admin/requests
exports.getAllRequests = async (req, res, next) => {
    try {
        const { status } = req.query;
        const filter = status ? { status } : {};
        const requests = await CampaignRequest.find(filter)
            .populate('brandId', 'companyName email')
            .populate('influencerId', 'fullName email niche')
            .sort({ createdAt: -1 });
        res.json({ success: true, requests });
    } catch (error) {
        next(error);
    }
};

// @desc    Get verification queue
// @route   GET /api/admin/verifications
exports.getVerificationQueue = async (req, res, next) => {
    try {
        const { status = 'pending' } = req.query;
        const verifications = await VerificationSubmission.find({ status })
            .populate('influencerId', 'fullName email niche')
            .populate('brandId', 'companyName email')
            .populate('campaignRequestId', 'campaignTitle agreedPrice postingDeadline')
            .sort({ createdAt: -1 });
        res.json({ success: true, verifications });
    } catch (error) {
        next(error);
    }
};

// @desc    Approve or reject a verification submission
// @route   PATCH /api/admin/verifications/:id
exports.reviewVerification = async (req, res, next) => {
    try {
        const { status, adminNote } = req.body;
        if (!['verified', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Status must be verified or rejected' });
        }

        const submission = await VerificationSubmission.findById(req.params.id);
        if (!submission) return res.status(404).json({ success: false, message: 'Submission not found' });
        if (submission.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Already reviewed' });
        }

        submission.status = status;
        submission.adminNote = adminNote || '';
        if (status === 'verified') submission.verifiedAt = new Date();
        await submission.save();

        res.json({ success: true, submission });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all campaigns (legacy, kept for admin view)
// @route   GET /api/admin/campaigns
exports.getAllCampaigns = async (req, res, next) => {
    try {
        const campaigns = await Campaign.find()
            .populate('brandId', 'companyName email')
            .sort({ createdAt: -1 });
        res.json({ success: true, campaigns });
    } catch (error) {
        next(error);
    }
};
