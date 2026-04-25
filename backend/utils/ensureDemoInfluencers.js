const User = require('../models/User');
const BrandProfile = require('../models/BrandProfile');
const InfluencerProfile = require('../models/InfluencerProfile');
const { generateUniqueCode } = require('./generateCode');

const DEMO_PASSWORD = 'demo_porchest';

const now = new Date();
const daysAgo = (days) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

const buildOnlineFollowerHeatmap = (config) => ({
    '00:00': 24,
    '03:00': 16,
    '06:00': 12,
    '09:00': Math.max(28, Math.round((config.engagementRate || 0) * 8)),
    '12:00': Math.max(42, Math.round((config.engagementRate || 0) * 11)),
    '15:00': Math.max(58, Math.round((config.engagementRate || 0) * 13)),
    '18:00': Math.max(72, Math.round((config.engagementRate || 0) * 15)),
    '21:00': Math.max(66, Math.round((config.engagementRate || 0) * 14)),
});

const buildHistoricalSnapshots = (config) => {
    const points = [];
    const currentFollowers = Number(config.followersCount || 0);
    const currentEngagement = Number(config.engagementRate || 0);
    const currentReach = Number(config.accountReach || config.avgReach || 0);
    const currentImpressions = Number(config.accountImpressions || config.avgImpressions || 0);
    const currentScore = Number(config.fitScore || config.qualityScore || 0);
    const startingFollowers = Math.round(currentFollowers * 0.9);

    for (let index = 0; index < 12; index += 1) {
        const progress = index / 11;
        const engagementSwing = ((index % 4) - 1.5) * 0.14;
        const reachSwing = 1 + (((index % 5) - 2) * 0.045);
        const impressionSwing = 1 + (((index % 3) - 1) * 0.05);

        points.push({
            capturedAt: daysAgo(55 - (index * 5)),
            followersCount: Math.round(startingFollowers + ((currentFollowers - startingFollowers) * progress)),
            engagementRate: Number(Math.max(1.2, currentEngagement - 0.35 + (progress * 0.42) + engagementSwing).toFixed(2)),
            accountReach: Math.round((currentReach || config.avgReach || 0) * (0.78 + (progress * 0.2)) * reachSwing),
            accountImpressions: Math.round((currentImpressions || config.avgImpressions || 0) * (0.8 + (progress * 0.18)) * impressionSwing),
            influencerScore: Math.round(Math.max(65, currentScore - 6 + (progress * 7))),
        });
    }

    return points;
};

const enrichRecentMediaSummary = (config) =>
    (config.recentMediaSummary || []).map((item, index) => {
        const reachBase = config.avgReach || 0;
        const impressionBase = config.avgImpressions || 0;
        const viewBase = config.avgViews || 0;
        const shareBase = config.avgShares || 0;
        const variation = 1 + (((index % 5) - 2) * 0.055);
        const isVideo = item.mediaType === 'VIDEO';
        const viewCount = isVideo ? Math.round(viewBase * variation) : Math.round((viewBase * 0.38) * variation);
        const reachCount = Math.round(reachBase * variation);
        const impressionCount = Math.round(impressionBase * (1 + (((index % 4) - 1.5) * 0.05)));
        const shareCount = Math.max(18, Math.round(shareBase * (1 + (((index % 3) - 1) * 0.08))));
        const saveCount = Math.max(22, Math.round(shareCount * 0.86));
        const engagementCount = Math.round((item.likeCount || 0) + (item.commentsCount || 0) + shareCount + saveCount);

        return {
            ...item,
            thumbnailUrl: item.thumbnailUrl || item.mediaUrl,
            shareCount,
            saveCount,
            playCount: isVideo ? viewCount : 0,
            reachCount,
            impressionCount,
            engagementCount,
            viewCount,
        };
    });

