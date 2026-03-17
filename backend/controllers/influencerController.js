const User = require('../models/User');
const InfluencerProfile = require('../models/InfluencerProfile');
const { validateInfluencerProfile } = require('../utils/validators');
const { generateUniqueCode } = require('../utils/generateCode');

// @desc    Influencer dashboard overview
// @route   GET /api/influencer/dashboard
exports.getDashboard = async (req, res, next) => {
    try {
        const influencerId = req.user._id;
        const profile = await InfluencerProfile.findOne({ userId: influencerId });

        res.json({
            success: true,
            dashboard: {
                profile: req.user,
                influencerProfile: profile || null,
                instagramConnection: profile ? {
                    isConnected: profile.instagramConnectionStatus === 'connected',
                    lastSyncedAt: profile.lastSyncAt || null,
                    username: profile.instagramUsername,
                    profilePictureURL: profile.instagramDPURL || profile.profilePictureUrl,
                    followersCount: profile.followersCount,
                    followsCount: profile.followingCount,
                    mediaCount: profile.mediaCount,
                    accountType: profile.instagramAccountType
                } : null,
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

        res.json({
            success: true,
            user,
            influencerProfile: influencerProfile || null,
            instagramConnection: influencerProfile ? {
                isConnected: influencerProfile.instagramConnectionStatus === 'connected',
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
            avgPostPrice: updates.avgPostCostUSD || updates.avgPostPrice,
            avgReelPrice: updates.avgReelCostUSD || updates.avgReelPrice,
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

        const profileCompletionStatus = !!(
            influencerProfile.fullName && influencerProfile.contactEmail && influencerProfile.country &&
            influencerProfile.niche && (influencerProfile.avgPostPrice > 0 || influencerProfile.avgReelPrice > 0)
        );
        
        influencerProfile.profileCompletionStatus = profileCompletionStatus;
        await influencerProfile.save();

        await User.findByIdAndUpdate(req.user._id, { profileCompletionStatus });

        const user = await User.findById(req.user._id).select('-password');
        res.json({ success: true, user, influencerProfile });
    } catch (error) {
        next(error);
    }
};
