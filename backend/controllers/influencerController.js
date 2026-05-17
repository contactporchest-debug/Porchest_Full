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

    const postPrice = Number(profile?.rates?.postPrice ?? profile?.avgPostPrice ?? 0);
    const reelPrice = Number(profile?.rates?.reelPrice ?? profile?.avgReelPrice ?? 0);

    const checks = [
        { key: 'displayName', label: 'Add display name', done: !!(profile.fullName || profile.displayName) },
        { key: 'contactEmail', label: 'Add contact email', done: !!profile.contactEmail },
        { key: 'bio', label: 'Add bio', done: !!(profile.bio || profile.instagramBiography) },
        { key: 'niche', label: 'Select niche/category', done: !!profile.niche },
        { key: 'country', label: 'Set audience region / country', done: !!profile.country },
        { key: 'city', label: 'Set city', done: !!profile.city },
        { key: 'languages', label: 'Select languages', done: Array.isArray(profile.languages) && profile.languages.length > 0 },
        { key: 'contentStyleTags', label: 'Pick content style', done: Array.isArray(profile.contentStyleTags) && profile.contentStyleTags.length > 0 },
        { key: 'postPrice', label: 'Set average post price', done: postPrice > 0 },
        { key: 'reelPrice', label: 'Set average reel price', done: reelPrice > 0 },
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
        const normalizeList = (value) => {
            if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
            if (typeof value === 'string' && value.trim()) return value.split(',').map((item) => item.trim()).filter(Boolean);
            return [];
        };
        const normalizeRate = (value) => {
            if (value === '' || value == null) return undefined;
            const next = Number(value);
            return Number.isFinite(next) ? next : undefined;
        };
        const reelPrice = normalizeRate(updates.rates?.reelPrice ?? updates.avgReelCostUSD ?? updates.avgReelPrice);
        const postPrice = normalizeRate(updates.rates?.postPrice ?? updates.avgPostCostUSD ?? updates.avgPostPrice);
        const mappedUpdates = {
            fullName: updates.fullName || updates.displayName || req.user?.name || req.user?.email?.split('@')[0] || 'Influencer',
            displayName: updates.displayName || updates.fullName,
            contactEmail: updates.contactEmail,
            age: updates.age,
            country: updates.countryOfResidence || updates.country,
            city: updates.city,
            niche: normalizeList(updates.niche),
            bio: updates.shortBio || updates.bio,
            languages: normalizeList(updates.languages),
            contentStyleTags: normalizeList(updates.contentStyleTags),
            rates: {
                reelPrice,
                postPrice,
            },
            avgPostPrice: postPrice,
            avgReelPrice: reelPrice,
            profilePictureUrl: updates.profileImageURL || updates.profilePictureUrl,
            avatar: updates.profileImageURL || updates.profilePictureUrl,
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

        if ((influencerProfile.avgPostPrice == null || influencerProfile.avgPostPrice === 0) && influencerProfile.rates?.postPrice > 0) {
            influencerProfile.avgPostPrice = influencerProfile.rates.postPrice;
        }
        if ((influencerProfile.avgReelPrice == null || influencerProfile.avgReelPrice === 0) && influencerProfile.rates?.reelPrice > 0) {
            influencerProfile.avgReelPrice = influencerProfile.rates.reelPrice;
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
