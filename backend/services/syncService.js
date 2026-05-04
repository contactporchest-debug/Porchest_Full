const User = require('../models/User');
const InfluencerProfile = require('../models/InfluencerProfile');
const BrandProfile = require('../models/BrandProfile');
const CampaignRequest = require('../models/CampaignRequest');
const instagramService = require('./instagramService');
const {
    fetchIgProfile,
    fetchIgAccountInsights,
    fetchRecentMedia,
    fetchAudienceDemographics,
    fetchLinkedIgAccountForPage,
    isInvalidTokenError,
} = instagramService;
const {
    computeEngagementRate,
    computeFollowerTier,
    computePostingFrequency,
    computePorchestScore,
    computeAuthenticityScore,
    computeAudienceBrandFitScore,
} = require('./metricsService');

const ONE_HOUR_MS = 60 * 60 * 1000;

function toNumber(value, fallback = 0) {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
}

function average(values = [], decimals = 0) {
    const valid = values.map((value) => toNumber(value)).filter((value) => Number.isFinite(value));
    if (!valid.length) return 0;
    const result = valid.reduce((sum, value) => sum + value, 0) / valid.length;
    return Number(result.toFixed(decimals));
}

function getProfileSyncToken(profile) {
    return profile?.sync?.longLivedToken || profile?.sync?.accessToken || null;
}

async function markProfileSyncFailure(ProfileModel, profileId, message, extra = {}) {
    const now = new Date();
    const update = {
        'sync.refreshStatus': 'failed',
        'sync.refreshError': message,
        'sync.lastRawFetchAt': now,
        'sync.lastMetricsCalculationAt': now,
        'sync.lastDemographicsCalculationAt': now,
        igLastSyncedAt: now,
    };

    if (isInvalidTokenError(extra.error)) {
        update['sync.tokenExpiresAt'] = now;
        update.instagramConnectionStatus = 'token_expired';
        update['sync.accessToken'] = null;
        update['sync.longLivedToken'] = null;
    }

    await ProfileModel.findOneAndUpdate(
        { _id: profileId },
        {
            $set: update,
        },
        { strict: false, new: true }
    );
}

function buildMediaSummary(posts) {
    return posts.map((post) => ({
        mediaId: post.mediaId,
        mediaUrl: post.permalink,
        thumbnailUrl: post.permalink,
        permalink: post.permalink,
        mediaType: post.mediaType,
        caption: '',
        likeCount: post.likeCount,
        commentsCount: post.commentsCount,
        shareCount: post.shares,
        saveCount: post.saves,
        playCount: post.videoViews,
        reachCount: post.reach,
        impressionCount: post.impressions,
        engagementCount: toNumber(post.likeCount) + toNumber(post.commentsCount) + toNumber(post.saves) + toNumber(post.shares),
        viewCount: post.videoViews,
        timestamp: post.timestamp,
    }));
}

/**
 * Sync influencer Instagram data and computed metrics.
 * @param {string} userId
 * @returns {Promise<{ success: boolean, syncedAt?: Date, error?: string }>}
 */
