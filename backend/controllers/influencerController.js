const User = require('../models/User');
const CampaignRequest = require('../models/CampaignRequest');
const VerificationSubmission = require('../models/VerificationSubmission');
const Earning = require('../models/Earning');
const Cashout = require('../models/Cashout');
const InstagramConnection = require('../models/InstagramConnection');
const InstagramAnalyticsSnapshot = require('../models/InstagramAnalyticsSnapshot');
const { validateInfluencerProfile } = require('../utils/validators');

// @desc    Influencer dashboard counts
// @route   GET /api/influencer/dashboard
exports.getDashboard = async (req, res, next) => {
    try {
        const influencerId = req.user._id;
        const [pending, accepted, rejected, completed, igConnection] = await Promise.all([
            CampaignRequest.countDocuments({ influencerId, status: 'pending' }),
            CampaignRequest.countDocuments({ influencerId, status: 'accepted' }),
            CampaignRequest.countDocuments({ influencerId, status: 'rejected' }),
            VerificationSubmission.countDocuments({ influencerId, status: 'verified' }),
            InstagramConnection.findOne({ userId: influencerId }).select('-accessToken -longLivedToken -oauthState'),
        ]);

        res.json({
            success: true,
            dashboard: {
                totalRequests: pending + accepted + rejected + completed,
                totalAccepted: accepted,
                totalRejected: rejected,
                totalCompleted: completed,
                profile: req.user,
                instagramConnection: igConnection || null,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get influencer profile (full)
// @route   GET /api/influencer/profile
exports.getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        const igConnection = await InstagramConnection.findOne({ userId: req.user._id })
            .select('-accessToken -longLivedToken -oauthState');
        const latestAnalytics = await InstagramAnalyticsSnapshot.findOne({ userId: req.user._id })
            .sort({ fetchedAt: -1 });

        res.json({
            success: true,
            user,
            instagramConnection: igConnection || null,
            latestAnalytics: latestAnalytics || null,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update influencer profile (editable fields only)
// @route   PUT /api/influencer/profile
exports.updateProfile = async (req, res, next) => {
    try {
        // Backend validation
        const { valid, errors } = validateInfluencerProfile(req.body);
        if (!valid) {
            return res.status(400).json({ success: false, message: errors.join('. '), errors });
        }

        // followers, engagementRate, avgLikes, avgComments, lastSyncedAt are API-synced — not manually editable
        const allowed = [
            'fullName', 'age', 'country', 'city', 'contactEmail', 'niche', 'bio', 'shortBio',
            'instagramUsername', 'instagramProfileURL', 'instagramDPURL', 'accountType',
            'avgPostCostUSD', 'avgReelCostUSD', 'avatar', 'profileImageURL',
            // NOTE: instagramConnected, followers, engagementRate are NOT allowed here
        ];
        const updates = {};
        allowed.forEach((field) => {
            if (req.body[field] !== undefined) updates[field] = req.body[field];
        });

        // Compute profile completion
        const merged = { ...req.user.toObject(), ...updates };
        updates.profileCompletionStatus = !!(
            merged.fullName && merged.contactEmail && merged.country &&
            merged.niche && merged.avgPostCostUSD > 0 && merged.avgReelCostUSD > 0
        );

        const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
        res.json({ success: true, user });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all incoming campaign requests (filterable by status)
// @route   GET /api/influencer/requests
exports.getRequests = async (req, res, next) => {
    try {
        const { status } = req.query;
        const filter = { influencerId: req.user._id };
        if (status) filter.status = status;

        const requests = await CampaignRequest.find(filter)
            .populate('brandId', 'companyName email industry')
            .sort({ createdAt: -1 });

        res.json({ success: true, requests });
    } catch (error) {
        next(error);
    }
};

// @desc    Accept or reject a campaign request
// @route   PATCH /api/influencer/requests/:id
exports.respondToRequest = async (req, res, next) => {
    try {
        const { status, rejectionReason } = req.body;
        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Status must be accepted or rejected' });
        }

        const request = await CampaignRequest.findOne({
            _id: req.params.id,
            influencerId: req.user._id,
            status: 'pending',
        });
        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found or already responded' });
        }

        request.status = status;
        request.respondedAt = new Date();
        if (status === 'rejected' && rejectionReason) request.rejectionReason = rejectionReason;
        await request.save();

        const populated = await request.populate('brandId', 'companyName email');
        res.json({ success: true, request: populated });
    } catch (error) {
        next(error);
    }
};

// @desc    Submit Instagram post for verification
// @route   POST /api/influencer/verify
exports.submitVerification = async (req, res, next) => {
    try {
        const { campaignRequestId, postUrl } = req.body;

        const campaignRequest = await CampaignRequest.findOne({
            _id: campaignRequestId,
            influencerId: req.user._id,
            status: 'accepted',
        });
        if (!campaignRequest) {
            return res.status(404).json({ success: false, message: 'Campaign request not found or not accepted' });
        }

        const existing = await VerificationSubmission.findOne({ campaignRequestId });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Verification already submitted for this campaign' });
        }

        const submission = await VerificationSubmission.create({
            campaignRequestId,
            influencerId: req.user._id,
            brandId: campaignRequest.brandId,
            postUrl,
        });

        res.status(201).json({ success: true, submission });
    } catch (error) {
        next(error);
    }
};

// @desc    Get own verification submissions
// @route   GET /api/influencer/verifications
exports.getVerifications = async (req, res, next) => {
    try {
        const verifications = await VerificationSubmission.find({ influencerId: req.user._id })
            .populate('campaignRequestId', 'campaignTitle agreedPrice brandId')
            .populate('brandId', 'companyName')
            .sort({ createdAt: -1 });
        res.json({ success: true, verifications });
    } catch (error) {
        next(error);
    }
};

// @desc    Get earnings summary
// @route   GET /api/influencer/earnings
exports.getEarnings = async (req, res, next) => {
    try {
        const influencerId = req.user._id;
        const earnings = await Earning.find({ influencerId })
            .populate('campaignRequestId', 'campaignTitle')
            .populate('brandId', 'companyName')
            .sort({ createdAt: -1 });

        const lifetimeTotal = earnings.reduce((sum, e) => sum + e.amount, 0);
        const totalPaid = earnings.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0);
        const totalPending = earnings.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0);

        // Available = pending earnings not yet linked to a cashout
        const pendingCashouts = await Cashout.find({ influencerId, status: { $in: ['pending', 'processed'] } });
        const cashedOut = pendingCashouts.reduce((sum, c) => sum + c.amount, 0);
        const availableForCashout = Math.max(0, totalPending - cashedOut);

        res.json({
            success: true,
            summary: { lifetimeTotal, totalPaid, totalPending, availableForCashout },
            earnings,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Request a cashout
// @route   POST /api/influencer/cashout
exports.requestCashout = async (req, res, next) => {
    try {
        const influencerId = req.user._id;
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid cashout amount' });
        }

        // Calculate available balance
        const earnings = await Earning.find({ influencerId, status: 'pending' });
        const totalPending = earnings.reduce((sum, e) => sum + e.amount, 0);
        const pendingCashouts = await Cashout.find({ influencerId, status: { $in: ['pending', 'processed'] } });
        const alreadyCashedOut = pendingCashouts.reduce((sum, c) => sum + c.amount, 0);
        const available = Math.max(0, totalPending - alreadyCashedOut);

        if (amount > available) {
            return res.status(400).json({
                success: false,
                message: `Insufficient balance. Available: $${available.toFixed(2)}`,
            });
        }

        const cashout = await Cashout.create({ influencerId, amount });
        res.status(201).json({ success: true, cashout });
    } catch (error) {
        next(error);
    }
};

// @desc    Get cashout history
// @route   GET /api/influencer/cashouts
exports.getCashouts = async (req, res, next) => {
    try {
        const cashouts = await Cashout.find({ influencerId: req.user._id }).sort({ createdAt: -1 });
        res.json({ success: true, cashouts });
    } catch (error) {
        next(error);
    }
};
