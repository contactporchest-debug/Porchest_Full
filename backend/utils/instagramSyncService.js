/**
 * instagramSyncService.js
 *
 * Reusable Instagram data synchronization service for BOTH brand and influencer.
 *
 * WRITE-THROUGH PATTERN:
 * After computing all metrics + demographics, this service promotes the
 * current structured summary back into InfluencerProfile so that it
 * becomes the single source of truth for the product UI.
 *
 * Supporting raw collections (InstagramAccount, InstagramAccountDailyStat,
 * InstagramDerivedMetric, etc.) are kept for historical/audit purposes only.
 */

const InstagramAccount = require('../models/InstagramAccount');
const InstagramAccountDailyStat = require('../models/InstagramAccountDailyStat');
const InstagramMedia = require('../models/InstagramMedia');
const InstagramMediaInsight = require('../models/InstagramMediaInsight');
const InstagramComment = require('../models/InstagramComment');
const InstagramDerivedMetric = require('../models/InstagramDerivedMetric');
const InstagramConnection = require('../models/InstagramConnection');
const InfluencerProfile = require('../models/InfluencerProfile');
const meta = require('./metaOAuth');

/**
 * Compute a normalised fit score (0–100) for an influencer.
 * Based on engagement rate, follower count, posting frequency, profile completeness.
 */
function computeFitScore(metrics, followersCount, profileComplete) {
    // Engagement rate component — capped at 10% for normalisation, worth 50pts
    const normalizedER = Math.min((metrics.engagementRate || 0) / 10, 1);
    // Follower tier component, worth 30pts
    let followerPts = 0;
    if (followersCount >= 500000) followerPts = 30;
    else if (followersCount >= 100000) followerPts = 22;
    else if (followersCount >= 10000) followerPts = 14;
    else if (followersCount >= 1000) followerPts = 8;
    // Posting consistency component (posts/week capped at 3), worth 15pts
    const normalizedFreq = Math.min((metrics.postingFrequency7d || 0) / 3, 1);
    // Profile completeness bonus, worth 5pts
    const completePts = profileComplete ? 5 : 0;

    const score = normalizedER * 50 + followerPts + normalizedFreq * 15 + completePts;
    return parseFloat(Math.min(Math.max(score, 0), 100).toFixed(1));
}

/**
 * Full sync pipeline — fetches all available data from Meta and stores it.
 * Also writes a structured summary back into InfluencerProfile (write-through).
 *
 * @param {string} userId - MongoDB user ID
 * @param {string} role - 'influencer' | 'brand'
 * @param {string} accessToken - Valid Meta access token
 * @param {object} [existingConnection] - The connection doc (to update in place)
 * @returns {object} Computed analytics summary
 */
