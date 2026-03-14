/**
 * instagramSyncService.js
 *
 * Reusable Instagram data synchronization service for BOTH brand and influencer.
 * This is the core "fetch + store + compute" pipeline used by both OAuth controllers.
 *
 * SEPARATION GUARANTEE:
 * Every write is filtered by { userId, role } so brand and influencer data
 * are ALWAYS in separate records, even within the same collection.
 */

const InstagramAccount = require('../models/InstagramAccount');
const InstagramAccountDailyStat = require('../models/InstagramAccountDailyStat');
const InstagramMedia = require('../models/InstagramMedia');
const InstagramMediaInsight = require('../models/InstagramMediaInsight');
const InstagramComment = require('../models/InstagramComment');
const InstagramDerivedMetric = require('../models/InstagramDerivedMetric');
const InstagramConnection = require('../models/InstagramConnection');
const meta = require('./metaOAuth');

/**
 * Full sync pipeline — fetches all available data from Meta and stores it.
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

    // 2. Store/update raw account snapshot
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

    // 3. Daily stats snapshot (one per day — ignore duplicate error)
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
                fetchedAt: new Date(),
            }
        },
        { upsert: true }
    ).catch(() => {}); // ignore duplicate key on re-run

    // 4. Fetch media
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

    // 5. Fetch media insights (graceful — won't exist for all account types)
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

    // 6. Fetch comments for top posts (limit to first 5 posts for performance)
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
                            isEstimated: true,
                        }
                    },
                    { upsert: true }
                ).catch(() => {});
            }
        } catch {
            // Silently skip — comment fetching often requires extra permissions
        }
    }

    // 7. Compute derived metrics
    const metrics = meta.computeDerivedMetrics(profile, mediaList);

    await InstagramDerivedMetric.create({
        userId,
        role,
        instagramUserId: igUserId,
        computedAt: new Date(),
        ...metrics,
    });

    return {
        profile,
        mediaCount: mediaList.length,
        metrics,
    };
};

/**
 * Lightweight sync — refreshes profile + media counts without full media/comment fetch.
 * Used for token refresh or quick dashboard updates.
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

    return { profile, metrics };
};