async function syncInfluencer(userId) {
    const syncedAt = new Date();
    try {
        const user = await User.findById(userId).lean();
        if (!user) {
            return { success: false, error: 'User not found' };
        }

        const influencerProfile = await InfluencerProfile.findOne({ userId });
        if (!influencerProfile) {
            return { success: false, error: 'Influencer profile not found' };
        }

        const accessToken = getProfileSyncToken(influencerProfile);
        if (!accessToken) {
            return { success: false, error: 'Instagram access token not connected' };
        }

        let igUserId = influencerProfile.igUserId;
        if (!igUserId) {
            const meProfile = await fetchIgProfile(accessToken, 'me');
            igUserId = meProfile.id;
        }

        const [profile, insightsBundle, posts, demographics] = await Promise.all([
            fetchIgProfile(accessToken, igUserId),
            fetchIgAccountInsights(accessToken, igUserId),
            fetchRecentMedia(accessToken, igUserId),
            fetchAudienceDemographics(accessToken, igUserId),
        ]);

        const followersCount = toNumber(profile.followers_count);
        const engagementRate = computeEngagementRate(posts);
        const postingFrequency = computePostingFrequency(posts);
        const followerTier = computeFollowerTier(followersCount);
        const porchestScore = computePorchestScore(engagementRate, followersCount, 50);
        const authenticityScore = computeAuthenticityScore(followersCount, engagementRate, postingFrequency);
        const avgReachPerPost = Math.round(average(posts.map((post) => post.reach), 0));
        const avgImpressionsPerPost = Math.round(average(posts.map((post) => post.impressions), 0));
        const avgSavesPerPost = Number(average(posts.map((post) => post.saves), 1).toFixed(1));
        const avgSharesPerPost = Number(average(posts.map((post) => post.shares), 1).toFixed(1));
        const recentMediaSummary = buildMediaSummary(posts);

        await InfluencerProfile.findOneAndUpdate(
            { userId },
            {
                $set: {
                    igUserId,
                    igUsername: profile.username,
                    igProfileUrl: profile.profile_picture_url,
                    igBio: profile.biography,
                    igWebsite: profile.website,
                    igAccountType: profile.account_type,
                    igFollowersCount: followersCount,
                    igFollowingCount: toNumber(profile.follows_count),
                    igMediaCount: toNumber(profile.media_count),
                    followersCount,
                    followingCount: toNumber(profile.follows_count),
                    mediaCount: toNumber(profile.media_count),
                    avgEngagementRate: engagementRate,
                    followerTier,
                    postingFrequency,
                    porchestScore,
                    authenticityScore,
                    avgReachPerPost,
                    avgImpressionsPerPost,
                    avgSavesPerPost,
                    avgSharesPerPost,
                    totalReach90d: insightsBundle.aggregates.totalReach90d,
                    totalImpressions90d: insightsBundle.aggregates.totalImpressions90d,
                    totalProfileViews90d: insightsBundle.aggregates.totalProfileViews90d,
                    totalWebsiteClicks90d: insightsBundle.aggregates.totalWebsiteClicks90d,
                    followerGrowth90d: insightsBundle.aggregates.followerGrowth90d,
                    audience: {
                        ageGender: demographics.ageGender,
                        topCities: demographics.topCities,
                        topCountries: demographics.topCountries,
                    },
                    demographics: {
                        genderDistribution: demographics.ageGender,
                        topCities: demographics.topCities,
                        topCountries: demographics.topCountries,
                    },
                    recentMediaSummary,
                    igLastSyncedAt: syncedAt,
                    lastSyncAt: syncedAt,
                    'sync.refreshStatus': 'success',
                    'sync.refreshError': null,
                    'sync.lastRawFetchAt': syncedAt,
                    'sync.lastMetricsCalculationAt': syncedAt,
                    'sync.lastDemographicsCalculationAt': syncedAt,
                    'sync.longLivedToken': accessToken,
                },
            },
            { upsert: true, new: true, strict: false }
        );

        return { success: true, syncedAt };
    } catch (error) {
        console.error(`[Sync] syncInfluencer failed for userId=${userId}:`, error);
        try {
            const profile = await InfluencerProfile.findOne({ userId }).lean();
            if (profile) {
                await markProfileSyncFailure(InfluencerProfile, profile._id, error.message, { error });
            }
        } catch (innerError) {
            console.error('[Sync] Failed to mark influencer sync failure:', innerError);
        }
        return { success: false, error: error.message || 'Influencer sync failed' };
    }
}

/**
 * Sync brand Instagram data and computed metrics.
 * @param {string} userId
 * @returns {Promise<{ success: boolean, syncedAt?: Date, error?: string }>}
 */
