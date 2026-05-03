const BrandProfile = require('../models/BrandProfile');
const InfluencerProfile = require('../models/InfluencerProfile');
const { isAdminRole } = require('../utils/accessRoles');

async function requireCompleteProfile(req, res, next) {
    try {
        if (isAdminRole(req.user?.role)) {
            return next();
        }

        if (req.user?.role === 'brand') {
            const profile = await BrandProfile.findOne({ userId: req.user._id }).select('profileComplete').lean();
            if (!profile?.profileComplete) {
                return res.status(403).json({
                    success: false,
                    error: 'Profile incomplete',
                    message: 'Complete your brand profile before creating or managing collaborations',
                    redirectTo: '/dashboard/brand/profile',
                });
            }
        }

        if (req.user?.role === 'influencer') {
            const profile = await InfluencerProfile.findOne({ userId: req.user._id }).select('profileComplete').lean();
            if (!profile?.profileComplete) {
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
