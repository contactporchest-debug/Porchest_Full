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
 * @returns {object} Computed analytics summary
 */
exports.runFullSync = async (userId, role, accessToken) => {
    // 1. Fetch raw Instagram profile
    const profile = await meta.fetchProfile(accessToken);
    const igUserId = profile.id;

    // 2. Fetch audience demographics from Meta API
    const audienceData = await meta.fetchAudienceDemographics(accessToken, igUserId);

    // 3. Fetch media (limit to 30 for performance, keeping recent only as per rules)
    const mediaList = await meta.fetchMediaList(accessToken, igUserId);
    
    // We optionally extract comments/insights for the top 5 recent posts to compute rich metrics,
    // but we don't save raw comments to a Detached Collection anymore.
    const topPosts = [...mediaList]
        .sort((a, b) => ((b.like_count || 0) + (b.comments_count || 0)) - ((a.like_count || 0) + (a.comments_count || 0)))
        .slice(0, 5);
        
    let overallSaves = 0;
    let overallReach = 0;
    for (const post of topPosts) {
        try {
            const insights = await meta.fetchMediaInsights(accessToken, post.id, post.media_type);
            if (insights) {
                overallReach += (insights.reach || 0);
                overallSaves += (insights.saved || insights.saves || 0);
            }
        } catch {
            // Silently skip if insights aren't available for this post/account type
        }
    }

    // 4. Compute derived metrics natively
    const metrics = meta.computeDerivedMetrics(profile, mediaList);
    const followersCount = profile.followers_count || 0;

    // Build the Recent Media Summary block (save only top 12 posts)
    const recentMediaSummary = mediaList.slice(0, 12).map(m => ({
        mediaId: m.id,
        mediaUrl: m.media_url,
        permalink: m.permalink,
        mediaType: m.media_type,
        caption: (m.caption || '').slice(0, 500),
        likeCount: m.like_count || 0,
        commentsCount: m.comments_count || 0,
        timestamp: m.timestamp ? new Date(m.timestamp) : new Date()
    }));

    // 5. Build the massive structural update object
    const updatePayload = {
        // Identity
        instagramUserId:       igUserId,
        instagramUsername:     profile.username || null,
        instagramProfileURL:   profile.username ? `https://instagram.com/${profile.username}` : null,
        instagramDPURL:        profile.profile_picture_url || null,
        instagramBiography:    profile.biography || null,
        instagramAccountType:  profile.account_type || null,
        instagramConnectionStatus: 'connected',
        isActive:              true,
        
        // Account Stats
        followersCount:        followersCount,
        followingCount:        profile.follows_count || 0, // Maps nicely
        mediaCount:            profile.media_count || 0,
        postsCount:            mediaList.filter(m => m.media_type !== 'VIDEO' && m.media_type !== 'REELS').length,
        reelsCount:            mediaList.filter(m => m.media_type === 'VIDEO' || m.media_type === 'REELS').length,
        
        lastSyncAt:            new Date(),
        lastAnalyticsRefreshAt: new Date(),
        nextScheduledRefreshAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // Next refresh in 48h
        
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
        const existingProfile = await InfluencerProfile.findOne({ userId });
        const isComplete = !!(
            existingProfile?.niche &&
            existingProfile?.country
        );

        updatePayload.engagementRate       = metrics.engagementRate || 0;
        updatePayload.avgLikes             = metrics.avgLikesPerPost || 0;
        updatePayload.avgComments          = metrics.avgCommentsPerPost || 0;
        updatePayload.avgLikesPerPost      = metrics.avgLikesPerPost || 0;
        updatePayload.avgCommentsPerPost   = metrics.avgCommentsPerPost || 0;
        updatePayload.avgEngagementPerPost = metrics.avgEngagementPerPost || 0;
        updatePayload.likeToCommentRatio   = metrics.likeToCommentRatio || 0;
        updatePayload.postsAnalyzed        = metrics.postsAnalyzed || 0;
        updatePayload.influencerEfficiencyRate = metrics.influencerEfficiencyRate || 0;
        
        updatePayload.postingFrequency     = metrics.postingFrequency7d || 0;
        updatePayload.postingFrequency7d   = metrics.postingFrequency7d || 0;
        updatePayload.postingFrequency30d  = metrics.postingFrequency30d || 0;
        
        updatePayload.topPerformingContentType = metrics.topReelScore > metrics.topPostScore ? 'REELS' : 'POSTS';
        updatePayload.recentMediaSummary   = recentMediaSummary;
        
        // Quality Scores
        updatePayload.qualityScore         = metrics.qualityScore || 0;
        updatePayload.topPostScore         = metrics.topPostScore || 0;
        updatePayload.topReelScore         = metrics.topReelScore || 0;
        
        // Native Demographics structure
        if (audienceData) {
            updatePayload.demographics = {
                genderDistribution: audienceData.genderAge || null,
                ageDistribution: audienceData.genderAge || null,
                topCountries: audienceData.countries || null,
                topCities: audienceData.cities || null,
            };
        }

        updatePayload.fitScore = computeFitScore(metrics, followersCount, isComplete);
        updatePayload.scoreLabel = updatePayload.fitScore >= 80 ? 'Excellent Match' : updatePayload.fitScore >= 50 ? 'Good Match' : 'Fair Match';

        await InfluencerProfile.findOneAndUpdate(
            { userId },
            { $set: updatePayload },
            { upsert: false } 
        );
        
        console.log(`[syncService] ✅ Influencer ${userId} data written natively. ER=${metrics.engagementRate}%, FitScore=${updatePayload.fitScore}`);
        
    } else if (role === 'brand') {
        await BrandProfile.findOneAndUpdate(
            { userId },
            { $set: updatePayload },
            { upsert: false }
        );
        console.log(`[syncService] ✅ Brand ${userId} data written natively.`);
    }

    return { profile, metrics, mediaList };
};

exports.computeFitScore = computeFitScore;
