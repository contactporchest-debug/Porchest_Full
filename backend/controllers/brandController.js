const User = require('../models/User');
const BrandProfile = require('../models/BrandProfile');
const InfluencerProfile = require('../models/InfluencerProfile');
const { validateBrandProfile, isValidObjectId } = require('../utils/validators');
const { generateUniqueCode } = require('../utils/generateCode');

/**
 * Build a presentation-ready influencer card object from a flat InfluencerProfile doc.
 * All values come from InfluencerProfile — the single source of truth after write-through sync.
 */
function buildInfluencerCard(profile) {
    return {
        _id:                   profile._id,
        influencerProfileId:   profile.influencerProfileId,
        userId:                profile.userId,
        fullName:              profile.fullName  || null,
        username:              profile.instagramUsername || null,
        instagramProfileURL:   profile.instagramProfileURL || null,
        profileImageURL:       profile.instagramDPURL || profile.profilePictureUrl || null,
        bio:                   profile.instagramBiography || profile.bio || null,
        niche:                 profile.niche || null,
        country:               profile.country || null,
        city:                  profile.city || null,
        
        followersCount:        profile.followersCount || 0,
        followsCount:          profile.followingCount || 0,
        mediaCount:            profile.mediaCount     || 0,

        engagementRate:        profile.engagementRate || 0,
        avgLikes:              profile.avgLikes       || 0,
        avgComments:           profile.avgComments    || 0,

        avgPostCostUSD:        profile.avgPostPrice   || 0,
        avgReelCostUSD:        profile.avgReelPrice   || 0,

        audienceDemographics:  profile.demographics   || null,

        fitScore:              profile.fitScore || 0,
        starRating:            (profile.fitScore >= 80) ? 5 : (profile.fitScore >= 60) ? 4 : (profile.fitScore >= 40) ? 3 : (profile.fitScore >= 20) ? 2 : 1,
        qualityLabel:          profile.scoreLabel || 'Low Fit',

        instagramConnected:    profile.instagramConnectionStatus === 'connected',
        profileCompletionStatus: profile.profileCompletionStatus,
        lastSyncedAt:          profile.lastSyncAt || null,
    };
}

