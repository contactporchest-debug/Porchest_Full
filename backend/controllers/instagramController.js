/**
 * Instagram OAuth + sync controller
 * All token handling is server-side. Tokens are NEVER sent to the frontend.
 */

const crypto = require('crypto');
const User = require('../models/User');
const InstagramConnection = require('../models/InstagramConnection');
const InstagramAnalyticsSnapshot = require('../models/InstagramAnalyticsSnapshot');
const InstagramMediaSnapshot = require('../models/InstagramMediaSnapshot');
const instagramAPI = require('../utils/instagramAPI');

// ─── Helpers ────────────────────────────────────────────────────

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

/**
 * Compute token expiry date from seconds
 */
const tokenExpiresAt = (expiresIn) => new Date(Date.now() + expiresIn * 1000);

// ─── CONNECT — Initiate OAuth ────────────────────────────────────

/**
 * GET /api/influencer/instagram/connect
 * Redirects user to Instagram OAuth
 */
exports.initiateConnect = async (req, res, next) => {
    try {
        // Generate and store a state param for CSRF protection
        const state = crypto.randomBytes(16).toString('hex');

        // Store state in the connection doc (upsert)
        await InstagramConnection.findOneAndUpdate(
            { userId: req.user._id },
            {
                userId: req.user._id,
                role: req.user.role,
                oauthState: state,
                isConnected: false,
                syncStatus: 'idle',
            },
            { upsert: true, new: true }
        );

        const authURL = instagramAPI.buildAuthURL() + `&state=${state}`;
        res.json({ success: true, authURL });
    } catch (error) {
        next(error);
    }
};

// ─── CALLBACK — Handle OAuth Code ────────────────────────────────

/**
 * GET /api/influencer/instagram/callback
 * Called by Meta after user grants permissions
 */
exports.handleCallback = async (req, res, next) => {
    try {
        const { code, state, error: oauthError, error_description } = req.query;

        if (oauthError) {
            return res.redirect(`${FRONTEND_URL}/dashboard/influencer?ig_error=${encodeURIComponent(error_description || oauthError)}`);
        }

        if (!code || !state) {
            return res.redirect(`${FRONTEND_URL}/dashboard/influencer?ig_error=missing_code`);
        }

        // Find connection record and validate state (CSRF check)
        const connection = await InstagramConnection.findOne({ userId: req.user._id, oauthState: state });
        if (!connection) {
            return res.redirect(`${FRONTEND_URL}/dashboard/influencer?ig_error=invalid_state`);
        }

        // Mark syncing
        connection.syncStatus = 'syncing';
        await connection.save();

        // 1. Exchange code for short-lived token
        const shortTokenData = await instagramAPI.exchangeCodeForToken(code);
        const shortToken = shortTokenData.access_token;
        const instagramUserId = shortTokenData.user_id;

        // 2. Exchange for long-lived token (60 days)
        const longTokenData = await instagramAPI.getLongLivedToken(shortToken);
        const longToken = longTokenData.access_token;
        const expiresIn = longTokenData.expires_in || 5184000; // 60 days default

        // 3. Fetch Instagram profile
        const profile = await instagramAPI.fetchProfile(longToken);

        // 4. Fetch media list
        const mediaList = await instagramAPI.fetchMediaList(longToken, profile.id);

        // 5. Compute analytics
        const analytics = instagramAPI.computeAnalytics(profile, mediaList);

        // 6. Save connection record (tokens stay here — never in User doc)
        connection.instagramUserId = profile.id;
        connection.username = profile.username;
        connection.profilePictureURL = profile.profile_picture_url || null;
        connection.biography = profile.biography || null;
        connection.accountType = profile.account_type || null;
        connection.accessToken = shortToken;
        connection.longLivedToken = longToken;
        connection.tokenExpiresAt = tokenExpiresAt(expiresIn);
        connection.isConnected = true;
        connection.lastSyncedAt = new Date();
        connection.syncStatus = 'success';
        connection.syncError = null;
        connection.oauthState = null; // clear used state
        connection.followersCount = profile.followers_count || 0;
        connection.followsCount = profile.follows_count || 0;
        connection.mediaCount = profile.media_count || 0;
        await connection.save();

        // 7. Update user's public profile fields (non-sensitive — no tokens)
        await User.findByIdAndUpdate(req.user._id, {
            instagramUsername: profile.username,
            instagramProfileURL: `https://instagram.com/${profile.username}`,
            instagramDPURL: profile.profile_picture_url || null,
            instagramConnected: true,
            instagramUserId: profile.id,
            followers: profile.followers_count || 0,
            followsCount: profile.follows_count || 0,
            mediaCount: profile.media_count || 0,
            accountType: profile.account_type || null,
            bio: profile.biography || null,
            engagementRate: analytics.engagementRate || 0,
            avgLikes: analytics.avgLikesPerPost || 0,
            avgComments: analytics.avgCommentsPerPost || 0,
            lastSyncedAt: new Date(),
        });

        // 8. Save analytics snapshot
        await InstagramAnalyticsSnapshot.create({
            userId: req.user._id,
            role: req.user.role,
            followersCount: profile.followers_count,
            followsCount: profile.follows_count,
            mediaCount: profile.media_count,
            biography: profile.biography,
            username: profile.username,
            profilePictureURL: profile.profile_picture_url,
            accountType: profile.account_type,
            engagementRate: analytics.engagementRate,
            avgLikesPerPost: analytics.avgLikesPerPost,
            avgCommentsPerPost: analytics.avgCommentsPerPost,
            avgEngagementPerPost: analytics.avgEngagementPerPost,
            likeToCommentRatio: analytics.likeToCommentRatio,
            topPostByEngagement: analytics.topPostByEngagement,
            topReelByReach: analytics.topReelByReach,
            fetchedAt: new Date(),
            postsAnalyzed: analytics.postsAnalyzed,
        });

        // 9. Save media snapshots (upsert by mediaId)
        if (mediaList.length > 0) {
            const bulkOps = mediaList.map(m => ({
                updateOne: {
                    filter: { userId: req.user._id, mediaId: m.id },
                    update: {
                        $set: {
                            userId: req.user._id,
                            mediaId: m.id,
                            mediaType: m.media_type,
                            caption: m.caption?.slice(0, 500) || '',
                            permalink: m.permalink,
                            thumbnailUrl: m.thumbnail_url || null,
                            timestamp: m.timestamp ? new Date(m.timestamp) : null,
                            likeCount: m.like_count || 0,
                            commentsCount: m.comments_count || 0,
                            engagementScore: (m.like_count || 0) + (m.comments_count || 0),
                            snapshotAt: new Date(),
                        }
                    },
                    upsert: true,
                }
            }));
            await InstagramMediaSnapshot.bulkWrite(bulkOps);
        }

        // Redirect to dashboard with success
        res.redirect(`${FRONTEND_URL}/dashboard/influencer?ig_connected=1`);
    } catch (error) {
        console.error('Instagram callback error:', error);
        // Update sync status to failed
        await InstagramConnection.findOneAndUpdate(
            { userId: req.user._id },
            { syncStatus: 'failed', syncError: error.message }
        );
        res.redirect(`${FRONTEND_URL}/dashboard/influencer?ig_error=sync_failed`);
    }
};

