const User = require('../models/User');
const BrandProfile = require('../models/BrandProfile');
const { generateUniqueCode } = require('./generateCode');

const DEMO_BRAND_EMAIL = 'br1@porchest.com';
const DEMO_BRAND_PASSWORD = 'demo_porchest';

const REALISTIC_BRAND_PROFILE = {
    brandName: 'Northstar Collective',
    companyName: 'Northstar Collective',
    category: 'Beauty',
    country: 'United Arab Emirates',
    city: 'Dubai',
    description: 'Northstar Collective is a premium beauty and personal care brand focused on modern skincare essentials, elevated daily rituals, and creator-led storytelling across GCC and South Asian markets.',
    logoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
    website: 'https://northstarcollective.co',
    contactDetails: {
        officialEmail: DEMO_BRAND_EMAIL,
        contactPersonName: 'Maya Rahman',
    },
    profileCompletionStatus: true,
    verificationStatus: 'verified',
    isActive: true,
    budgetRange: '5000-15000',
    approxBudgetUSD: 12000,
    instagramConnected: true,
    instagramConnectionStatus: 'connected',
    instagramUserId: '17841400099124500',
    instagramUsername: 'northstarcollective',
    instagramProfileURL: 'https://instagram.com/northstarcollective',
    instagramDPURL: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
    instagramBiography: 'Skincare and self-care essentials designed for refined everyday routines.',
    instagramAccountType: 'BUSINESS',
    followersCount: 28640,
    followsCount: 842,
    mediaCount: 214,
    linkedPageId: '104889225001289',
    linkedPageName: 'Northstar Collective',
    engagementRate: 3.84,
    avgLikesPerPost: 982,
    avgCommentsPerPost: 56,
    avgEngagementPerPost: 1098,
    likeToCommentRatio: 17.54,
    postsAnalyzed: 24,
    influencerEfficiencyRate: 44.3,
    postingFrequency7d: 3,
    postingFrequency30d: 13,
    qualityScore: 88,
    topPostScore: 84,
    topReelScore: 90,
    lastSyncedAt: new Date(),
    sync: {
        refreshStatus: 'success',
        refreshError: null,
    },
};

async function ensureDemoBrand() {
    let user = await User.findOne({ email: DEMO_BRAND_EMAIL });
    if (!user) {
        const userCode = await generateUniqueCode('USR', User, 'userCode');
        user = await User.create({
            userCode,
            role: 'brand',
            email: DEMO_BRAND_EMAIL,
            password: DEMO_BRAND_PASSWORD,
            status: 'active',
            isVerified: true,
            loginProvider: 'local',
            profileCompletionStatus: true,
        });
    } else {
        user.role = 'brand';
        user.password = DEMO_BRAND_PASSWORD;
        user.status = 'active';
        user.isVerified = true;
        user.loginProvider = 'local';
        user.profileCompletionStatus = true;
        await user.save();
    }

    let brandProfile = null;
    if (user.brandProfileId) {
        brandProfile = await BrandProfile.findById(user.brandProfileId);
    }
    if (!brandProfile) {
        brandProfile = await BrandProfile.findOne({ userId: user._id });
    }

    if (!brandProfile) {
        const brandProfileId = await generateUniqueCode('BRD', BrandProfile, 'brandProfileId');
        brandProfile = await BrandProfile.create({
            userId: user._id,
            brandProfileId,
            ...REALISTIC_BRAND_PROFILE,
        });
    } else {
        Object.assign(brandProfile, REALISTIC_BRAND_PROFILE);
        await brandProfile.save();
    }

    if (!user.brandProfileId || String(user.brandProfileId) !== String(brandProfile._id)) {
        user.brandProfileId = brandProfile._id;
        await user.save();
    }

    return {
        email: DEMO_BRAND_EMAIL,
        password: DEMO_BRAND_PASSWORD,
        brandName: brandProfile.brandName,
    };
}

module.exports = {
    ensureDemoBrand,
    DEMO_BRAND_EMAIL,
    DEMO_BRAND_PASSWORD,
};
