const User = require('../models/User');
const BrandProfile = require('../models/BrandProfile');
const InfluencerProfile = require('../models/InfluencerProfile');
const InstagramConnection = require('../models/InstagramConnection');
const InstagramMedia = require('../models/InstagramMedia');
const { validateBrandProfile, isValidObjectId } = require('../utils/validators');

/**
 * Build a presentation-ready influencer card object from a flat InfluencerProfile doc.
 * All values come from InfluencerProfile — the single source of truth after write-through sync.
 *
 * fitScore   : 0–100 (computed on sync, stored in profile)
 * starRating : 1–5  (derived from fitScore tiers)
 * qualityLabel: human-readable tier label
 */
function buildInfluencerCard(profile) {
    const fitScore = profile.fitScore || 0;

    let stars = 1;
    let qualityLabel = 'Low Fit';
    if (fitScore >= 80) { stars = 5; qualityLabel = 'Best Fit'; }
    else if (fitScore >= 60) { stars = 4; qualityLabel = 'Strong Fit'; }
    else if (fitScore >= 40) { stars = 3; qualityLabel = 'Good Fit'; }
    else if (fitScore >= 20) { stars = 2; qualityLabel = 'Average Fit'; }

    // Demographics — already structured objects from write-through (no JSON.parse needed)
    const audienceDemographics = (
        profile.demographicsTopCountries ||
        profile.demographicsTopCities    ||
        profile.demographicsGenderAge
    ) ? {
        countries: profile.demographicsTopCountries || null,
        cities:    profile.demographicsTopCities    || null,
        genderAge: profile.demographicsGenderAge    || null,
    } : null;

    return {
        // Identity
        _id:                   profile._id,
        influencerProfileId:   profile.influencerProfileId,
        userId:                profile.userId,
        fullName:              profile.fullName  || null,
        username:              profile.instagramUsername || null,
        instagramProfileURL:   profile.instagramProfileURL || null,
        profileImageURL:       profile.instagramDPURL || profile.profileImageURL || null,
        bio:                   profile.instagramBiography || profile.shortBio || null,
        niche:                 profile.niche || null,
        country:               profile.countryOfResidence || null,
        city:                  profile.city || null,

        // Account stats
        followersCount: profile.followersCount || 0,
        followsCount:   profile.followsCount   || 0,
        mediaCount:     profile.mediaCount     || 0,

        // Engagement metrics (correct formula, stored on InfluencerProfile from sync)
        engagementRate:       profile.engagementRate       || 0,   // e.g. 3.45 = 3.45%
        avgLikes:             profile.avgLikes             || 0,
        avgComments:          profile.avgComments          || 0,
        avgEngagementPerPost: profile.avgEngagementPerPost || 0,
        postingFrequency7d:   profile.postingFrequency7d   || 0,
        postingFrequency30d:  profile.postingFrequency30d  || 0,
        topPostScore:         profile.topPostScore         || null,
        topReelScore:         profile.topReelScore         || null,

        // Pricing
        avgPostCostUSD:  profile.avgPostCostUSD  || 0,
        avgReelCostUSD:  profile.avgReelCostUSD  || 0,

        // Demographics (structured, ready to render)
        audienceDemographics,

        // Fit scoring
        fitScore,
        starRating:   stars,
        qualityLabel,

        // Metadata
        instagramConnected:      profile.instagramConnected || false,
        profileCompletionStatus: profile.profileCompletionStatus || false,
        lastSyncedAt:            profile.lastSyncedAt || null,
        lastDemographicsSyncAt:  profile.lastDemographicsSyncAt || null,
    };
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
        let brandProfile = existing;
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

        await User.findByIdAndUpdate(req.user._id, {
            profileCompletionStatus: profileUpdates.profileCompletionStatus,
        });

        const user = await User.findById(req.user._id).select('-password');
        res.json({ success: true, user, brandProfile });
    } catch (error) {
        next(error);
    }
};

// @desc    AI Influencer Discovery — brand-facing search
// @route   GET /api/brand/influencers
// NOTE: Single-collection query — no N+1 joins needed since InfluencerProfile
//       is now the source of truth with all data promoted from sync.
exports.getMatchedInfluencers = async (req, res, next) => {
    try {
        const { niche, country, minFollowers, maxFollowers, minEngagement, maxPostCost } = req.query;

        const filter = { instagramConnected: true }; // only show synced profiles
        if (niche && niche !== 'All') filter.niche = niche;
        if (country && country !== 'Any') filter.countryOfResidence = country;
        if (minFollowers || maxFollowers) {
            filter.followersCount = {};
            if (minFollowers) filter.followersCount.$gte = Number(minFollowers);
            if (maxFollowers) filter.followersCount.$lte = Number(maxFollowers);
        }
        if (minEngagement) filter.engagementRate = { $gte: Number(minEngagement) };
        if (maxPostCost) filter.avgPostCostUSD = { $lte: Number(maxPostCost), $gt: 0 };

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

// @desc    Get full influencer details (for brand viewing a profile modal)
// @route   GET /api/brand/influencers/:id/details
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

        // Fetch the extra data needed only for the detail modal (not needed for list cards)
        const [igConnection, recentPosts] = await Promise.all([
            InstagramConnection.findOne({ userId: id, role: 'influencer', isConnected: true })
                .select('-accessToken -longLivedToken -oauthState'),
            InstagramMedia.find({ userId: id, role: 'influencer' })
                .sort({ timestamp: -1 })
                .limit(60)
                .lean(),
        ]);

        // Build analytics object from what is already in InfluencerProfile (write-through data)
        // Plus the structured demographics already stored on the profile
        const analytics = {
            engagementRate:       profile.engagementRate       || 0,
            avgLikesPerPost:      profile.avgLikes             || 0,
            avgCommentsPerPost:   profile.avgComments          || 0,
            avgEngagementPerPost: profile.avgEngagementPerPost || 0,
            likeToCommentRatio:   profile.likeToCommentRatio   || 0,
            postingFrequency7d:   profile.postingFrequency7d    || 0,
            postingFrequency30d:  profile.postingFrequency30d   || 0,
            topPostScore:         profile.topPostScore          || null,
            topReelScore:         profile.topReelScore          || null,
            // Demographics already structured — no JSON.parse needed
            audienceDemographics: (
                profile.demographicsTopCountries ||
                profile.demographicsTopCities    ||
                profile.demographicsGenderAge
            ) ? {
                countries: profile.demographicsTopCountries || null,
                cities:    profile.demographicsTopCities    || null,
                genderAge: profile.demographicsGenderAge    || null,
            } : null,
        };

        const card = buildInfluencerCard(profile);

        res.json({
            success: true,
            profile,
            instagram: igConnection || null,
            analytics,
            recentPosts: recentPosts || [],
            ...{ fitScore: card.fitScore, starRating: card.starRating, qualityLabel: card.qualityLabel },
        });
    } catch (error) {
        next(error);
    }
};
