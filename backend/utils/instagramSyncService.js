/**
 * instagramSyncService.js
 *
 * Reusable Instagram data synchronization service.
 * Implements the 3-collection architecture: writes Instagram data
 * DIRECTLY inside InfluencerProfile or BrandProfile only.
 */

const InfluencerProfile = require('../models/InfluencerProfile');
const BrandProfile = require('../models/BrandProfile');
const meta = require('./metaOAuth');
const { upsertInsightsRaw, upsertMediaRaw, upsertUserRaw } = require('../services/metaRawStorageService');

function parseGenderAgeDistribution(genderAge = null) {
    if (!genderAge || typeof genderAge !== 'object') {
        return { genderDistribution: null, ageDistribution: null };
    }

    const genderDistribution = {};
    const ageDistribution = {};

    Object.entries(genderAge).forEach(([key, value]) => {
        const [gender, age] = key.split('.');
        if (gender) {
            genderDistribution[gender] = (genderDistribution[gender] || 0) + Number(value || 0);
        }
        if (age) {
            ageDistribution[age] = (ageDistribution[age] || 0) + Number(value || 0);
        }
    });

    return { genderDistribution, ageDistribution };
}

/**
 * Compute a normalised fit score (0–100) for an influencer.
 * Based on engagement rate, follower count, posting frequency, profile completeness.
 */
function computeFitScore(metrics, followersCount, profileComplete) {
    const normalizedER = Math.min((metrics.engagementRate || 0) / 10, 1);
    let followerPts = 0;
    if (followersCount >= 500000) followerPts = 30;
    else if (followersCount >= 100000) followerPts = 22;
    else if (followersCount >= 10000) followerPts = 14;
    else if (followersCount >= 1000) followerPts = 8;
    
    const normalizedFreq = Math.min((metrics.postingFrequency7d || 0) / 3, 1);
    const completePts = profileComplete ? 5 : 0;

    const score = normalizedER * 50 + followerPts + normalizedFreq * 15 + completePts;
    return parseFloat(Math.min(Math.max(score, 0), 100).toFixed(1));
}

/**
 * Full sync pipeline — fetches all available data from Meta and writes
 * it into the respective Profile document (InfluencerProfile or BrandProfile).
 *
 * @param {string} userId - MongoDB user ID
 * @param {string} role - 'influencer' | 'brand'
 * @param {string} accessToken - Valid Meta access token
 * @param {object} [options]
 * @param {boolean} [options.bootstrap=false] - When true, fetch the full media set for the first connection sync.
 * @returns {object} Computed analytics summary
 */
