const User = require('../models/User');
const InfluencerProfile = require('../models/InfluencerProfile');
const InstagramConnection = require('../models/InstagramConnection');
const InstagramAccount = require('../models/InstagramAccount');
const InstagramDerivedMetric = require('../models/InstagramDerivedMetric');
const { validateInfluencerProfile } = require('../utils/validators');
const { generateUniqueCode } = require('../utils/generateCode');

// @desc    Influencer dashboard overview
// @route   GET /api/influencer/dashboard
exports.getDashboard = async (req, res, next) => {
    try {
        const influencerId = req.user._id;
        const [profile, igConnection] = await Promise.all([
            InfluencerProfile.findOne({ userId: influencerId }),
            InstagramConnection.findOne({ userId: influencerId, role: 'influencer' })
                .select('-accessToken -longLivedToken -oauthState'),
        ]);

        res.json({
            success: true,
            dashboard: {
                profile: req.user,
                influencerProfile: profile || null,
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
        const [user, influencerProfile, igConnection, igAccount] = await Promise.all([
            User.findById(req.user._id).select('-password'),
            InfluencerProfile.findOne({ userId: req.user._id }),
            InstagramConnection.findOne({ userId: req.user._id, role: 'influencer' })
                .select('-accessToken -longLivedToken -oauthState'),
            InstagramAccount.findOne({ userId: req.user._id, role: 'influencer' }),
        ]);

        res.json({
            success: true,
            user,
            influencerProfile: influencerProfile || null,
            instagramConnection: igConnection || null,
            instagramAccount: igAccount || null,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update influencer profile (editable fields only)
// @route   PUT /api/influencer/profile
exports.updateProfile = async (req, res, next) => {
    try {
        const { valid, errors } = validateInfluencerProfile(req.body);
        if (!valid) {
            return res.status(400).json({ success: false, message: errors.join('. '), errors });
        }

        const profileFields = [
            'fullName', 'contactEmail', 'age', 'countryOfResidence', 'city',
            'niche', 'shortBio', 'avgPostCostUSD', 'avgReelCostUSD', 'profileImageURL',
        ];
        const profileUpdates = {};
        profileFields.forEach((field) => {
            if (req.body[field] !== undefined) profileUpdates[field] = req.body[field];
        });

        // Compute profile completion
        const existing = await InfluencerProfile.findOne({ userId: req.user._id });
        const merged = { ...(existing?.toObject() || {}), ...profileUpdates };
        profileUpdates.profileCompletionStatus = !!(
            merged.fullName && merged.contactEmail && merged.countryOfResidence &&
            merged.niche && merged.avgPostCostUSD > 0 && merged.avgReelCostUSD > 0
        );

        // Upsert InfluencerProfile
        let influencerProfile = existing;
        if (!influencerProfile) {
            const influencerProfileId = await generateUniqueCode('INF', InfluencerProfile, 'influencerProfileId');
            influencerProfile = await InfluencerProfile.create({
                userId: req.user._id,
                influencerProfileId,
                ...profileUpdates,
            });
        } else {
            Object.assign(influencerProfile, profileUpdates);
            await influencerProfile.save();
        }

        // Sync profileCompletionStatus back to User
        await User.findByIdAndUpdate(req.user._id, {
            profileCompletionStatus: profileUpdates.profileCompletionStatus,
        });

        const user = await User.findById(req.user._id).select('-password');
        res.json({ success: true, user, influencerProfile });
    } catch (error) {
        next(error);
    }
};