async function syncBrand(userId) {
    const syncedAt = new Date();
    try {
        const user = await User.findById(userId).lean();
        if (!user) {
            return { success: false, error: 'User not found' };
        }

        const brandProfile = await BrandProfile.findOne({ userId });
        if (!brandProfile) {
            return { success: false, error: 'Brand profile not found' };
        }

        const accessToken = getProfileSyncToken(brandProfile);
        if (!accessToken) {
            return { success: false, error: 'Instagram access token not connected' };
        }

        let igUserId = brandProfile.igUserId;
        if (!igUserId) {
            const pageId = brandProfile.linkedPageId || brandProfile.pageId || brandProfile.facebookPageId;
            if (!pageId) {
                return { success: false, error: 'Brand profile missing linked pageId' };
            }
            igUserId = await fetchLinkedIgAccountForPage(accessToken, pageId);
            if (!igUserId) {
                return { success: false, error: 'Linked Instagram business account not found' };
            }
        }

        const [profile, insightsBundle, posts, demographics] = await Promise.all([
            fetchIgProfile(accessToken, igUserId),
            fetchIgAccountInsights(accessToken, igUserId),
            fetchRecentMedia(accessToken, igUserId),
            fetchAudienceDemographics(accessToken, igUserId),
        ]);

        const followersCount = toNumber(profile.followers_count);
        const engagementRate = computeEngagementRate(posts);
        const postingFrequency = computePostingFrequency(posts);
        const followerTier = computeFollowerTier(followersCount);
        const avgReachPerPost = Math.round(average(posts.map((post) => post.reach), 0));
        const avgImpressionsPerPost = Math.round(average(posts.map((post) => post.impressions), 0));
        const avgSavesPerPost = Number(average(posts.map((post) => post.saves), 1).toFixed(1));
        const avgSharesPerPost = Number(average(posts.map((post) => post.shares), 1).toFixed(1));

        await BrandProfile.findOneAndUpdate(
            { userId },
            {
                $set: {
                    igUserId,
                    igUsername: profile.username,
                    igProfileUrl: profile.profile_picture_url,
                    igFollowers: followersCount,
                    followersCount,
                    followsCount: toNumber(profile.follows_count),
                    mediaCount: toNumber(profile.media_count),
                    brandInstagramUserId: igUserId,
                    brandInstagramUsername: profile.username,
                    brandInstagramProfileUrl: profile.profile_picture_url,
                    brandInstagramBio: profile.biography,
                    brandInstagramWebsite: profile.website,
                    brandInstagramAccountType: profile.account_type,
                    brandInstagramFollowersCount: followersCount,
                    brandInstagramFollowingCount: toNumber(profile.follows_count),
                    brandInstagramMediaCount: toNumber(profile.media_count),
                    brandInstagramAvgReachPerPost: avgReachPerPost,
                    brandInstagramAvgImpressionsPerPost: avgImpressionsPerPost,
                    brandInstagramAvgSavesPerPost: avgSavesPerPost,
                    brandInstagramAvgSharesPerPost: avgSharesPerPost,
                    brandInstagramPostingFrequency: postingFrequency,
                    brandInstagramEngagementRate: engagementRate,
                    brandInstagramFollowerTier: followerTier,
                    brandInstagramTotalReach90d: insightsBundle.aggregates.totalReach90d,
                    brandInstagramTotalImpressions90d: insightsBundle.aggregates.totalImpressions90d,
                    brandInstagramTotalProfileViews90d: insightsBundle.aggregates.totalProfileViews90d,
                    brandInstagramTotalWebsiteClicks90d: insightsBundle.aggregates.totalWebsiteClicks90d,
                    brandInstagramFollowerGrowth90d: insightsBundle.aggregates.followerGrowth90d,
                    targetAudienceDemographics: demographics,
                    igLastSyncedAt: syncedAt,
                    lastSyncedAt: syncedAt,
                    'sync.refreshStatus': 'success',
                    'sync.refreshError': null,
                    'sync.lastRawFetchAt': syncedAt,
                    'sync.lastMetricsCalculationAt': syncedAt,
                    'sync.lastDemographicsCalculationAt': syncedAt,
                    'sync.longLivedToken': accessToken,
                },
            },
            { upsert: true, new: true, strict: false }
        );

        return { success: true, syncedAt };
    } catch (error) {
        console.error(`[Sync] syncBrand failed for userId=${userId}:`, error);
        try {
            const profile = await BrandProfile.findOne({ userId }).lean();
            if (profile) {
                await markProfileSyncFailure(BrandProfile, profile._id, error.message, { error });
            }
        } catch (innerError) {
            console.error('[Sync] Failed to mark brand sync failure:', innerError);
        }
        return { success: false, error: error.message || 'Brand sync failed' };
    }
}

