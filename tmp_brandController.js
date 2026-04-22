const User = require('../models/User');
const BrandProfile = require('../models/BrandProfile');
const InfluencerProfile = require('../models/InfluencerProfile');
const { validateBrandProfile, isValidObjectId } = require('../utils/validators');
const { generateUniqueCode } = require('../utils/generateCode');

/**
 * Dynamically compute a weighted influence fit score (0–100).
 * Uses a strict multi-signal scoring model so weak profiles are not inflated.
 *
 * SCORING BREAKDOWN (100 pts total):
 *   Engagement Rate     — 40 pts  (main signal of quality)
 *   Follower Tier       — 20 pts  (reach potential)
 *   Data Completeness   — 25 pts  (identity + bio + niche + location + pricing)
 *   Instagram Connected — 10 pts  (verified, live data)
 *   Posting Activity    —  5 pts  (content consistency)
 */
function computeDynamicFitScore(profile) {
    let score = 0;
    const reasons = [];

    // 1. Engagement Rate (max 40 pts)
    const er = profile.engagementRate || 0;
    let erPts = 0;
    if (er >= 6)      { erPts = 40; reasons.push('Exceptional engagement rate'); }
    else if (er >= 4) { erPts = 32; reasons.push('Strong engagement rate'); }
    else if (er >= 2) { erPts = 22; reasons.push('Moderate engagement rate'); }
    else if (er >= 1) { erPts = 12; reasons.push('Below-average engagement rate'); }
    else if (er >  0) { erPts = 5;  reasons.push('Very low engagement rate'); }
    else              { erPts = 0;  reasons.push('No engagement data'); }
    score += erPts;

    // 2. Follower Tier (max 20 pts)
    const followers = profile.followersCount || 0;
    let followerPts = 0;
    if (followers >= 1000000)     { followerPts = 20; }
    else if (followers >= 500000) { followerPts = 18; }
    else if (followers >= 100000) { followerPts = 14; }
    else if (followers >= 50000)  { followerPts = 10; }
    else if (followers >= 10000)  { followerPts =  7; }
    else if (followers >= 1000)   { followerPts =  4; }
    score += followerPts;

    // 3. Data Completeness (max 25 pts — 5 signals × 5 pts each)
    let dataPts = 0;
    if (profile.fullName && profile.fullName.trim())                  dataPts += 5;
    if (profile.bio || profile.instagramBiography)                    dataPts += 5;
    if (profile.niche && profile.niche.trim())                        dataPts += 5;
    if (profile.country && profile.country.trim())                    dataPts += 5;
    if ((profile.avgPostPrice || 0) > 0 || (profile.avgReelPrice || 0) > 0) {
        dataPts += 5; reasons.push('Pricing published');
    } else {
        reasons.push('Pricing not set');
    }
    if (dataPts < 15) reasons.push('Profile data incomplete');
    score += dataPts;

    // 4. Instagram Connected (10 pts)
    const igConnected = profile.instagramConnected || profile.instagramConnectionStatus === 'connected';
    if (igConnected) { score += 10; reasons.push('Instagram verified via OAuth'); }
    else             { reasons.push('Instagram not connected'); }

    // 5. Posting Activity (max 5 pts)
    const freq = profile.postingFrequency7d || profile.postingFrequency || 0;
    if (freq >= 3) score += 5;
    else if (freq >= 1) score += 3;
    else if (freq > 0)  score += 1;

    const finalScore = Math.min(Math.max(Math.round(score), 0), 100);

    // Quality label based on strict thresholds
    let qualityLabel = 'Low Fit';
    if (finalScore >= 80)      qualityLabel = 'Excellent Fit';
    else if (finalScore >= 65) qualityLabel = 'Good Fit';
    else if (finalScore >= 50) qualityLabel = 'Moderate Fit';
    else if (finalScore >= 35) qualityLabel = 'Worth Considering';

    // Stars: strictly tied to score thresholds
    const starRating = finalScore >= 80 ? 5 : finalScore >= 65 ? 4 : finalScore >= 50 ? 3 : finalScore >= 35 ? 2 : 1;

    return { finalScore, qualityLabel, starRating, reasons };
}

/**
 * Build a presentation-ready influencer card object from a flat InfluencerProfile doc.
 * All values come from InfluencerProfile — the single source of truth after write-through sync.
 */
function buildInfluencerCard(profile) {
    const { finalScore, qualityLabel, starRating, reasons } = computeDynamicFitScore(profile);

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

        // Canonical field names for frontend consumption
        avgPostCostUSD:        profile.avgPostPrice   || 0,
        avgReelCostUSD:        profile.avgReelPrice   || 0,

        audienceDemographics:  profile.demographics   || null,

        // Dynamic score — not the stale stored fitScore
        fitScore:              finalScore,
        starRating,
        qualityLabel,
        scoringReasons:        reasons,

        instagramConnected:    profile.instagramConnected || profile.instagramConnectionStatus === 'connected',
        profileCompletionStatus: profile.profileCompletionStatus,
        lastSyncedAt:          profile.lastSyncAt || null,
    };
}

// @desc    Brand dashboard overview
exports.getDashboard = async (req, res, next) => {
    try {
        const brandId = req.user._id;
        const brandProfile = await BrandProfile.findOne({ userId: brandId }).lean();

        const profileComplete = !!(
            brandProfile?.brandName && brandProfile?.contactDetails?.officialEmail &&
            brandProfile?.contactDetails?.contactPersonName && brandProfile?.country
        );

        let formattedBrandProfile = brandProfile;
        if (formattedBrandProfile) {
            formattedBrandProfile = {
                ...formattedBrandProfile,
                companyCountry: formattedBrandProfile.country,
                companyWebsite: formattedBrandProfile.website,
                brandNiche: formattedBrandProfile.category,
                brandGoal: formattedBrandProfile.description,
            };
        }

        res.json({
            success: true,
            dashboard: {
                profile: req.user,
                brandProfile: formattedBrandProfile || null,
                instagramConnection: {
                    isConnected: brandProfile?.instagramConnected || brandProfile?.instagramConnectionStatus === 'connected',
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
            BrandProfile.findOne({ userId: req.user._id }).lean(),
        ]);
        
        let formattedBrandProfile = brandProfile;
        if (formattedBrandProfile) {
            formattedBrandProfile = {
                ...formattedBrandProfile,
                companyCountry: formattedBrandProfile.country,
                companyWebsite: formattedBrandProfile.website,
                brandNiche: formattedBrandProfile.category,
                brandGoal: formattedBrandProfile.description,
            };
        }

        res.json({ 
            success: true, 
            user, 
            brandProfile: formattedBrandProfile,
            instagramConnection: brandProfile ? {
                isConnected: brandProfile.instagramConnected || brandProfile.instagramConnectionStatus === 'connected',
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

        const profileCompletionStatus = !!(brandProfile.brandName && brandProfile.contactDetails?.officialEmail && brandProfile.contactDetails?.contactPersonName && brandProfile.country && brandProfile.description && brandProfile.category);
        brandProfile.profileCompletionStatus = profileCompletionStatus;
        await brandProfile.save();

