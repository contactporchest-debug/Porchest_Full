const User = require('../models/User');
const BrandProfile = require('../models/BrandProfile');
const InfluencerProfile = require('../models/InfluencerProfile');
const CampaignRequest = require('../models/CampaignRequest');
const Notification = require('../models/Notification');
const { generateUniqueCode } = require('./generateCode');

const DEMO_BRAND_EMAIL = 'br1@porchest.com';
const DEMO_BRAND_PASSWORD = 'demo_porchest';
const now = new Date();
const daysAgo = (days) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
const daysFromNow = (days) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

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

const DEMO_CAMPAIGNS = [
    {
        influencerEmail: 'inf1@porchest.com',
        campaignTitle: 'Northstar Ramadan Glow Edit',
        campaignDescription: 'Launch a premium skincare storytelling campaign around evening routine rituals and festive-ready skin prep.',
        campaignType: 'reel',
        deliverables: '1 Reel + 3 Feed Posts',
        requiredElements: 'Hero serum, before/after texture, CTA to landing page',
        videoLength: '30-45 seconds',
        contentGuidelines: 'Warm neutral visuals, premium bathroom setting, elegant voiceover, no cluttered backgrounds.',
        hashtags: '#NorthstarCollective #GlowRoutine #SkincareEssentials',
        paymentTerms: '50% upfront, 50% within 7 days of publishing',
        agreedPrice: 340,
        budgetRangeMin: 300,
        budgetRangeMax: 420,
        postingDeadline: daysFromNow(9),
        campaignStartDate: daysAgo(2),
        campaignEndDate: daysFromNow(14),
        brandMessage: 'Your audience fit and polished beauty content are ideal for this hero product launch.',
        status: 'accepted',
        sentAt: daysAgo(5),
        viewedAt: daysAgo(4),
        acceptedAt: daysAgo(3),
    },
    {
        influencerEmail: 'inf2@porchest.com',
        campaignTitle: 'Daily Reset Wellness Collab',
        campaignDescription: 'Position the hydration line as part of a post-workout recovery and self-care routine for wellness-focused audiences.',
        campaignType: 'reel',
        deliverables: '1 Reel + 2 Stories',
        requiredElements: 'Product in gym bag, hydration routine, recovery angle',
        videoLength: '25-35 seconds',
        contentGuidelines: 'Energetic but premium, realistic gym environment, natural usage flow.',
        hashtags: '#NorthstarCollective #WellnessReset #RecoveryRoutine',
        paymentTerms: 'Paid within 5 working days after content approval',
        agreedPrice: 410,
        budgetRangeMin: 360,
        budgetRangeMax: 460,
        postingDeadline: daysFromNow(12),
        campaignStartDate: daysAgo(1),
        campaignEndDate: daysFromNow(16),
        brandMessage: 'We want to test a performance-meets-self-care angle with your audience.',
        status: 'negotiation',
        counterOfferPrice: 455,
        counterOfferMessage: 'Can we include one extra feed post for product education?',
        sentAt: daysAgo(4),
        viewedAt: daysAgo(4),
        negotiationStartedAt: daysAgo(2),
    },
    {
        influencerEmail: 'inf3@porchest.com',
        campaignTitle: 'Vanity Shelf Styling Feature',
        campaignDescription: 'Feature the product range within a refined home-lifestyle setting focused on elevated daily rituals.',
        campaignType: 'sponsored_post',
        deliverables: '1 Carousel + 2 Feed Posts',
        requiredElements: 'Shelf styling, morning routine caption, saved aesthetic detail shots',
        videoLength: 'N/A',
        contentGuidelines: 'Soft neutrals, home styling tone, premium composition with strong product placement.',
        hashtags: '#NorthstarCollective #ShelfStyling #DailyRituals',
        paymentTerms: 'Paid after post goes live',
        agreedPrice: 295,
        budgetRangeMin: 250,
        budgetRangeMax: 330,
        postingDeadline: daysFromNow(7),
        campaignStartDate: daysAgo(1),
        campaignEndDate: daysFromNow(9),
        brandMessage: 'This is a strong fit for your aesthetic home and lifestyle audience.',
        status: 'viewed',
        sentAt: daysAgo(3),
        viewedAt: daysAgo(2),
    },
    {
        influencerEmail: 'inf4@porchest.com',
        campaignTitle: 'Desk-to-Daily Grooming Feature',
        campaignDescription: 'Introduce a creator productivity audience to the brand through a minimalist morning setup routine.',
        campaignType: 'ugc',
        deliverables: '1 UGC Reel',
        requiredElements: 'Desk setup transition, product close-up, quick routine framing',
        videoLength: '20-30 seconds',
        contentGuidelines: 'Clean, fast edits, neutral tech aesthetic, believable daily use.',
        hashtags: '#NorthstarCollective #CreatorRoutine #MorningSetup',
        paymentTerms: '100% after content approval',
        agreedPrice: 365,
        budgetRangeMin: 320,
        budgetRangeMax: 390,
        postingDeadline: daysFromNow(10),
        campaignStartDate: daysAgo(8),
        campaignEndDate: daysAgo(1),
        brandMessage: 'We want to test a grooming crossover angle for productivity-focused creators.',
        status: 'deal_closed',
        sentAt: daysAgo(14),
        viewedAt: daysAgo(13),
        acceptedAt: daysAgo(11),
        dealClosedAt: daysAgo(2),
    },
    {
        influencerEmail: 'inf5@porchest.com',
        campaignTitle: 'Night Routine Kitchen Counter Reel',
        campaignDescription: 'A lifestyle-led integration showing the cleanser and serum during a relaxed home evening reset.',
        campaignType: 'reel',
        deliverables: '3 Feed Posts',
        requiredElements: 'Kitchen-to-sink transition, product shots, direct swipe CTA',
        videoLength: '15 seconds each',
        contentGuidelines: 'Warm home visuals, conversational tone, authentic lifestyle flow.',
        hashtags: '#NorthstarCollective #NightReset #EverydayGlow',
        paymentTerms: 'Paid within 3 working days',
        agreedPrice: 230,
        budgetRangeMin: 200,
        budgetRangeMax: 260,
        postingDeadline: daysAgo(4),
        campaignStartDate: daysAgo(10),
        campaignEndDate: daysAgo(4),
        brandMessage: 'We liked the warmth and hospitality tone of your content for this integration.',
        status: 'rejected',
        rejectionReason: 'Current schedule is full for short-form integrations this month.',
        sentAt: daysAgo(12),
        viewedAt: daysAgo(11),
        rejectedAt: daysAgo(9),
    },
    {
        influencerEmail: 'inf1@porchest.com',
        campaignTitle: 'Weekend Self-Care Reel Sequence',
        campaignDescription: 'Light awareness burst using quick skincare ritual clips during a relaxed weekend routine.',
        campaignType: 'reel',
        deliverables: '4 Feed Posts',
        requiredElements: 'Morning light, application shot, swipe-up CTA',
        videoLength: '15 seconds each',
        contentGuidelines: 'Bright, clean visuals and clear CTA.',
        hashtags: '#NorthstarCollective #WeekendGlow',
        paymentTerms: 'Paid after posting',
        agreedPrice: 180,
        budgetRangeMin: 150,
        budgetRangeMax: 200,
        postingDeadline: daysFromNow(6),
        campaignStartDate: daysAgo(1),
        campaignEndDate: daysFromNow(7),
        brandMessage: 'Quick short-form burst to support the broader glow campaign.',
        status: 'sent',
        sentAt: daysAgo(1),
    },
];