exports.runFullSync = async (userId, role, accessToken, options = {}) => {
    const bootstrap = !!options.bootstrap;
    const syncedAt = new Date();
    // 1. Fetch raw Instagram profile
    const profile = await meta.fetchProfile(accessToken);
    const igUserId = profile.id;

    // 2. Fetch audience demographics from Meta API
    const audienceBundle = await meta.fetchAudienceDemographics(accessToken, igUserId);
    const audienceData = audienceBundle?.parsed || null;

    // 2b. Fetch account insights from Meta API
    const accountInsightsBundle = await meta.fetchAccountInsights(accessToken, igUserId);
    const accountInsights = accountInsightsBundle?.parsed || {};
    const audienceBreakdown = parseGenderAgeDistribution(audienceData?.ageGender);

    // 3. Fetch media. Bootstrap sync pulls the full available set once on connect.
    const mediaList = await meta.fetchMediaList(accessToken, igUserId, {
        allTime: bootstrap,
        days: bootstrap ? null : 60,
        limit: 100,
    });

    let existingProfile = null;
    if (role === 'influencer') {
        existingProfile = await InfluencerProfile.findOne({ userId });
    } else if (role === 'brand') {
        existingProfile = await BrandProfile.findOne({ userId });
    }

    const enrichedMediaList = [];
    const mediaInsightsRaw = [];
    for (const media of mediaList) {
        try {
            const insightBundle = await meta.fetchMediaInsights(accessToken, media.id, media.media_type);
            if (insightBundle?.raw) {
                mediaInsightsRaw.push({
                    targetType: 'media',
                    targetId: media.id,
                    payload: insightBundle.raw,
                });
            }
            enrichedMediaList.push({
                ...media,
                insights: insightBundle?.parsed || {},
            });
        } catch {
            enrichedMediaList.push({
                ...media,
                insights: {},
            });
        }
    }

    await upsertUserRaw({ userId, payload: profile });
    await upsertMediaRaw({ userId, influencerProfileId: existingProfile?._id || null, mediaList });
    await upsertInsightsRaw({
        userId,
        influencerProfileId: existingProfile?._id || null,
        insights: [
            { targetType: 'account', targetId: igUserId, payload: accountInsightsBundle?.raw?.summary || null },
            { targetType: 'online_followers', targetId: igUserId, payload: accountInsightsBundle?.raw?.onlineFollowers || null },
            { targetType: 'audience', targetId: igUserId, payload: audienceBundle?.raw || null },
            ...mediaInsightsRaw,
        ],
    });

    // 4. Compute derived metrics natively
    const metrics = meta.computeDerivedMetrics(profile, enrichedMediaList, existingProfile, accountInsights);
    const followersCount = profile.followers_count || 0;

    // Persist the full 60-day media window so analytics can score every eligible post
    const recentMediaSummary = enrichedMediaList.map(m => ({
        mediaId: m.id,
        mediaUrl: m.media_url,
        thumbnailUrl: m.thumbnail_url || null,
        permalink: m.permalink,
        mediaType: m.media_type,
        caption: (m.caption || '').slice(0, 500),
        likeCount: m.like_count || 0,
        commentsCount: m.comments_count || 0,
        shareCount: Number(m.insights?.shares || 0),
        saveCount: Number(m.insights?.saved || 0),
        playCount: Number(m.insights?.plays || 0),
        reachCount: Number(m.insights?.reach || 0),
        impressionCount: Number(m.insights?.impressions || 0),
        engagementCount: Number((m.like_count || 0) + (m.comments_count || 0) + Number(m.insights?.shares || 0)),
        viewCount: Number((m.media_type === 'VIDEO' || m.media_type === 'REEL') ? (m.insights?.plays || 0) : (m.insights?.reach || 0)),
        timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
    }));

    const historicalSnapshots = Array.isArray(existingProfile?.historicalSnapshots)
        ? [...existingProfile.historicalSnapshots]
        : [];
    const todayKey = new Date().toISOString().slice(0, 10);
    const nextSnapshot = {
        capturedAt: new Date(),
        followersCount,
        engagementRate: metrics.engagementRate || 0,
        accountReach: accountInsights.reach || metrics.totalReach || 0,
        accountImpressions: accountInsights.impressions || metrics.totalImpressions || 0,
        influencerScore: metrics.influencerScore || 0,
    };
    if (historicalSnapshots.length) {
        const lastKey = new Date(historicalSnapshots[historicalSnapshots.length - 1].capturedAt).toISOString().slice(0, 10);
        if (lastKey === todayKey) historicalSnapshots[historicalSnapshots.length - 1] = nextSnapshot;
        else historicalSnapshots.push(nextSnapshot);
    } else {
        historicalSnapshots.push(nextSnapshot);
    }

    // 5. Build the massive structural update object
    const updatePayload = {
        // Identity
        avatar:               profile.profile_picture_url || null,
        profilePictureUrl:    profile.profile_picture_url || null,
        igUserId:             igUserId,
        igUsername:           profile.username || null,
        igProfileUrl:         profile.profile_picture_url || null,
        igBio:                profile.biography || null,
        igWebsite:            profile.website || null,
        igAccountType:        profile.account_type || null,
        igFollowersCount:     followersCount,
        igFollowingCount:     profile.follows_count || 0,
        igMediaCount:         profile.media_count || 0,
        igLastSyncedAt:       syncedAt,
        instagramUserId:       igUserId,
        instagramUsername:     profile.username || null,
        instagramProfileURL:   profile.username ? `https://instagram.com/${profile.username}` : null,
        instagramDPURL:        profile.profile_picture_url || null,
        instagramBiography:    profile.biography || null,
        instagramAccountType:  profile.account_type || null,
        instagramConnected:    true,
        instagramConnectionStatus: 'connected',
        isActive:              true,
        
        // Account Stats
        followersCount:        followersCount,
        followingCount:        profile.follows_count || 0, // Maps nicely
        mediaCount:            profile.media_count || 0,
        postsCount:            enrichedMediaList.filter(m => m.media_type !== 'VIDEO' && m.media_type !== 'REELS').length,
        reelsCount:            enrichedMediaList.filter(m => m.media_type === 'VIDEO' || m.media_type === 'REELS').length,
        profileViews:          accountInsights.profileViews || 0,
        websiteClicks:         accountInsights.websiteClicks || 0,
        accountReach:          accountInsights.reach || 0,
        accountImpressions:    accountInsights.impressions || 0,
        onlineFollowers:       accountInsights.onlineFollowers || null,
        
        lastSyncAt:            new Date(),
        lastAnalyticsRefreshAt: new Date(),
        nextScheduledRefreshAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Next refresh in 24h
        
        'sync.refreshStatus':  'success',
        'sync.refreshError':   null,
        'sync.lastRawFetchAt': new Date(),
        'sync.lastMetricsCalculationAt': new Date()
    };

    if (audienceData && Object.keys(audienceData).length > 0) {
        updatePayload['sync.lastDemographicsCalculationAt'] = new Date();
    }

    // Role Specific Payload additions
    if (role === 'influencer') {
        const isComplete = !!(
            existingProfile?.niche &&
            existingProfile?.country
        );

        updatePayload.engagementRate       = metrics.engagementRate || 0;
        updatePayload.avgLikes             = metrics.avgLikesPerPost || 0;
        updatePayload.avgComments          = metrics.avgCommentsPerPost || 0;
        updatePayload.avgViews             = metrics.avgViewsPerPost || 0;
        updatePayload.avgReach             = metrics.avgReachPerPost || 0;
        updatePayload.avgLikesPerPost      = metrics.avgLikesPerPost || 0;
        updatePayload.avgCommentsPerPost   = metrics.avgCommentsPerPost || 0;
        updatePayload.avgEngagementPerPost = metrics.avgEngagementPerPost || 0;
        updatePayload.averageEngagement    = metrics.averageEngagement || 0;
        updatePayload.averageReach         = metrics.averageReach || 0;
        updatePayload.viewRate             = metrics.viewRate || 0;
        updatePayload.likeToCommentRatio   = metrics.likeToCommentRatio || 0;
        updatePayload.postsAnalyzed        = metrics.postsAnalyzed || recentMediaSummary.length || 0;
        updatePayload.influencerEfficiencyRate = metrics.influencerEfficiencyRate || 0;
        updatePayload.totalReach           = metrics.totalReach || 0;
        updatePayload.totalImpressions     = metrics.totalImpressions || 0;
        updatePayload.totalPlays           = metrics.totalPlays || 0;
        updatePayload.totalShares          = metrics.totalShares || 0;
        updatePayload.totalSaved           = metrics.totalSaved || 0;
        updatePayload.totalEngagements     = metrics.totalEngagements || 0;
        
        updatePayload.postingFrequency     = metrics.postingFrequency || 0;
        updatePayload.postingFrequency7d   = metrics.postingFrequency7d || 0;
        updatePayload.postingFrequency30d  = metrics.postingFrequency30d || 0;
        updatePayload.consistencyRatio     = metrics.consistencyRatio || 0;
        updatePayload.consistencyScore     = metrics.postingConsistencyScore || 0;
        updatePayload.costPerView          = metrics.costPerView;
        updatePayload.costPerEngagement    = metrics.costPerEngagement;
        updatePayload.authenticityScore    = metrics.authenticityScore || 0;
        updatePayload.engagementQualityScore = metrics.engagementQualityScore || 0;
        updatePayload.viralityScore        = metrics.viralityScore || 0;
        updatePayload.influencerScore      = metrics.influencerScore || 0;
        
        updatePayload.topPerformingContentType = metrics.topReelScore > metrics.topPostScore ? 'REELS' : 'POSTS';
        updatePayload.recentMediaSummary   = recentMediaSummary;
        updatePayload.historicalSnapshots  = historicalSnapshots.slice(-60);
        updatePayload.audience            = {
            ageGender: audienceData?.ageGender || null,
            topCountries: audienceData?.topCountries || [],
            topCities: audienceData?.topCities || [],
        };
        updatePayload.demographics         = {
            genderDistribution: audienceBreakdown.genderDistribution,
            ageDistribution: audienceBreakdown.ageDistribution,
            topCountries: audienceData?.topCountries || [],
            topCities: audienceData?.topCities || [],
            languages: existingProfile?.demographics?.languages || null,
            audienceType: existingProfile?.demographics?.audienceType || null,
            onlineFollowers: accountInsights.onlineFollowers || null,
        };
        
        updatePayload.topReelScore         = metrics.topReelScore || 0;
        updatePayload.scoreLabel           = metrics.scoreLabel || 'Average';
        updatePayload.growthRate           = metrics.growthRate || 0;
        updatePayload.fitScore             = computeFitScore(metrics, followersCount, isComplete);
        updatePayload.qualityScore         = metrics.qualityScore || 0;
        updatePayload.profileScore         = metrics.influencerScore || 0;
        updatePayload.credibilityScore     = metrics.authenticityScore || 0;
        updatePayload.scoreBreakdown       = {
            engagementRate: metrics.engagementRate || 0,
            viewRate: metrics.viewRate || 0,
            growthRate: metrics.growthRate || 0,
            consistency: metrics.postingConsistencyScore || 0,
            authenticity: metrics.authenticityScore || 0,
            engagementQualityScore: metrics.engagementQualityScore || 0,
            viralityScore: metrics.viralityScore || 0,
        };

        await InfluencerProfile.findOneAndUpdate(
            { userId },
            { $set: updatePayload },
            { upsert: false } 
        );
        
        console.log(`[syncService] ✅ Influencer ${userId} data written natively. ER=${metrics.engagementRate}%, FitScore=${updatePayload.fitScore}`);
        
    } else if (role === 'brand') {
        updatePayload.engagementRate       = metrics.engagementRate || 0;
        updatePayload.igFollowers          = followersCount;
        updatePayload.igUserId             = igUserId;
        updatePayload.igUsername           = profile.username || null;
        updatePayload.igProfileUrl         = profile.profile_picture_url || null;
        updatePayload.igLastSyncedAt       = syncedAt;
        updatePayload.avgLikesPerPost      = metrics.avgLikesPerPost || 0;
        updatePayload.avgCommentsPerPost   = metrics.avgCommentsPerPost || 0;
        updatePayload.avgEngagementPerPost = metrics.avgEngagementPerPost || 0;
        updatePayload.likeToCommentRatio   = metrics.likeToCommentRatio || 0;
        updatePayload.postsAnalyzed        = metrics.postsAnalyzed || recentMediaSummary.length || 0;
        updatePayload.influencerEfficiencyRate = metrics.influencerEfficiencyRate || 0;
        updatePayload.postingFrequency7d   = metrics.postingFrequency7d || 0;
        updatePayload.postingFrequency30d  = metrics.postingFrequency30d || 0;
        updatePayload.qualityScore         = metrics.qualityScore || 0;
        updatePayload.topPostScore         = metrics.topPostScore || 0;
        updatePayload.topReelScore         = metrics.topReelScore || 0;
        updatePayload.lastSyncedAt         = new Date();

        await BrandProfile.findOneAndUpdate(
            { userId },
            { $set: updatePayload },
            { upsert: false }
        );
        console.log(`[syncService] ✅ Brand ${userId} data written natively.`);
    }

    return { profile, metrics, mediaList: enrichedMediaList };
};

exports.computeFitScore = computeFitScore;