exports.runFullSync = async (userId, role, accessToken, existingConnection = null) => {
    // 1. Fetch raw Instagram profile
    const profile = await meta.fetchProfile(accessToken);
    const igUserId = profile.id;

    // 2. Store/update raw account snapshot (historical record, not product-facing)
    await InstagramAccount.findOneAndUpdate(
        { userId, role },
        {
            userId, role,
            instagramUserId: igUserId,
            username: profile.username || null,
            name: profile.name || null,
            biography: profile.biography || null,
            website: profile.website || null,
            profilePictureURL: profile.profile_picture_url || null,
            followersCount: profile.followers_count || 0,
            followsCount: profile.follows_count || 0,
            mediaCount: profile.media_count || 0,
            accountType: profile.account_type || null,
            fetchedAt: new Date(),
        },
        { upsert: true, new: true }
    );

    // 3. Fetch audience demographics from Meta API
    const audienceData = await meta.fetchAudienceDemographics(accessToken, igUserId);

    // 4. Daily stats snapshot (one per day — raw historical store)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    await InstagramAccountDailyStat.findOneAndUpdate(
        { userId, role, date: today },
        {
            $set: {
                instagramUserId: igUserId,
                followersCount: profile.followers_count || 0,
                followsCount: profile.follows_count || 0,
                mediaCount: profile.media_count || 0,
                audienceCityJson: audienceData?.cities ? JSON.stringify(audienceData.cities) : null,
                audienceCountryJson: audienceData?.countries ? JSON.stringify(audienceData.countries) : null,
                audienceGenderAgeJson: audienceData?.genderAge ? JSON.stringify(audienceData.genderAge) : null,
                fetchedAt: new Date(),
            }
        },
        { upsert: true }
    ).catch(() => {}); // ignore duplicate key on same-day re-run

    // 5. Fetch media
    const mediaList = await meta.fetchMediaList(accessToken, igUserId);
    const storedMedia = [];

    for (const m of mediaList) {
        try {
            const doc = await InstagramMedia.findOneAndUpdate(
                { userId, role, mediaId: m.id },
                {
                    $set: {
                        userId, role,
                        instagramUserId: igUserId,
                        mediaId: m.id,
                        caption: (m.caption || '').slice(0, 2200),
                        mediaType: m.media_type || null,
                        permalink: m.permalink || null,
                        mediaUrl: m.media_url || null,
                        thumbnailUrl: m.thumbnail_url || null,
                        timestamp: m.timestamp ? new Date(m.timestamp) : null,
                        likeCount: m.like_count || 0,
                        commentsCount: m.comments_count || 0,
                        engagementScore: (m.like_count || 0) + (m.comments_count || 0),
                        snapshotAt: new Date(),
                    }
                },
                { upsert: true, new: true }
            );
            storedMedia.push({ ...m, _id: doc._id });
        } catch (err) {
            console.warn(`[syncService] Media upsert failed for ${m.id}:`, err.message);
        }
    }

    // 6. Fetch media insights (graceful — won't exist for all account types)
    for (const m of mediaList) {
        try {
            const insights = await meta.fetchMediaInsights(accessToken, m.id, m.media_type);
            if (insights && Object.keys(insights).length > 0) {
                await InstagramMediaInsight.create({
                    userId, role,
                    instagramUserId: igUserId,
                    mediaId: m.id,
                    date: new Date(),
                    views: insights.plays ?? insights.views ?? null,
                    reach: insights.reach ?? null,
                    impressions: insights.impressions ?? null,
                    saves: insights.saved ?? insights.saves ?? null,
                    shares: insights.shares ?? null,
                    rawPayload: insights,
                });
            }
        } catch {
            // Silently skip — media insights often unavailable for personal accounts
        }
    }

    // 7. Fetch comments for top posts (limit to first 5 posts for performance)
    const topPosts = [...mediaList]
        .sort((a, b) => ((b.like_count || 0) + (b.comments_count || 0)) - ((a.like_count || 0) + (a.comments_count || 0)))
        .slice(0, 5);

    for (const post of topPosts) {
        try {
            const comments = await meta.fetchComments(accessToken, post.id);
            for (const c of comments) {
                await InstagramComment.findOneAndUpdate(
                    { commentId: c.id },
                    {
                        $set: {
                            userId, role,
                            instagramUserId: igUserId,
                            mediaId: post.id,
                            commentId: c.id,
                            text: c.text || '',
                            username: c.username || null,
                            timestamp: c.timestamp ? new Date(c.timestamp) : null,
                        }
                    },
                    { upsert: true }
                ).catch(() => {});
            }
        } catch {
            // Silently skip — comment fetching often requires extra permissions
        }
    }

    // 8. Compute derived metrics
    const metrics = meta.computeDerivedMetrics(profile, mediaList);

    // Store historical metric snapshot
    await InstagramDerivedMetric.create({
        userId,
        role,
        instagramUserId: igUserId,
        computedAt: new Date(),
        ...metrics,
    });

    // 9. WRITE-THROUGH: Promote all computed data into InfluencerProfile
    //    This makes InfluencerProfile the single source of truth for the product UI.
    if (role === 'influencer') {
        const existingProfile = await InfluencerProfile.findOne({ userId });
        const isComplete = !!(
            existingProfile?.fullName &&
            existingProfile?.contactEmail &&
            existingProfile?.countryOfResidence &&
            existingProfile?.niche &&
            (existingProfile?.avgPostCostUSD > 0 || existingProfile?.avgReelCostUSD > 0)
        );

        const followersCount = profile.followers_count || 0;
        const fitScore = computeFitScore(metrics, followersCount, isComplete);

        const syncFields = {
            // Platform identity
            instagramUserId:      igUserId,
            instagramUsername:    profile.username || null,
            instagramProfileURL:  profile.username ? `https://instagram.com/${profile.username}` : null,
            instagramDPURL:       profile.profile_picture_url || null,
            instagramBiography:   profile.biography || null,
            instagramAccountType: profile.account_type || null,
            instagramConnected:   true,

            // Account stats
            followersCount: profile.followers_count || 0,
            followsCount:   profile.follows_count || 0,
            mediaCount:     profile.media_count || 0,

            // Engagement/Analytics — clean correct values
            engagementRate:       metrics.engagementRate || 0,
            avgLikes:             metrics.avgLikesPerPost || 0,
            avgComments:          metrics.avgCommentsPerPost || 0,
            avgEngagementPerPost: metrics.avgEngagementPerPost || 0,
            likeToCommentRatio:   metrics.likeToCommentRatio || 0,
            postingFrequency7d:   metrics.postingFrequency7d || 0,
            postingFrequency30d:  metrics.postingFrequency30d || 0,
            topPostScore:         metrics.topPostScore || null,
            topReelScore:         metrics.topReelScore || null,

            // Normalised fit score (0–100)
            fitScore,

            // Demographics — stored as clean structured objects (NOT JSON strings)
            ...(audienceData?.countries && { demographicsTopCountries: audienceData.countries }),
            ...(audienceData?.cities    && { demographicsTopCities:    audienceData.cities }),
            ...(audienceData?.genderAge && { demographicsGenderAge:    audienceData.genderAge }),

            // Sync metadata
            lastSyncedAt: new Date(),
            ...(audienceData && { lastDemographicsSyncAt: new Date() }),
        };

        await InfluencerProfile.findOneAndUpdate(
            { userId },
            { $set: syncFields },
            { upsert: false } // only update existing — creation handled by OAuth controller
        );

        console.log(`[syncService] ✅ Write-through complete for influencer ${userId}: ER=${metrics.engagementRate}%, Followers=${followersCount}, FitScore=${fitScore}`);
    }

    return {
        profile,
        mediaCount: mediaList.length,
        metrics,
    };
};