async function seedDemoBrandRequests({ brandUser, brandProfile }) {
    const influencerProfiles = await InfluencerProfile.find({
        contactEmail: { $in: DEMO_CAMPAIGNS.map((item) => item.influencerEmail) },
    }).lean();

    const influencerByEmail = new Map(influencerProfiles.map((profile) => [profile.contactEmail, profile]));

    await CampaignRequest.deleteMany({ brandUserId: brandUser._id });
    await Notification.deleteMany({ $or: [{ recipientUserId: brandUser._id }, { senderName: brandProfile.brandName }] });

    for (const item of DEMO_CAMPAIGNS) {
        const influencerProfile = influencerByEmail.get(item.influencerEmail);
        if (!influencerProfile) continue;

        const requestCode = await generateUniqueCode('REQ', CampaignRequest, 'requestCode');

        await CampaignRequest.create({
            requestCode,
            brandUserId: brandUser._id,
            influencerUserId: influencerProfile.userId,
            brandProfileId: brandProfile._id,
            influencerProfileId: influencerProfile._id,
            campaignTitle: item.campaignTitle,
            campaignDescription: item.campaignDescription,
            campaignType: item.campaignType,
            deliverables: item.deliverables,
            requiredElements: item.requiredElements,
            videoLength: item.videoLength,
            contentGuidelines: item.contentGuidelines,
            hashtags: item.hashtags,
            disclosureRequirements: '#Ad #NorthstarPartner',
            agreedPrice: item.agreedPrice,
            budgetRangeMin: item.budgetRangeMin,
            budgetRangeMax: item.budgetRangeMax,
            paymentTerms: item.paymentTerms,
            postingDeadline: item.postingDeadline,
            campaignStartDate: item.campaignStartDate,
            campaignEndDate: item.campaignEndDate,
            brandMessage: item.brandMessage,
            status: item.status,
            counterOfferPrice: item.counterOfferPrice,
            counterOfferMessage: item.counterOfferMessage,
            rejectionReason: item.rejectionReason,
            sentAt: item.sentAt,
            viewedAt: item.viewedAt,
            acceptedAt: item.acceptedAt,
            rejectedAt: item.rejectedAt,
            negotiationStartedAt: item.negotiationStartedAt,
            dealClosedAt: item.dealClosedAt,
            brandName: brandProfile.brandName,
            brandLogoUrl: brandProfile.logoUrl || brandProfile.instagramDPURL,
            brandCategory: brandProfile.category,
            influencerName: influencerProfile.displayName || influencerProfile.fullName,
            influencerUsername: influencerProfile.instagramUsername,
            influencerProfilePic: influencerProfile.profilePictureUrl,
            influencerNiche: influencerProfile.niche,
            createdAt: item.sentAt,
            updatedAt: item.dealClosedAt || item.negotiationStartedAt || item.acceptedAt || item.rejectedAt || item.viewedAt || item.sentAt,
        });
    }
}

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
            businessName: REALISTIC_BRAND_PROFILE.businessName || REALISTIC_BRAND_PROFILE.brandName,
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

    await seedDemoBrandRequests({ brandUser: user, brandProfile });

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
