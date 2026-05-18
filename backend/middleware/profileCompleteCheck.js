const BrandProfile = require('../models/BrandProfile');
const InfluencerProfile = require('../models/InfluencerProfile');
const { isAdminRole } = require('../utils/accessRoles');
const { buildInfluencerProfileChecklist } = require('../utils/influencerProfileCompletion');

async function requireCompleteProfile(req, res, next) {
    try {
        if (isAdminRole(req.user?.role)) {
            return next();
        }

        if (req.user?.role === 'brand') {
            const profile = await BrandProfile.findOne({ userId: req.user._id }).select('profileComplete profileCompletionStatus').lean();
            if (!(profile?.profileComplete || profile?.profileCompletionStatus)) {
                return res.status(403).json({
                    success: false,
                    error: 'Profile incomplete',
                    message: 'Complete your brand profile before creating or managing collaborations',
                    redirectTo: '/dashboard/brand/profile',
                });
            }
        }

        if (req.user?.role === 'influencer') {
            const profile = await InfluencerProfile.findOne({ userId: req.user._id }).select('profileComplete profileCompletionStatus fullName contactEmail bio igBio instagramBiography country countryOfResidence city niche languages contentStyleTags rates avgPostPrice avgReelPrice instagramConnected instagramConnectionStatus instagramUsername instagramProfileURL profileUrl igProfileUrl instagramDPURL profilePictureUrl profileImageURL accountType igAccountType instagramAccountType').lean();
            const complete = profile ? buildInfluencerProfileChecklist(profile).isComplete : false;
            if (!complete) {
                return res.status(403).json({
                    success: false,
                    error: 'Profile incomplete',
                    message: 'Complete your profile before accepting or managing collaborations',
                    redirectTo: '/dashboard/influencer/profile',
                });
            }
        }

        return next();
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message || 'Failed to verify profile completion' });
    }
}

module.exports = {
    requireCompleteProfile,
};