/**
 * Sync live post metrics for a collaboration.
 * @param {string} collaborationId
 * @returns {Promise<{ success: boolean, metrics?: object, error?: string }>}
 */
async function syncCollaborationMetrics(collaborationId) {
    try {
        const collaboration = await CampaignRequest.findById(collaborationId);
        if (!collaboration) {
            return { success: false, error: 'Collaboration not found' };
        }

        const influencerProfile = await InfluencerProfile.findById(collaboration.influencerId || collaboration.influencerProfileId);
        if (!influencerProfile) {
            return { success: false, error: 'Influencer profile not found' };
        }

        const accessToken = getProfileSyncToken(influencerProfile);
        if (!accessToken) {
            return { success: false, error: 'Instagram access token not connected' };
        }

        if (!influencerProfile.igUserId) {
            return { success: false, error: 'Influencer Instagram account not connected' };
        }

        const finalPostLink = collaboration.content?.postLink || collaboration.postLink || null;
        if (!finalPostLink) {
            return { success: false, error: 'Post link not submitted' };
        }

        const recentMedia = await fetchRecentMedia(accessToken, influencerProfile.igUserId);
        const normalizedLink = String(finalPostLink || '').replace(/\/?$/, '/');
        const matchedPost = recentMedia.find((item) => String(item.permalink || '').replace(/\/?$/, '/') === normalizedLink);

        if (!matchedPost) {
            return { success: false, error: 'Unable to resolve media ID from post link' };
        }

        const likes = toNumber(matchedPost.likeCount);
        const comments = toNumber(matchedPost.commentsCount);
        const reach = toNumber(matchedPost.reach);
        const impressions = toNumber(matchedPost.impressions);
        const saves = toNumber(matchedPost.saves);
        const shares = toNumber(matchedPost.shares);
        const postER = reach > 0 ? Number((((likes + comments + saves + shares) / reach) * 100).toFixed(2)) : 0;

        const updated = await CampaignRequest.findByIdAndUpdate(
            collaborationId,
            {
                $set: {
                    'metrics.reach': Math.round(reach),
                    'metrics.impressions': Math.round(impressions),
                    'metrics.engagementRate': postER,
                    'metrics.lastUpdatedAt': new Date(),
                    'metrics.roas': collaboration.agreedFee ? Number(((toNumber(collaboration.metrics?.revenue) || 0) / collaboration.agreedFee).toFixed(2)) : 0,
                    'metrics.cpa': collaboration.metrics?.conversions ? Number((collaboration.agreedFee / collaboration.metrics.conversions).toFixed(2)) : 0,
                },
            },
            { new: true, strict: false }
        );

        return {
            success: true,
            metrics: updated?.metrics || {
                reach: Math.round(reach),
                impressions: Math.round(impressions),
                engagementRate: postER,
                lastUpdatedAt: new Date(),
            },
        };
    } catch (error) {
        console.error(`[Sync] syncCollaborationMetrics failed for collaborationId=${collaborationId}:`, error);
        return { success: false, error: error.message || 'Collaboration metric sync failed' };
    }
}

module.exports = {
    syncInfluencer,
    syncBrand,
    syncCollaborationMetrics,
};