// ─── DISCONNECT ──────────────────────────────────────────────────

/**
 * POST /api/influencer/instagram/disconnect
 */
exports.disconnect = async (req, res, next) => {
    try {
        // Mark connection as disconnected (keep record for audit)
        await InstagramConnection.findOneAndUpdate(
            { userId: req.user._id },
            {
                isConnected: false,
                accessToken: null,
                longLivedToken: null,
                tokenExpiresAt: null,
                syncStatus: 'idle',
            }
        );

        // Clear Instagram fields from user (non-metrics that are manual too)
        await User.findByIdAndUpdate(req.user._id, {
            instagramConnected: false,
            instagramUserId: null,
            // Do NOT clear username/URL — keep them visible but unfrozen for manual edit
        });

        res.json({ success: true, message: 'Instagram disconnected successfully' });
    } catch (error) {
        next(error);
    }
};

// ─── REFRESH SYNC ────────────────────────────────────────────────

/**
 * POST /api/influencer/instagram/refresh
 * Re-fetches analytics using stored token
 */
exports.refreshSync = async (req, res, next) => {
    try {
        const connection = await InstagramConnection.findOne({ userId: req.user._id });

        if (!connection || !connection.isConnected) {
            return res.status(400).json({ success: false, message: 'Instagram not connected' });
        }

        // Check if token is expired
        if (connection.tokenExpiresAt && connection.tokenExpiresAt < new Date()) {
            await InstagramConnection.findOneAndUpdate(
                { userId: req.user._id },
                { syncStatus: 'token_expired' }
            );
            return res.status(401).json({
                success: false,
                message: 'Instagram token has expired. Please reconnect your account.',
                code: 'TOKEN_EXPIRED',
            });
        }

        // Mark syncing
        connection.syncStatus = 'syncing';
        await connection.save();

        const token = connection.longLivedToken || connection.accessToken;

        // Try to refresh the token first
        let activeToken = token;
        try {
            const refreshed = await instagramAPI.refreshLongLivedToken(token);
            activeToken = refreshed.access_token;
            const expiresIn = refreshed.expires_in || 5184000;
            connection.longLivedToken = activeToken;
            connection.tokenExpiresAt = tokenExpiresAt(expiresIn);
        } catch (refreshErr) {
            console.warn('Token refresh skipped:', refreshErr.message);
            // Continue with existing token
        }

        // Re-fetch profile + media
        const profile = await instagramAPI.fetchProfile(activeToken);
        const mediaList = await instagramAPI.fetchMediaList(activeToken, profile.id);
        const analytics = instagramAPI.computeAnalytics(profile, mediaList);

        // Update connection
        connection.followersCount = profile.followers_count || 0;
        connection.followsCount = profile.follows_count || 0;
        connection.mediaCount = profile.media_count || 0;
        connection.lastSyncedAt = new Date();
        connection.syncStatus = 'success';
        connection.syncError = null;
        connection.profilePictureURL = profile.profile_picture_url || connection.profilePictureURL;
        connection.biography = profile.biography || connection.biography;
        await connection.save();

        // Update user
        await User.findByIdAndUpdate(req.user._id, {
            followers: profile.followers_count || 0,
            followsCount: profile.follows_count || 0,
            mediaCount: profile.media_count || 0,
            engagementRate: analytics.engagementRate || 0,
            avgLikes: analytics.avgLikesPerPost || 0,
            avgComments: analytics.avgCommentsPerPost || 0,
            lastSyncedAt: new Date(),
            instagramDPURL: profile.profile_picture_url || null,
        });

        // New analytics snapshot
        await InstagramAnalyticsSnapshot.create({
            userId: req.user._id,
            role: req.user.role,
            followersCount: profile.followers_count,
            followsCount: profile.follows_count,
            mediaCount: profile.media_count,
            biography: profile.biography,
            username: profile.username,
            profilePictureURL: profile.profile_picture_url,
            accountType: profile.account_type,
            engagementRate: analytics.engagementRate,
            avgLikesPerPost: analytics.avgLikesPerPost,
            avgCommentsPerPost: analytics.avgCommentsPerPost,
            avgEngagementPerPost: analytics.avgEngagementPerPost,
            likeToCommentRatio: analytics.likeToCommentRatio,
            topPostByEngagement: analytics.topPostByEngagement,
            topReelByReach: analytics.topReelByReach,
            fetchedAt: new Date(),
            postsAnalyzed: analytics.postsAnalyzed,
        });

        // Update media snapshots
        if (mediaList.length > 0) {
            const bulkOps = mediaList.map(m => ({
                updateOne: {
                    filter: { userId: req.user._id, mediaId: m.id },
                    update: {
                        $set: {
                            userId: req.user._id,
                            mediaId: m.id,
                            mediaType: m.media_type,
                            caption: m.caption?.slice(0, 500) || '',
                            permalink: m.permalink,
                            thumbnailUrl: m.thumbnail_url || null,
                            timestamp: m.timestamp ? new Date(m.timestamp) : null,
                            likeCount: m.like_count || 0,
                            commentsCount: m.comments_count || 0,
                            engagementScore: (m.like_count || 0) + (m.comments_count || 0),
                            snapshotAt: new Date(),
                        }
                    },
                    upsert: true
                }
            }));
            await InstagramMediaSnapshot.bulkWrite(bulkOps);
        }

        // Return refreshed data (safe fields only — no tokens)
        const freshUser = await User.findById(req.user._id).select('-password');
        res.json({
            success: true,
            message: 'Instagram data refreshed successfully',
            user: freshUser,
            lastSyncedAt: connection.lastSyncedAt,
        });
    } catch (error) {
        await InstagramConnection.findOneAndUpdate(
            { userId: req.user._id },
            { syncStatus: 'failed', syncError: error.message }
        );
        next(error);
    }
};