const buildSixtyDayMediaWindow = (items, options = {}) => {
    const targetCount = options.targetCount || 24;
    const intervalDays = options.intervalDays || 2;
    const media = [];

    for (let index = 0; index < targetCount; index += 1) {
        const template = items[index % items.length];
        const cycle = Math.floor(index / items.length);
        const engagementShift = 1 + (((index % 5) - 2) * 0.035);
        const daysBack = Math.min(59, 2 + (index * intervalDays));

        media.push({
            mediaId: `${template.mediaId}-${index + 1}`,
            mediaUrl: template.mediaUrl,
            permalink: `${template.permalink}-${index + 1}`,
            mediaType: template.mediaType,
            caption: cycle === 0 ? template.caption : `${template.caption} Update ${cycle + 1}.`,
            likeCount: Math.max(0, Math.round((template.likeCount || 0) * engagementShift)),
            commentsCount: Math.max(0, Math.round((template.commentsCount || 0) * (1 + (((index % 4) - 1.5) * 0.04)))),
            timestamp: daysAgo(daysBack),
        });
    }

    return media.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

const DEMO_INFLUENCERS = [
    {
        email: 'inf1@porchest.com',
        fullName: 'Areeba Khan',
        displayName: 'Areeba',
        instagramUsername: 'areebacreates',
        niche: 'Fashion',
        country: 'Pakistan',
        city: 'Karachi',
        bio: 'Fashion creator sharing modest streetwear, beauty routines, and polished daily lifestyle content.',
        languages: ['English', 'Urdu'],
        categories: ['Fashion', 'Beauty', 'Lifestyle'],
        profilePictureUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80',
        followersCount: 84200,
        followingCount: 912,
        mediaCount: 386,
        postsCount: 248,
        reelsCount: 138,
        engagementRate: 4.86,
        avgLikes: 3950,
        avgComments: 182,
        avgShares: 164,
        avgViews: 44120,
        avgReach: 33680,
        avgImpressions: 58740,
        avgLikesPerPost: 3950,
        avgCommentsPerPost: 182,
        avgEngagementPerPost: 4296,
        likeToCommentRatio: 21.7,
        postsAnalyzed: 24,
        influencerEfficiencyRate: 51.02,
        postingFrequency: 4,
        postingFrequency7d: 4,
        postingFrequency30d: 16,
        topPerformingContentType: 'Reels',
        avgPostPrice: 220,
        avgReelPrice: 310,
        currency: 'USD',
        profileScore: 97,
        fitScore: 94,
        qualityScore: 92,
        topPostScore: 89,
        topReelScore: 95,
        credibilityScore: 91,
        scoreLabel: 'High Fit',
        demographics: {
            genderDistribution: { Women: 78, Men: 22 },
            ageDistribution: { '18-24': 39, '25-34': 41, '35-44': 14, '45+': 6 },
            topCountries: { Pakistan: 61, UAE: 17, UK: 9, SaudiArabia: 6, Canada: 4, Other: 3 },
            topCities: { Karachi: 27, Lahore: 19, Dubai: 15, Islamabad: 10, London: 7, Other: 22 },
            languages: { English: 57, Urdu: 38, Arabic: 5 },
            audienceType: 'Women interested in beauty and premium modest fashion',
        },
        recentMediaSummary: buildSixtyDayMediaWindow([
            { mediaId: 'ak-1', mediaType: 'VIDEO', mediaUrl: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80', permalink: 'https://instagram.com/p/ak-1', caption: 'Neutral-toned Eid edit with styling details.', likeCount: 4410, commentsCount: 218 },
            { mediaId: 'ak-2', mediaType: 'IMAGE', mediaUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80', permalink: 'https://instagram.com/p/ak-2', caption: 'Silk textures and gold accents for evening wear.', likeCount: 3895, commentsCount: 174 },
            { mediaId: 'ak-3', mediaType: 'CAROUSEL_ALBUM', mediaUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80', permalink: 'https://instagram.com/p/ak-3', caption: '3 outfit formulas for polished brand shoots.', likeCount: 3620, commentsCount: 141 },
            { mediaId: 'ak-4', mediaType: 'VIDEO', mediaUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=80', permalink: 'https://instagram.com/p/ak-4', caption: 'Luxury-accessory reel with soft glam transitions.', likeCount: 4722, commentsCount: 229 },
            { mediaId: 'ak-5', mediaType: 'IMAGE', mediaUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80', permalink: 'https://instagram.com/p/ak-5', caption: 'Behind the scenes from a bridal campaign fitting.', likeCount: 3478, commentsCount: 133 },
            { mediaId: 'ak-6', mediaType: 'VIDEO', mediaUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80', permalink: 'https://instagram.com/p/ak-6', caption: 'Weekend skincare routine with premium products.', likeCount: 4186, commentsCount: 197 },
        ]),
    },
    {
        email: 'inf2@porchest.com',
        fullName: 'Hamza Saeed',
        displayName: 'Hamza',
        instagramUsername: 'hamzafitdaily',
        niche: 'Fitness',
        country: 'Pakistan',
        city: 'Lahore',
        bio: 'Fitness coach and wellness creator focused on sustainable training, recovery, and realistic nutrition.',
        languages: ['English', 'Urdu'],
        categories: ['Fitness', 'Health', 'Wellness'],
        profilePictureUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80',
        followersCount: 126500,
        followingCount: 604,
        mediaCount: 428,
        postsCount: 274,
        reelsCount: 154,
        engagementRate: 5.42,
        avgLikes: 6220,
        avgComments: 241,
        avgShares: 208,
        avgViews: 69850,
        avgReach: 48890,
        avgImpressions: 81140,
        avgLikesPerPost: 6220,
        avgCommentsPerPost: 241,
        avgEngagementPerPost: 6669,
        likeToCommentRatio: 25.81,
        postsAnalyzed: 24,
        influencerEfficiencyRate: 52.72,
        postingFrequency: 5,
        postingFrequency7d: 5,
        postingFrequency30d: 19,
        topPerformingContentType: 'Reels',
        avgPostPrice: 260,
        avgReelPrice: 390,
        currency: 'USD',
        profileScore: 98,
        fitScore: 96,
        qualityScore: 95,
        topPostScore: 92,
        topReelScore: 97,
        credibilityScore: 94,
        scoreLabel: 'Excellent Fit',
        demographics: {
            genderDistribution: { Men: 68, Women: 32 },
            ageDistribution: { '18-24': 34, '25-34': 44, '35-44': 16, '45+': 6 },
            topCountries: { Pakistan: 54, UAE: 18, SaudiArabia: 10, UK: 8, Qatar: 5, Other: 5 },
            topCities: { Lahore: 25, Karachi: 20, Dubai: 16, Riyadh: 9, Islamabad: 8, Other: 22 },
            languages: { English: 61, Urdu: 34, Arabic: 5 },
            audienceType: 'Young professionals and gym beginners seeking practical fitness guidance',
        },
        recentMediaSummary: buildSixtyDayMediaWindow([
            { mediaId: 'hs-1', mediaType: 'VIDEO', mediaUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80', permalink: 'https://instagram.com/p/hs-1', caption: 'Upper-body session with tempo-focused reps.', likeCount: 6912, commentsCount: 256 },
            { mediaId: 'hs-2', mediaType: 'CAROUSEL_ALBUM', mediaUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80', permalink: 'https://instagram.com/p/hs-2', caption: 'Macro-friendly meal ideas for busy weekdays.', likeCount: 5780, commentsCount: 217 },
            { mediaId: 'hs-3', mediaType: 'VIDEO', mediaUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80', permalink: 'https://instagram.com/p/hs-3', caption: 'Mobility routine to fix stiff hips.', likeCount: 6488, commentsCount: 244 },
            { mediaId: 'hs-4', mediaType: 'IMAGE', mediaUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80', permalink: 'https://instagram.com/p/hs-4', caption: 'Post-workout recovery essentials.', likeCount: 5129, commentsCount: 186 },
            { mediaId: 'hs-5', mediaType: 'VIDEO', mediaUrl: 'https://images.unsplash.com/photo-1517832606299-7ae9b720a186?auto=format&fit=crop&w=1200&q=80', permalink: 'https://instagram.com/p/hs-5', caption: '3 common deadlift mistakes and fixes.', likeCount: 7338, commentsCount: 281 },
            { mediaId: 'hs-6', mediaType: 'VIDEO', mediaUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=80', permalink: 'https://instagram.com/p/hs-6', caption: 'Conditioning finisher for cutting phase.', likeCount: 6244, commentsCount: 238 },
        ]),
    },
    {
        email: 'inf3@porchest.com',
        fullName: 'Mina Ali',
        displayName: 'Mina',
        instagramUsername: 'minaathome',
        niche: 'Home & Lifestyle',
        country: 'United Arab Emirates',
        city: 'Dubai',
        bio: 'Home styling and lifestyle storyteller sharing elevated interiors, hosting ideas, and daily rituals.',
        languages: ['English', 'Arabic'],
        categories: ['Home Decor', 'Lifestyle', 'Hosting'],
        profilePictureUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=900&q=80',
        followersCount: 67300,
        followingCount: 488,
        mediaCount: 342,
        postsCount: 226,
        reelsCount: 116,
        engagementRate: 3.97,
        avgLikes: 2480,
        avgComments: 119,
        avgShares: 142,
        avgViews: 28140,
        avgReach: 21820,
        avgImpressions: 37610,
        avgLikesPerPost: 2480,
        avgCommentsPerPost: 119,
        avgEngagementPerPost: 2741,
        likeToCommentRatio: 20.84,
        postsAnalyzed: 24,
        influencerEfficiencyRate: 40.73,
        postingFrequency: 4,
        postingFrequency7d: 3,
        postingFrequency30d: 14,
        topPerformingContentType: 'Carousel',
        avgPostPrice: 240,
        avgReelPrice: 325,
        currency: 'USD',
        profileScore: 95,
        fitScore: 90,
        qualityScore: 91,
        topPostScore: 87,
        topReelScore: 84,
        credibilityScore: 93,
        scoreLabel: 'Strong Fit',
        demographics: {
            genderDistribution: { Women: 81, Men: 19 },
            ageDistribution: { '18-24': 24, '25-34': 46, '35-44': 22, '45+': 8 },
            topCountries: { UAE: 48, SaudiArabia: 15, Kuwait: 10, Egypt: 9, UK: 8, Other: 10 },
            topCities: { Dubai: 30, AbuDhabi: 14, Riyadh: 11, Jeddah: 9, Sharjah: 8, Other: 28 },
            languages: { English: 58, Arabic: 37, Hindi: 5 },
            audienceType: 'Affluent women interested in home refreshes, hosting, and premium lifestyle products',
        },
        recentMediaSummary: buildSixtyDayMediaWindow([
            { mediaId: 'ma-1', mediaType: 'CAROUSEL_ALBUM', mediaUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80', permalink: 'https://instagram.com/p/ma-1', caption: 'Warm-neutral dining setup for Ramadan hosting.', likeCount: 2810, commentsCount: 128 },
            { mediaId: 'ma-2', mediaType: 'IMAGE', mediaUrl: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80', permalink: 'https://instagram.com/p/ma-2', caption: 'Morning light in the reading corner.', likeCount: 2366, commentsCount: 101 },
            { mediaId: 'ma-3', mediaType: 'VIDEO', mediaUrl: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80', permalink: 'https://instagram.com/p/ma-3', caption: 'Kitchen counter reset in under 20 minutes.', likeCount: 2694, commentsCount: 117 },
            { mediaId: 'ma-4', mediaType: 'CAROUSEL_ALBUM', mediaUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80', permalink: 'https://instagram.com/p/ma-4', caption: 'Five details that make a guest room feel hotel-ready.', likeCount: 2542, commentsCount: 109 },
            { mediaId: 'ma-5', mediaType: 'VIDEO', mediaUrl: 'https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1200&q=80', permalink: 'https://instagram.com/p/ma-5', caption: 'Shelf styling with ceramic and brass accents.', likeCount: 2916, commentsCount: 132 },
            { mediaId: 'ma-6', mediaType: 'IMAGE', mediaUrl: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80', permalink: 'https://instagram.com/p/ma-6', caption: 'Soft-linen bedroom palette update.', likeCount: 2298, commentsCount: 96 },
        ]),
    },
    {
        email: 'inf4@porchest.com',
        fullName: 'Noah Siddiqui',
        displayName: 'Noah',
        instagramUsername: 'noahtechnotes',
        niche: 'Technology',
        country: 'Pakistan',
        city: 'Islamabad',
        bio: 'Tech reviewer covering productivity gear, creator setups, mobile launches, and practical software workflows.',
        languages: ['English', 'Urdu'],
        categories: ['Technology', 'Productivity', 'Gadgets'],
        profilePictureUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=80',
        followersCount: 94300,
        followingCount: 732,
        mediaCount: 401,
        postsCount: 251,
        reelsCount: 150,
        engagementRate: 4.21,
        avgLikes: 3610,
        avgComments: 166,
        avgShares: 187,
        avgViews: 51220,
        avgReach: 36210,
        avgImpressions: 64400,
        avgLikesPerPost: 3610,
        avgCommentsPerPost: 166,
        avgEngagementPerPost: 3963,
        likeToCommentRatio: 21.75,
        postsAnalyzed: 24,
        influencerEfficiencyRate: 42.03,
        postingFrequency: 4,
        postingFrequency7d: 4,
        postingFrequency30d: 17,
        topPerformingContentType: 'Reels',
        avgPostPrice: 280,
        avgReelPrice: 410,
        currency: 'USD',
        profileScore: 96,
        fitScore: 93,
        qualityScore: 94,
        topPostScore: 88,
        topReelScore: 93,
        credibilityScore: 95,
        scoreLabel: 'High Fit',
        demographics: {
            genderDistribution: { Men: 74, Women: 26 },
            ageDistribution: { '18-24': 37, '25-34': 43, '35-44': 14, '45+': 6 },
            topCountries: { Pakistan: 47, India: 14, UAE: 11, UK: 9, SaudiArabia: 7, Other: 12 },
            topCities: { Islamabad: 18, Karachi: 16, Lahore: 15, Dubai: 10, Bangalore: 8, Other: 33 },
            languages: { English: 69, Urdu: 24, Hindi: 7 },
            audienceType: 'Tech-forward buyers comparing gadgets and creator tools before purchase',
        },
        recentMediaSummary: buildSixtyDayMediaWindow([
            { mediaId: 'ns-1', mediaType: 'VIDEO', mediaUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80', permalink: 'https://instagram.com/p/ns-1', caption: 'Best creator mic under a mid-range budget.', likeCount: 3848, commentsCount: 171 },
            { mediaId: 'ns-2', mediaType: 'CAROUSEL_ALBUM', mediaUrl: 'https://images.unsplash.com/photo-1496171367470-9ed9a91ea931?auto=format&fit=crop&w=1200&q=80', permalink: 'https://instagram.com/p/ns-2', caption: 'Three laptops I would actually recommend in 2026.', likeCount: 3494, commentsCount: 149 },
            { mediaId: 'ns-3', mediaType: 'VIDEO', mediaUrl: 'https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=1200&q=80', permalink: 'https://instagram.com/p/ns-3', caption: 'Desk setup cable management in one hour.', likeCount: 4012, commentsCount: 188 },
            { mediaId: 'ns-4', mediaType: 'IMAGE', mediaUrl: 'https://images.unsplash.com/photo-1511385348-a52b4a160dc2?auto=format&fit=crop&w=1200&q=80', permalink: 'https://instagram.com/p/ns-4', caption: 'A compact monitor arm that actually feels premium.', likeCount: 3122, commentsCount: 138 },
            { mediaId: 'ns-5', mediaType: 'VIDEO', mediaUrl: 'https://images.unsplash.com/photo-1518773553398-650c184e0bb3?auto=format&fit=crop&w=1200&q=80', permalink: 'https://instagram.com/p/ns-5', caption: 'Phone camera test: indoor, outdoor, low light.', likeCount: 4329, commentsCount: 202 },
            { mediaId: 'ns-6', mediaType: 'CAROUSEL_ALBUM', mediaUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80', permalink: 'https://instagram.com/p/ns-6', caption: 'Apps that keep my content workflow fast.', likeCount: 3355, commentsCount: 147 },
        ]),
    },
    {
        email: 'inf5@porchest.com',
        fullName: 'Sara Imran',
        displayName: 'Sara',
        instagramUsername: 'saraeatswell',
        niche: 'Food',
        country: 'Pakistan',
        city: 'Lahore',
        bio: 'Food storyteller sharing elevated home recipes, cafe discoveries, and warm visual hospitality content.',
        languages: ['English', 'Urdu'],
        categories: ['Food', 'Recipes', 'Lifestyle'],
        profilePictureUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=80',
        followersCount: 58100,
        followingCount: 703,
        mediaCount: 317,
        postsCount: 214,
        reelsCount: 103,
        engagementRate: 5.08,
        avgLikes: 2760,
        avgComments: 143,
        avgShares: 198,
        avgViews: 33840,
        avgReach: 24760,
        avgImpressions: 43120,
        avgLikesPerPost: 2760,
        avgCommentsPerPost: 143,
        avgEngagementPerPost: 3101,
        likeToCommentRatio: 19.3,
        postsAnalyzed: 24,
        influencerEfficiencyRate: 53.37,
        postingFrequency: 4,
        postingFrequency7d: 4,
        postingFrequency30d: 15,
        topPerformingContentType: 'Reels',
        avgPostPrice: 210,
        avgReelPrice: 295,
        currency: 'USD',
        profileScore: 96,
        fitScore: 92,
        qualityScore: 93,
        topPostScore: 86,
        topReelScore: 91,
        credibilityScore: 94,
        scoreLabel: 'High Fit',
        demographics: {
            genderDistribution: { Women: 72, Men: 28 },
            ageDistribution: { '18-24': 29, '25-34': 45, '35-44': 18, '45+': 8 },
            topCountries: { Pakistan: 63, UAE: 12, UK: 8, Canada: 6, SaudiArabia: 5, Other: 6 },
            topCities: { Lahore: 29, Karachi: 17, Islamabad: 10, Dubai: 9, Faisalabad: 6, Other: 29 },
            languages: { English: 55, Urdu: 41, Punjabi: 4 },
            audienceType: 'Urban food lovers looking for trusted recipes and premium kitchen recommendations',
        },
        recentMediaSummary: buildSixtyDayMediaWindow([
            { mediaId: 'si-1', mediaType: 'VIDEO', mediaUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80', permalink: 'https://instagram.com/p/si-1', caption: 'Creamy pistachio dessert cups for small gatherings.', likeCount: 2980, commentsCount: 151 },
            { mediaId: 'si-2', mediaType: 'CAROUSEL_ALBUM', mediaUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80', permalink: 'https://instagram.com/p/si-2', caption: 'Three brunch plates guests always ask for.', likeCount: 2712, commentsCount: 136 },
            { mediaId: 'si-3', mediaType: 'VIDEO', mediaUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1200&q=80', permalink: 'https://instagram.com/p/si-3', caption: 'Cafe-style iced latte at home.', likeCount: 3225, commentsCount: 168 },
            { mediaId: 'si-4', mediaType: 'IMAGE', mediaUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80', permalink: 'https://instagram.com/p/si-4', caption: 'Stoneware table styling for dinner shoots.', likeCount: 2484, commentsCount: 118 },
            { mediaId: 'si-5', mediaType: 'VIDEO', mediaUrl: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=1200&q=80', permalink: 'https://instagram.com/p/si-5', caption: 'Weeknight spicy pasta in under 25 minutes.', likeCount: 3361, commentsCount: 177 },
            { mediaId: 'si-6', mediaType: 'CAROUSEL_ALBUM', mediaUrl: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=1200&q=80', permalink: 'https://instagram.com/p/si-6', caption: 'Kitchen staples I always repurchase.', likeCount: 2602, commentsCount: 129 },
        ]),
    },
];

async function upsertDemoInfluencerAccount(config) {
    let user = await User.findOne({ email: config.email });
    let profile = null;

    if (!user) {
        user = await User.create({
            userCode: await generateUniqueCode('USR', User, 'userCode'),
            role: 'influencer',
            email: config.email,
            password: DEMO_PASSWORD,
            status: 'active',
            isVerified: true,
            instagramConnected: true,
            profileCompletionStatus: true,
        });
    } else {
        user.role = 'influencer';
        user.status = 'active';
        user.isVerified = true;
        user.profileCompletionStatus = true;
        user.instagramConnected = true;
        user.password = DEMO_PASSWORD;
    }

    await BrandProfile.deleteMany({ $or: [{ userId: user._id }, { _id: user.brandProfileId || null }] });
    user.set('brandProfileId', undefined);

    if (user.influencerProfileId) {
        profile = await InfluencerProfile.findById(user.influencerProfileId);
    }
    if (!profile) {
        profile = await InfluencerProfile.findOne({ userId: user._id });
    }
    if (!profile) {
        profile = await InfluencerProfile.findOne({
            $or: [
                { contactEmail: config.email },
                { instagramUsername: config.instagramUsername },
            ],
        });
    }
    if (profile && profile.userId && String(profile.userId) !== String(user._id)) {
        const linkedUser = await User.findById(profile.userId);
        if (!linkedUser) {
            profile.userId = user._id;
        }
    }

    const enrichedMediaSummary = enrichRecentMediaSummary(config);
    const baseProfile = {
        totalReach: Math.round((config.avgReach || 0) * config.recentMediaSummary.length),
        totalImpressions: Math.round((config.avgImpressions || 0) * config.recentMediaSummary.length),
        totalPlays: Math.round((config.avgViews || 0) * Math.max(1, config.reelsCount ? Math.min(config.recentMediaSummary.length, Math.round(config.recentMediaSummary.length * 0.55)) : config.recentMediaSummary.length)),
        totalShares: Math.round((config.avgShares || 0) * config.recentMediaSummary.length),
        totalSaved: Math.round(((config.avgShares || 0) * 0.75) * config.recentMediaSummary.length),
        totalEngagements: Math.round((config.avgEngagementPerPost || 0) * config.recentMediaSummary.length),
        averageEngagement: config.avgEngagementPerPost,
        averageReach: config.avgReach,
        viewRate: config.followersCount > 0 ? Number((((config.avgViews || 0) / config.followersCount) * 100).toFixed(2)) : 0,
        profileViews: Math.round((config.followersCount || 0) * 0.06),
        websiteClicks: Math.round((config.followersCount || 0) * 0.004),
        accountReach: Math.round((config.avgReach || 0) * Math.min(7, config.postingFrequency30d || 1)),
        accountImpressions: Math.round((config.avgImpressions || 0) * Math.min(7, config.postingFrequency30d || 1)),
        consistencyRatio: 0.82,
        consistencyScore: 82,
        costPerView: config.avgViews > 0 ? Number((config.avgPostPrice / config.avgViews).toFixed(4)) : null,
        costPerEngagement: config.avgEngagementPerPost > 0 ? Number((config.avgPostPrice / config.avgEngagementPerPost).toFixed(4)) : null,
        authenticityScore: Math.min(100, (config.credibilityScore || 0) + 3),
        engagementQualityScore: config.avgLikes > 0 ? Number(((config.avgComments / config.avgLikes) * 100).toFixed(2)) : 0,
        viralityScore: config.followersCount > 0 ? Number((((config.avgViews || 0) / config.followersCount) * 100).toFixed(2)) : 0,
        influencerScore: config.fitScore,
        userId: user._id,
        username: config.instagramUsername,
        displayName: config.displayName,
        fullName: config.fullName,
        contactEmail: config.email,
        bio: config.bio,
        profilePictureUrl: config.profilePictureUrl,
        platform: 'Instagram',
        instagramAccountId: `demo_${config.instagramUsername}`,
        instagramUsername: config.instagramUsername,
        instagramAccountType: 'CREATOR',
        isVerified: true,
        profileUrl: `https://www.instagram.com/${config.instagramUsername}/`,
        country: config.country,
        city: config.city,
        languages: config.languages,
        niche: config.niche,
        categories: config.categories,
        profileCompletionStatus: true,
        verificationStatus: 'verified',
        instagramConnected: true,
        instagramConnectionStatus: 'connected',
        lastConnectedAt: now,
        isActive: true,
        isSearchable: true,
        lastSyncAt: now,
        lastAnalyticsRefreshAt: now,
        nextScheduledRefreshAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        followersCount: config.followersCount,
        followingCount: config.followingCount,
        mediaCount: config.mediaCount,
        postsCount: config.postsCount,
        reelsCount: config.reelsCount,
        engagementRate: config.engagementRate,
        avgLikes: config.avgLikes,
        avgComments: config.avgComments,
        avgShares: config.avgShares,
        avgViews: config.avgViews,
        avgReach: config.avgReach,
        avgImpressions: config.avgImpressions,
        avgLikesPerPost: config.avgLikesPerPost,
        avgCommentsPerPost: config.avgCommentsPerPost,
        avgEngagementPerPost: config.avgEngagementPerPost,
        likeToCommentRatio: config.likeToCommentRatio,
        postsAnalyzed: config.recentMediaSummary.length,
        influencerEfficiencyRate: config.influencerEfficiencyRate,
        postingFrequency: config.postingFrequency,
        postingFrequency7d: config.postingFrequency7d,
        postingFrequency30d: config.postingFrequency30d,
        topPerformingContentType: config.topPerformingContentType,
        historicalSnapshots: buildHistoricalSnapshots({
            ...config,
            accountReach: Math.round((config.avgReach || 0) * Math.min(7, config.postingFrequency30d || 1)),
            accountImpressions: Math.round((config.avgImpressions || 0) * Math.min(7, config.postingFrequency30d || 1)),
        }),
        demographics: config.demographics,
        onlineFollowers: buildOnlineFollowerHeatmap(config),
        avgPostPrice: config.avgPostPrice,
        avgReelPrice: config.avgReelPrice,
        currency: config.currency,
        profileScore: config.profileScore,
        fitScore: config.fitScore,
        qualityScore: config.qualityScore,
        topPostScore: config.topPostScore,
        topReelScore: config.topReelScore,
        credibilityScore: config.credibilityScore,
        scoreLabel: config.scoreLabel,
        scoreBreakdown: {
            audienceQuality: config.qualityScore,
            contentStrength: config.profileScore,
            pricingPower: Math.round(((config.avgPostPrice + config.avgReelPrice) / 2)),
            trustSignal: config.credibilityScore,
        },
        sync: {
            source: 'Instagram Demo Dataset',
            lastRawFetchAt: now,
            lastMetricsCalculationAt: now,
            lastDemographicsCalculationAt: now,
            refreshStatus: 'success',
            refreshError: null,
            retryCount: 0,
            oauthState: null,
            accessToken: 'demo_access_token',
            longLivedToken: 'demo_long_lived_token',
            tokenExpiresAt: daysAgo(-45),
        },
        recentMediaSummary: enrichedMediaSummary,
    };

    if (!profile) {
        profile = new InfluencerProfile({
            influencerProfileId: await generateUniqueCode('INF', InfluencerProfile, 'influencerProfileId'),
            ...baseProfile,
        });
    } else {
        Object.assign(profile, baseProfile);
    }

    await profile.save();
    user.influencerProfileId = profile._id;
    await user.save();

    return { email: user.email, instagramUsername: profile.instagramUsername };
}

async function ensureDemoInfluencers() {
    const created = [];
    for (const influencer of DEMO_INFLUENCERS) {
        const result = await upsertDemoInfluencerAccount(influencer);
        created.push(result);
    }

    console.log(`[Bootstrap] Demo influencer accounts ensured: ${created.map((entry) => entry.email).join(', ')}`);
    return created;
}

module.exports = {
    DEMO_PASSWORD,
    DEMO_INFLUENCERS,
    ensureDemoInfluencers,
};
