const Campaign = require('../models/Campaign');
const CampaignRequest = require('../models/CampaignRequest');
const VerificationSubmission = require('../models/VerificationSubmission');
const User = require('../models/User');
const { matchInfluencers } = require('../utils/aiMatching');

// @desc    Brand dashboard overview
// @route   GET /api/brand/dashboard
exports.getDashboard = async (req, res, next) => {
    try {
        const brandId = req.user._id;
        const [totalRequests, acceptedRequests, pendingRequests, verifiedPosts] = await Promise.all([
            CampaignRequest.countDocuments({ brandId }),
            CampaignRequest.countDocuments({ brandId, status: 'accepted' }),
            CampaignRequest.countDocuments({ brandId, status: 'pending' }),
            VerificationSubmission.countDocuments({ brandId, status: 'verified' }),
        ]);

        res.json({
            success: true,
            dashboard: {
                totalRequests,
                acceptedRequests,
                pendingRequests,
                verifiedPosts,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create structured campaign request
// @route   POST /api/brand/requests
exports.createRequest = async (req, res, next) => {
    try {
        const {
            influencerId, campaignTitle, campaignDescription, deliverables,
            requiredElements, videoLength, postingDeadline, contentGuidelines,
            hashtags, disclosureRequirements, agreedPrice, paymentTerms,
        } = req.body;

        // Check influencer exists
        const influencer = await User.findOne({ _id: influencerId, role: 'influencer', status: 'active' });
        if (!influencer) {
            return res.status(404).json({ success: false, message: 'Influencer not found or inactive' });
        }

        // Check no pending/accepted request already exists
        const existing = await CampaignRequest.findOne({
            brandId: req.user._id,
            influencerId,
            status: { $in: ['pending', 'accepted'] },
        });
        if (existing) {
            return res.status(400).json({ success: false, message: 'An active request already exists for this influencer' });
        }

        const request = await CampaignRequest.create({
            brandId: req.user._id,
            influencerId,
            campaignTitle, campaignDescription, deliverables,
            requiredElements, videoLength, postingDeadline,
            contentGuidelines, hashtags, disclosureRequirements,
            agreedPrice, paymentTerms,
        });

        const populated = await request.populate('influencerId', 'fullName email niche followers engagementRate');
        res.status(201).json({ success: true, request: populated });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all requests sent by this brand
// @route   GET /api/brand/requests
exports.getRequests = async (req, res, next) => {
    try {
        const requests = await CampaignRequest.find({ brandId: req.user._id })
            .populate('influencerId', 'fullName email niche followers engagementRate avatar')
            .sort({ createdAt: -1 });
        res.json({ success: true, requests });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single request
// @route   GET /api/brand/requests/:id
exports.getRequest = async (req, res, next) => {
    try {
        const request = await CampaignRequest.findOne({ _id: req.params.id, brandId: req.user._id })
            .populate('influencerId', 'fullName email niche followers engagementRate avatar');
        if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
        res.json({ success: true, request });
    } catch (error) {
        next(error);
    }
};

// @desc    Get verified submissions for brand
// @route   GET /api/brand/verifications
exports.getBrandVerifications = async (req, res, next) => {
    try {
        const verifications = await VerificationSubmission.find({ brandId: req.user._id })
            .populate('influencerId', 'fullName email niche')
            .populate('campaignRequestId', 'campaignTitle agreedPrice')
            .sort({ createdAt: -1 });
        res.json({ success: true, verifications });
    } catch (error) {
        next(error);
    }
};

// @desc    AI Influencer Matching / Discovery
// @route   GET /api/brand/influencers
exports.getMatchedInfluencers = async (req, res, next) => {
    try {
        const { niche, minFollowers, maxFollowers } = req.query;
        // Only return influencers who have completed their profile (niche must be set)
        const filter = { role: 'influencer', status: 'active', niche: { $exists: true, $ne: null, $nin: ['', null] } };
        if (niche) filter.niche = niche; // exact match from predefined enum
        if (minFollowers || maxFollowers) {
            filter.followers = {};
            if (minFollowers) filter.followers.$gte = Number(minFollowers);
            if (maxFollowers) filter.followers.$lte = Number(maxFollowers);
        }
        const influencers = await User.find(filter).select(
            'fullName niche country followers engagementRate instagramUsername instagramDPURL instagramProfileURL accountType avgPostCostUSD avgReelCostUSD bio'
        );
        const ranked = matchInfluencers(influencers, { niche });
        res.json({ success: true, influencers: ranked });
    } catch (error) {
        next(error);
    }
};

// Legacy: campaigns CRUD (kept for brand reference)
exports.createCampaign = async (req, res, next) => {
    try {
        const campaign = await Campaign.create({ ...req.body, brandId: req.user._id });
        res.status(201).json({ success: true, campaign });
    } catch (error) { next(error); }
};

exports.getCampaigns = async (req, res, next) => {
    try {
        const campaigns = await Campaign.find({ brandId: req.user._id }).sort({ createdAt: -1 });
        res.json({ success: true, campaigns });
    } catch (error) { next(error); }
};

exports.updateCampaign = async (req, res, next) => {
    try {
        const campaign = await Campaign.findOneAndUpdate(
            { _id: req.params.id, brandId: req.user._id }, req.body, { new: true }
        );
        if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
        res.json({ success: true, campaign });
    } catch (error) { next(error); }
};

// @desc    Update brand profile
// @route   PUT /api/brand/profile
exports.updateProfile = async (req, res, next) => {
    try {
        const allowed = ['companyName', 'brandGoal', 'brandNiche', 'approxBudgetUSD', 'profileImageURL', 'website'];
        const updates = {};
        allowed.forEach((field) => {
            if (req.body[field] !== undefined) updates[field] = req.body[field];
        });

        const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
        res.json({ success: true, user });
    } catch (error) {
        next(error);
    }
};