// ─── GET PROFILE ─────────────────────────────────────────────────

/**
 * GET /api/influencer/instagram/profile
 */
exports.getProfile = async (req, res, next) => {
    try {
        const connection = await InstagramConnection.findOne({ userId: req.user._id })
            .select('-accessToken -longLivedToken -oauthState'); // Strip tokens

        res.json({ success: true, connection });
    } catch (error) {
        next(error);
    }
};

// ─── GET ANALYTICS ────────────────────────────────────────────────

/**
 * GET /api/influencer/instagram/analytics
 * Returns the latest analytics snapshot
 */
exports.getAnalytics = async (req, res, next) => {
    try {
        const snapshot = await InstagramAnalyticsSnapshot.findOne({
            userId: req.user._id
        }).sort({ fetchedAt: -1 });

        res.json({ success: true, analytics: snapshot });
    } catch (error) {
        next(error);
    }
};

// ─── GET MEDIA ────────────────────────────────────────────────────

/**
 * GET /api/influencer/instagram/media
 */
exports.getMedia = async (req, res, next) => {
    try {
        const media = await InstagramMediaSnapshot.find({ userId: req.user._id })
            .sort({ timestamp: -1 })
            .limit(25);

        res.json({ success: true, media });
    } catch (error) {
        next(error);
    }
};
