const User = require('../models/User');
const BrandProfile = require('../models/BrandProfile');
const InfluencerProfile = require('../models/InfluencerProfile');
const InstagramConnection = require('../models/InstagramConnection');
const InstagramDerivedMetric = require('../models/InstagramDerivedMetric');
const InstagramMedia = require('../models/InstagramMedia');
const { validateBrandProfile, isValidObjectId } = require('../utils/validators');

// Helper for quality score
function getQualityScore(profile, igConn) {
    let score = 5.0;
    const er = profile.engagementRate || 0;
    const followers = profile.followersCount || igConn?.followersCount || 0;
    
    if (er > 5) score += 2;
    else if (er > 2) score += 1;
    else if (er > 0) score += 0.5;
    
    if (followers > 500000) score += 2;
    else if (followers > 100000) score += 1.5;
    else if (followers > 10000) score += 1;
    
    if (profile.profileCompletionStatus) score += 1;
    
    score = Math.min(Math.max(score, 1.0), 10.0);
    
    let stars = Math.max(1, Math.round(score / 2));
    let label = 'Low Fit';
    if (score >= 8) label = 'Best Fit';
    else if (score >= 6) label = 'Strong Fit';
    else if (score >= 4) label = 'Good Fit';
    
    return { qualityScore: parseFloat(score.toFixed(1)), starRating: stars, qualityLabel: label };
}

// @desc    Brand dashboard overview
// @route   GET /api/brand/dashboard
exports.getDashboard = async (req, res, next) => {
    try {
        const brandId = req.user._id;
        const [brandProfile, igConnection] = await Promise.all([
            BrandProfile.findOne({ userId: brandId }),
            InstagramConnection.findOne({ userId: brandId, role: 'brand' }).select('-accessToken -longLivedToken -oauthState'),
        ]);

        const profileComplete = !!(
            brandProfile?.brandName && brandProfile?.officialEmail &&
            brandProfile?.contactPersonName && brandProfile?.brandNiche && brandProfile?.companyCountry
        );

        res.json({
            success: true,
            dashboard: {
                profile: req.user,
                brandProfile: brandProfile || null,
                instagramConnection: igConnection || null,
                profileComplete,
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
        const [user, brandProfile] = await Promise.all([
            User.findById(req.user._id).select('-password'),
            BrandProfile.findOne({ userId: req.user._id }),
        ]);
        res.json({ success: true, user, brandProfile: brandProfile || null });
    } catch (error) {
        next(error);
    }
};

// @desc    Update brand profile
// @route   PUT /api/brand/profile
exports.updateProfile = async (req, res, next) => {
    try {
        const { valid, errors } = validateBrandProfile(req.body);
        if (!valid) {
            return res.status(400).json({ success: false, message: errors.join('. '), errors });
        }

        const profileFields = [
            'brandName', 'officialEmail', 'contactPersonName', 'brandGoal',
            'brandNiche', 'approxBudgetUSD', 'companyCountry', 'companyWebsite',
            'trackingWebsiteURL', 'profileImageURL',
        ];
        const profileUpdates = {};
        profileFields.forEach((field) => {
            if (req.body[field] !== undefined) profileUpdates[field] = req.body[field];
        });

        // Compute profile completion
        const existing = await BrandProfile.findOne({ userId: req.user._id });
        const merged = { ...(existing?.toObject() || {}), ...profileUpdates };
        profileUpdates.profileCompletionStatus = !!(
            merged.brandName && merged.officialEmail &&
            merged.contactPersonName && merged.brandNiche && merged.companyCountry
        );

        const { generateUniqueCode } = require('../utils/generateCode');

        // Upsert BrandProfile
        let brandProfile = await BrandProfile.findOne({ userId: req.user._id });
        if (!brandProfile) {
            const brandProfileId = await generateUniqueCode('BRD', BrandProfile, 'brandProfileId');
            brandProfile = await BrandProfile.create({
                userId: req.user._id,
                brandProfileId,
                ...profileUpdates,
            });
        } else {
            Object.assign(brandProfile, profileUpdates);
            await brandProfile.save();
        }

        // Mirror instagramConnected status to User
        await User.findByIdAndUpdate(req.user._id, {
            profileCompletionStatus: profileUpdates.profileCompletionStatus,
        });

        const user = await User.findById(req.user._id).select('-password');
        res.json({ success: true, user, brandProfile });
    } catch (error) {
        next(error);
    }
};

// @desc    AI Influencer Discovery
// @route   GET /api/brand/influencers
exports.getMatchedInfluencers = async (req, res, next) => {
    try {
        const { niche, country } = req.query;

        const filter = {};
        if (niche) filter.niche = niche;
        if (country) filter.countryOfResidence = country;

        const influencerProfiles = await InfluencerProfile.find(filter)
            .populate('userId', 'email status')
            .sort({ createdAt: -1 });

        // Enrich with latest IG connection data
        const result = await Promise.all(
            influencerProfiles.map(async (profile) => {
                const igConn = await InstagramConnection.findOne({
                    userId: profile.userId?._id,
                    role: 'influencer',
                    isConnected: true,
                }).select('username followersCount followsCount mediaCount profilePictureURL lastSyncedAt');
                
                const quality = getQualityScore(profile, igConn);
                
                return { profile, instagram: igConn || null, ...quality };
            })
        );

        res.json({ success: true, influencers: result });
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

        const profile = await InfluencerProfile.findOne({ userId: id });
        if (!profile) {
            return res.status(404).json({ success: false, message: 'Influencer not found' });
        }

        const [igConnection, analytics, recentPosts] = await Promise.all([
            InstagramConnection.findOne({ userId: id, role: 'influencer', isConnected: true })
                .select('-accessToken -longLivedToken -oauthState'),
            InstagramDerivedMetric.findOne({ userId: id, role: 'influencer' }).sort({ computedAt: -1 }),
            InstagramMedia.find({ userId: id, role: 'influencer' })
                .sort({ timestamp: -1 })
                .limit(6)
        ]);
        
        const quality = getQualityScore(profile, igConnection);

        res.json({ 
            success: true, 
            profile, 
            instagram: igConnection || null, 
            analytics: analytics || null,
            recentPosts: recentPosts || [],
            ...quality
        });
    } catch (error) {
        next(error);
    }
};