// @desc    Brand dashboard overview
exports.getDashboard = async (req, res, next) => {
    try {
        const brandId = req.user._id;
        const brandProfile = await BrandProfile.findOne({ userId: brandId });

        const profileComplete = !!(
            brandProfile?.brandName && brandProfile?.contactDetails?.officialEmail &&
            brandProfile?.contactDetails?.contactPersonName && brandProfile?.companyCountry
        );

        res.json({
            success: true,
            dashboard: {
                profile: req.user,
                brandProfile: brandProfile || null,
                instagramConnection: {
                    isConnected: brandProfile?.instagramConnected || false,
                    lastSyncedAt: brandProfile?.lastSyncedAt || null,
                    username: brandProfile?.instagramUsername,
                    profilePictureURL: brandProfile?.instagramDPURL,
                    followersCount: brandProfile?.followersCount,
                    followsCount: brandProfile?.followsCount,
                    mediaCount: brandProfile?.mediaCount,
                    accountType: brandProfile?.instagramAccountType
                },
                profileComplete,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get brand profile
exports.getBrandProfile = async (req, res, next) => {
    try {
        const [user, brandProfile] = await Promise.all([
            User.findById(req.user._id).select('-password'),
            BrandProfile.findOne({ userId: req.user._id }),
        ]);
        res.json({ 
            success: true, 
            user, 
            brandProfile,
            instagramConnection: brandProfile ? {
                isConnected: brandProfile.instagramConnected || false,
                lastSyncedAt: brandProfile.lastSyncedAt || null,
                username: brandProfile.instagramUsername,
                profilePictureURL: brandProfile.instagramDPURL,
                followersCount: brandProfile.followersCount,
                followsCount: brandProfile.followsCount,
                mediaCount: brandProfile.mediaCount,
                accountType: brandProfile.instagramAccountType
            } : null
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update brand profile
exports.updateProfile = async (req, res, next) => {
    try {
        // Just extract basic fields since validator isn't perfectly mapped in reality
        const updates = req.body;
        const mappedUpdates = {
            brandName: updates.brandName,
            category: updates.brandNiche || updates.category,
            country: updates.companyCountry || updates.country,
            website: updates.companyWebsite || updates.website,
            description: updates.brandGoal || updates.description,
            approxBudgetUSD: updates.approxBudgetUSD,
            contactDetails: {
                officialEmail: updates.officialEmail,
                contactPersonName: updates.contactPersonName
            }
        };

        const existing = await BrandProfile.findOne({ userId: req.user._id });
        let brandProfile = existing;

        if (!brandProfile) {
            const brandProfileId = await generateUniqueCode('BRD', BrandProfile, 'brandProfileId');
            brandProfile = await BrandProfile.create({
                userId: req.user._id,
                brandProfileId,
                ...mappedUpdates
            });
        } else {
            Object.assign(brandProfile, mappedUpdates);
            await brandProfile.save();
        }

        const profileCompletionStatus = !!(brandProfile.brandName && brandProfile.contactDetails?.officialEmail);
        brandProfile.profileCompletionStatus = profileCompletionStatus;
        await brandProfile.save();

        await User.findByIdAndUpdate(req.user._id, { profileCompletionStatus });

        const user = await User.findById(req.user._id).select('-password');
        res.json({ success: true, user, brandProfile });
    } catch (error) {
        next(error);
    }
};

// @desc    AI Influencer Discovery — brand-facing search
exports.getMatchedInfluencers = async (req, res, next) => {
    try {
        const { niche, country, minFollowers, maxFollowers, minEngagement, maxPostCost } = req.query;

        const filter = { instagramConnectionStatus: 'connected' };
        if (niche && niche !== 'All') filter.niche = niche;
        if (country && country !== 'Any') filter.country = country;
        if (minFollowers || maxFollowers) {
            filter.followersCount = {};
            if (minFollowers) filter.followersCount.$gte = Number(minFollowers);
            if (maxFollowers) filter.followersCount.$lte = Number(maxFollowers);
        }
        if (minEngagement) filter.engagementRate = { $gte: Number(minEngagement) };
        if (maxPostCost) filter.avgPostPrice = { $lte: Number(maxPostCost), $gt: 0 };

        const influencerProfiles = await InfluencerProfile.find(filter)
            .sort({ fitScore: -1, followersCount: -1 })
            .limit(100)
            .lean();

        const result = influencerProfiles.map(buildInfluencerCard);
        res.json({ success: true, influencers: result });
    } catch (error) {
        next(error);
    }
};

// @desc    Get full influencer details
exports.getInfluencerDetail = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: 'Invalid influencer ID' });
        }

        const profile = await InfluencerProfile.findOne({ userId: id }).lean();
        if (!profile) {
            return res.status(404).json({ success: false, message: 'Influencer not found' });
        }

        const card = buildInfluencerCard(profile);

        res.json({
            success: true,
            // Full native A-Z document returned 
            profile,
            // Keeping these legacy objects mapped for frontend compatibility immediately
            instagram: {
                isConnected: profile.instagramConnectionStatus === 'connected',
                username: profile.instagramUsername
            },
            analytics: {
                engagementRate:       profile.engagementRate,
                avgLikesPerPost:      profile.avgLikes,
                avgCommentsPerPost:   profile.avgComments,
                postingFrequency7d:   profile.postingFrequency,
                audienceDemographics: profile.demographics
            },
            recentPosts: profile.recentMediaSummary || [],
            ...{ fitScore: card.fitScore, starRating: card.starRating, qualityLabel: card.qualityLabel },
        });
    } catch (error) {
        next(error);
    }
};