/**
 * Lightweight sync — refreshes profile + media counts without full media/comment fetch.
 * Also promotes updated stats into InfluencerProfile.
 */
exports.runQuickSync = async (userId, role, accessToken) => {
    const profile = await meta.fetchProfile(accessToken);
    const mediaList = await meta.fetchMediaList(accessToken, profile.id);
    const metrics = meta.computeDerivedMetrics(profile, mediaList);

    await InstagramAccount.findOneAndUpdate(
        { userId, role },
        {
            $set: {
                followersCount: profile.followers_count || 0,
                followsCount: profile.follows_count || 0,
                mediaCount: profile.media_count || 0,
                biography: profile.biography || null,
                profilePictureURL: profile.profile_picture_url || null,
                fetchedAt: new Date(),
            }
        },
        { upsert: true }
    );

    // Write-through light update for influencer role
    if (role === 'influencer') {
        const existingProfile = await InfluencerProfile.findOne({ userId });
        const isComplete = !!(
            existingProfile?.fullName &&
            existingProfile?.contactEmail &&
            existingProfile?.countryOfResidence &&
            existingProfile?.niche
        );
        const followersCount = profile.followers_count || 0;
        const fitScore = computeFitScore(metrics, followersCount, isComplete);

        await InfluencerProfile.findOneAndUpdate(
            { userId },
            {
                $set: {
                    followersCount,
                    followsCount:  profile.follows_count || 0,
                    mediaCount:    profile.media_count || 0,
                    instagramDPURL: profile.profile_picture_url || existingProfile?.instagramDPURL,
                    instagramBiography: profile.biography || existingProfile?.instagramBiography,
                    engagementRate:       metrics.engagementRate || 0,
                    avgLikes:             metrics.avgLikesPerPost || 0,
                    avgComments:          metrics.avgCommentsPerPost || 0,
                    avgEngagementPerPost: metrics.avgEngagementPerPost || 0,
                    postingFrequency7d:   metrics.postingFrequency7d || 0,
                    postingFrequency30d:  metrics.postingFrequency30d || 0,
                    fitScore,
                    lastSyncedAt: new Date(),
                }
            },
            { upsert: false }
        );
    }

    return { profile, metrics };
};

module.exports.computeFitScore = computeFitScore;
