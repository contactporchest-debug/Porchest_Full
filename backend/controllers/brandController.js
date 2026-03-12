const CampaignRequest = require('../models/CampaignRequest');
const VerificationSubmission = require('../models/VerificationSubmission');
const User = require('../models/User');
const InstagramAnalyticsSnapshot = require('../models/InstagramAnalyticsSnapshot');
const { matchInfluencers } = require('../utils/aiMatching');
const { validateBrandProfile, isValidObjectId } = require('../utils/validators');

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
                profile: req.user,
                profileComplete: !!(
                    req.user.brandName && req.user.officialEmail &&
                    req.user.contactPersonName && req.user.brandNiche && req.user.companyCountry
                ),
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get brand profile
// @route   GET /api/brand/profile
exports.getBrandProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json({ success: true, user });
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
        const { niche, minFollowers, maxFollowers, country, minEngagement, maxEngagement, minPostCost, maxPostCost } = req.query;
        // Only return influencers who have completed their profile
        const filter = { role: 'influencer', status: 'active', niche: { $exists: true, $ne: null, $nin: ['', null] } };
        if (niche) filter.niche = niche;
        if (country) filter.country = country;
        if (minFollowers || maxFollowers) {
            filter.followers = {};
            if (minFollowers) filter.followers.$gte = Number(minFollowers);
            if (maxFollowers) filter.followers.$lte = Number(maxFollowers);
        }
        if (minEngagement || maxEngagement) {
            filter.engagementRate = {};
            if (minEngagement) filter.engagementRate.$gte = Number(minEngagement);
            if (maxEngagement) filter.engagementRate.$lte = Number(maxEngagement);
        }
        if (minPostCost || maxPostCost) {
            filter.avgPostCostUSD = {};
            if (minPostCost) filter.avgPostCostUSD.$gte = Number(minPostCost);
            if (maxPostCost) filter.avgPostCostUSD.$lte = Number(maxPostCost);
        }
        const influencers = await User.find(filter).select(
            'fullName niche country city followers followsCount mediaCount engagementRate avgLikes avgComments instagramUsername instagramDPURL instagramProfileURL accountType avgPostCostUSD avgReelCostUSD shortBio bio lastSyncedAt instagramConnected profileCompletionStatus'
        );
        const ranked = matchInfluencers(influencers, { niche });
        res.json({ success: true, influencers: ranked });
    } catch (error) {
        next(error);
    }
};

// @desc    Get full influencer details (for brand viewing)
// @route   GET /api/brand/influencers/:id/details
exports.getInfluencerDetail = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: 'Invalid influencer ID' });
        }
        const influencer = await User.findOne({ _id: id, role: 'influencer', status: 'active' }).select(
            '-password -otp -otpExpires'
        );
        if (!influencer) {
            return res.status(404).json({ success: false, message: 'Influencer not found' });
        }
        // Latest analytics snapshot
        const analytics = await InstagramAnalyticsSnapshot.findOne({ userId: id }).sort({ fetchedAt: -1 });
        res.json({ success: true, influencer, analytics: analytics || null });
    } catch (error) {
        next(error);
    }
};


// @desc    Update brand profile
// @route   PUT /api/brand/profile
exports.updateProfile = async (req, res, next) => {
    try {
        // Backend validation
        const { valid, errors } = validateBrandProfile(req.body);
        if (!valid) {
            return res.status(400).json({ success: false, message: errors.join('. '), errors });
        }

        const allowed = [
            'companyName', 'brandName', 'officialEmail', 'contactPersonName',
            'brandGoal', 'brandNiche', 'approxBudgetUSD', 'companyCountry',
            'companyWebsite', 'profileImageURL', 'website', 'brandInstagramHandle',
        ];
        const updates = {};
        allowed.forEach((field) => {
            if (req.body[field] !== undefined) updates[field] = req.body[field];
        });

        // Sync companyName from brandName if not set separately
        if (updates.brandName && !updates.companyName) {
            updates.companyName = updates.brandName;
        }

        // Compute profile completion
        const merged = { ...req.user.toObject(), ...updates };
        updates.profileCompletionStatus = !!(
            (merged.brandName || merged.companyName) && merged.officialEmail &&
            merged.contactPersonName && merged.brandNiche && merged.companyCountry
        );

        const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
        res.json({ success: true, user });
    } catch (error) {
        next(error);
    }
};
