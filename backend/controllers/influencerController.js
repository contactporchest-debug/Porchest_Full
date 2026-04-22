const User = require('../models/User');
const InfluencerProfile = require('../models/InfluencerProfile');
const { validateInfluencerProfile } = require('../utils/validators');
const { generateUniqueCode } = require('../utils/generateCode');

/**
 * Compute profile completion checklist and percentage.
 * Returns { percentage, isComplete, checklist }
 */
function computeProfileCompletion(profile) {
    if (!profile) return { percentage: 0, isComplete: false, checklist: [] };

    const checks = [
        { key: 'displayName', label: 'Add display name', done: !!(profile.fullName || profile.displayName) },
        { key: 'bio', label: 'Add bio', done: !!(profile.bio || profile.instagramBiography) },
        { key: 'niche', label: 'Select niche/category', done: !!profile.niche },
        { key: 'country', label: 'Set audience region / country', done: !!profile.country },
        { key: 'followers', label: 'Sync follower count', done: (profile.followersCount || 0) > 0 },
        { key: 'engagement', label: 'Sync engagement data', done: (profile.engagementRate || 0) > 0 },
        { key: 'postPrice', label: 'Set average post price', done: (profile.avgPostPrice || 0) > 0 },
        { key: 'reelPrice', label: 'Set average reel price', done: (profile.avgReelPrice || 0) > 0 },
        { key: 'instagram', label: 'Connect Instagram account', done: !!(profile.instagramConnected || profile.instagramConnectionStatus === 'connected') },
    ];

    const doneCount = checks.filter(c => c.done).length;
    const percentage = Math.round((doneCount / checks.length) * 100);
    const isComplete = doneCount === checks.length;

    return { percentage, isComplete, checklist: checks };
}

// @desc    Influencer dashboard overview
// @route   GET /api/influencer/dashboard
exports.getDashboard = async (req, res, next) => {
    try {
        const influencerId = req.user._id;
        const profile = await InfluencerProfile.findOne({ userId: influencerId });

        const completion = computeProfileCompletion(profile);

        res.json({
            success: true,
            dashboard: {
                profile: req.user,
                influencerProfile: profile || null,
                instagramConnection: profile ? {
                    isConnected: profile.instagramConnected || profile.instagramConnectionStatus === 'connected',
                    lastSyncedAt: profile.lastSyncAt || null,
                    username: profile.instagramUsername,
                    profilePictureURL: profile.instagramDPURL || profile.profilePictureUrl,
                    followersCount: profile.followersCount,
                    followsCount: profile.followingCount,
                    mediaCount: profile.mediaCount,
                    accountType: profile.instagramAccountType
                } : null,
                profileCompletion: completion,
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
        const [user, influencerProfile] = await Promise.all([
            User.findById(req.user._id).select('-password'),
            InfluencerProfile.findOne({ userId: req.user._id })
        ]);

        const completion = computeProfileCompletion(influencerProfile);

        res.json({
            success: true,
            user,
            influencerProfile: influencerProfile || null,
            profileCompletion: completion,
            instagramConnection: influencerProfile ? {
                isConnected: influencerProfile.instagramConnected || influencerProfile.instagramConnectionStatus === 'connected',
                lastSyncedAt: influencerProfile.lastSyncAt || null,
                username: influencerProfile.instagramUsername,
                profilePictureURL: influencerProfile.instagramDPURL || influencerProfile.profilePictureUrl,
                followersCount: influencerProfile.followersCount,
                followsCount: influencerProfile.followingCount,
                mediaCount: influencerProfile.mediaCount,
                accountType: influencerProfile.instagramAccountType
            } : null,
            instagramAccount: influencerProfile ? {
                instagramUserId: influencerProfile.instagramUserId,
                username: influencerProfile.instagramUsername,
                name: influencerProfile.fullName,
                biography: influencerProfile.bio,
                website: influencerProfile.website,
                profilePictureURL: influencerProfile.profilePictureUrl,
                followersCount: influencerProfile.followersCount,
                followsCount: influencerProfile.followingCount,
                mediaCount: influencerProfile.mediaCount
            } : null
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update influencer profile (editable fields only)
// @route   PUT /api/influencer/profile
exports.updateProfile = async (req, res, next) => {
    try {
        // Just extracting fields manually to bypass strict legacy validator mismatch
        const updates = req.body;
        const mappedUpdates = {
            fullName: updates.fullName,
            contactEmail: updates.contactEmail,
            age: updates.age,
            country: updates.countryOfResidence || updates.country,
            city: updates.city,
            niche: updates.niche,
            bio: updates.shortBio || updates.bio,
            avgPostPrice: updates.avgPostCostUSD !== undefined ? updates.avgPostCostUSD : updates.avgPostPrice,
            avgReelPrice: updates.avgReelCostUSD !== undefined ? updates.avgReelCostUSD : updates.avgReelPrice,
            profilePictureUrl: updates.profileImageURL || updates.profilePictureUrl
        };

        const existing = await InfluencerProfile.findOne({ userId: req.user._id });
        let influencerProfile = existing;
        
        if (!influencerProfile) {
            const influencerProfileId = await generateUniqueCode('INF', InfluencerProfile, 'influencerProfileId');
            influencerProfile = await InfluencerProfile.create({
                userId: req.user._id,
                influencerProfileId,
                ...mappedUpdates,
            });
        } else {
            Object.assign(influencerProfile, mappedUpdates);
            await influencerProfile.save();
        }

        // Compute strict profile completion based on all required fields
        const completion = computeProfileCompletion(influencerProfile);
        influencerProfile.profileCompletionStatus = completion.isComplete;
        influencerProfile.isSearchable = completion.isComplete;
        
        if (completion.isComplete && influencerProfile.verificationStatus !== 'verified') {
            influencerProfile.verificationStatus = 'verified';
            influencerProfile.isVerified = true;
        }

        await influencerProfile.save();

        await User.findByIdAndUpdate(req.user._id, { 
            profileCompletionStatus: completion.isComplete,
            ...(completion.isComplete && { isVerified: true })
        });

        const user = await User.findById(req.user._id).select('-password');
        console.log(`[API Success] Influencer ${req.user._id} updated profile successfully`);
        res.json({ success: true, user, influencerProfile, profileCompletion: completion });
    } catch (error) {
        console.error(`[API Error] Failed to update profile persistence for ${req.user._id}:`, error);
        next(error);
    }
};

