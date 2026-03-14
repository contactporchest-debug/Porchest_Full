/**
 * instagramController.js — Influencer Instagram OAuth + Sync Controller
 *
 * Routes handled (all under /api/influencer/instagram/):
 *   GET  /connect       → initiate OAuth
 *   GET  /callback      → handle Meta callback
 *   POST /disconnect    → revoke connection
 *   POST /refresh       → re-sync data
 *   GET  /profile       → get connection + account data
 *   GET  /analytics     → get latest derived metrics
 *   GET  /media         → get stored media
 */

const crypto = require('crypto');
const InstagramConnection = require('../models/InstagramConnection');
const InstagramAccount = require('../models/InstagramAccount');
const InstagramMedia = require('../models/InstagramMedia');
const InstagramDerivedMetric = require('../models/InstagramDerivedMetric');
const InfluencerProfile = require('../models/InfluencerProfile');
const User = require('../models/User');
const meta = require('../utils/metaOAuth');
const syncService = require('../utils/instagramSyncService');

const ROLE = 'influencer';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const CALLBACK_PATH = '/dashboard/influencer/profile';

// ─── INITIATE CONNECT ─────────────────────────────────────────────

exports.initiateConnect = async (req, res, next) => {
    try {
        const state = `${crypto.randomBytes(12).toString('hex')}_${req.user._id}`;

        await InstagramConnection.findOneAndUpdate(
            { userId: req.user._id, role: ROLE },
            {
                userId: req.user._id,
                role: ROLE,
                oauthState: state,
                isConnected: false,
                syncStatus: 'idle',
            },
            { upsert: true, new: true }
        );

        const authURL = meta.buildAuthURL(ROLE, state);
        res.json({ success: true, authURL });
    } catch (error) {
        next(error);
    }
};

// ─── HANDLE CALLBACK ──────────────────────────────────────────────

exports.handleCallback = async (req, res, next) => {
    try {
        const { code, state, error: oauthError } = req.query;

        if (oauthError) {
            return res.redirect(`${FRONTEND_URL}${CALLBACK_PATH}?ig_error=auth_denied`);
        }
        if (!code || !state) {
            return res.redirect(`${FRONTEND_URL}${CALLBACK_PATH}?ig_error=missing_code`);
        }

        // Extract userId from state (format: random_userId)
        const userId = state.includes('_') ? state.split('_')[1] : null;
        if (!userId) {
            return res.redirect(`${FRONTEND_URL}${CALLBACK_PATH}?ig_error=invalid_state_format`);
        }

        // CSRF validation
        const connection = await InstagramConnection.findOne({ userId, role: ROLE, oauthState: state });
        if (!connection) {
            return res.redirect(`${FRONTEND_URL}${CALLBACK_PATH}?ig_error=invalid_state`);
        }

        connection.syncStatus = 'syncing';
        await connection.save();

        // Token exchange
        const shortTokenData = await meta.exchangeCodeForToken(code, ROLE);
        const shortToken = shortTokenData.access_token;

        // Long-lived token
        const longTokenData = await meta.getLongLivedToken(shortToken);
        const longToken = longTokenData.access_token;
        const tokenExpiry = meta.tokenExpiresAt(longTokenData.expires_in);

        // Full data sync
        const { profile, metrics } = await syncService.runFullSync(userId, ROLE, longToken, connection);

        // Update connection record (token stays server-side ONLY)
        await InstagramConnection.findOneAndUpdate(
            { userId, role: ROLE },
            {
                instagramUserId: profile.id,
                username: profile.username,
                profilePictureURL: profile.profile_picture_url || null,
                biography: profile.biography || null,
                accountType: profile.account_type || null,
                accessToken: shortToken,
                longLivedToken: longToken,
                tokenExpiresAt: tokenExpiry,
                tokenStatus: 'active',
                isConnected: true,
                connectedAt: new Date(),
                lastSyncedAt: new Date(),
                syncStatus: 'success',
                syncError: null,
                oauthState: null,
                followersCount: profile.followers_count || 0,
                followsCount: profile.follows_count || 0,
                mediaCount: profile.media_count || 0,
            }
        );

        // Update InfluencerProfile synced fields (non-sensitive only)
        await InfluencerProfile.findOneAndUpdate(
            { userId },
            {
                $set: {
                    instagramUserId: profile.id,
                    instagramUsername: profile.username,
                    instagramProfileURL: `https://instagram.com/${profile.username}`,
                    instagramDPURL: profile.profile_picture_url || null,
                    instagramAccountType: profile.account_type || null,
                    instagramBiography: profile.biography || null,
                    followersCount: profile.followers_count || 0,
                    followsCount: profile.follows_count || 0,
                    mediaCount: profile.media_count || 0,
                    engagementRate: metrics.engagementRate || 0,
                    avgLikes: metrics.avgLikesPerPost || 0,
                    avgComments: metrics.avgCommentsPerPost || 0,
                    instagramConnected: true,
                    lastSyncedAt: new Date(),
                }
            },
            { upsert: true }
        );

        // Mirror key fields in User doc for backward compat with brand search
        await User.findByIdAndUpdate(userId, {
            instagramUsername: profile.username,
            instagramProfileURL: `https://instagram.com/${profile.username}`,
            instagramDPURL: profile.profile_picture_url || null,
            instagramConnected: true,
            instagramUserId: profile.id,
            followers: profile.followers_count || 0,
            followsCount: profile.follows_count || 0,
            mediaCount: profile.media_count || 0,
            engagementRate: metrics.engagementRate || 0,
            avgLikes: metrics.avgLikesPerPost || 0,
            avgComments: metrics.avgCommentsPerPost || 0,
            lastSyncedAt: new Date(),
        });

        res.redirect(`${FRONTEND_URL}${CALLBACK_PATH}?ig_connected=1`);
    } catch (error) {
        console.error('[influencerIG] Callback error:', error);
        // Try to update error status if we can identify user
        const state = req.query.state;
        const userId = state && state.includes('_') ? state.split('_')[1] : null;
        if (userId) {
            await InstagramConnection.findOneAndUpdate(
                { userId, role: ROLE },
                { syncStatus: 'failed', syncError: error.message }
            ).catch(() => {});
        }
        const errorMsg = encodeURIComponent(error.message || 'Unknown error');
        res.redirect(`${FRONTEND_URL}${CALLBACK_PATH}?ig_error=sync_failed&details=${errorMsg}`);
    }
};

// ─── DISCONNECT ───────────────────────────────────────────────────

exports.disconnect = async (req, res, next) => {
    try {
        await InstagramConnection.findOneAndUpdate(
            { userId: req.user._id, role: ROLE },
            {
                isConnected: false,
                accessToken: null,
                longLivedToken: null,
                tokenExpiresAt: null,
                tokenStatus: 'revoked',
                syncStatus: 'idle',
            }
        );

        await InfluencerProfile.findOneAndUpdate(
            { userId: req.user._id },
            { instagramConnected: false }
        );

        await User.findByIdAndUpdate(req.user._id, { instagramConnected: false });

        res.json({ success: true, message: 'Instagram disconnected successfully' });
    } catch (error) {
        next(error);
    }
};

// ─── REFRESH SYNC ─────────────────────────────────────────────────

exports.refreshSync = async (req, res, next) => {
    try {
        const connection = await InstagramConnection.findOne({ userId: req.user._id, role: ROLE });

        if (!connection || !connection.isConnected) {
            return res.status(400).json({ success: false, message: 'Instagram not connected' });
        }

        // Check token expiry
        if (connection.tokenExpiresAt && connection.tokenExpiresAt < new Date()) {
            await InstagramConnection.findOneAndUpdate(
                { userId: req.user._id, role: ROLE },
                { syncStatus: 'token_expired', tokenStatus: 'expired' }
            );
            return res.status(401).json({
                success: false,
                message: 'Instagram token has expired. Please reconnect your account.',
                code: 'TOKEN_EXPIRED',
            });
        }

        connection.syncStatus = 'syncing';
        await connection.save();

        let activeToken = connection.longLivedToken || connection.accessToken;

        // Try to refresh token
        try {
            const refreshed = await meta.refreshLongLivedToken(activeToken);
            activeToken = refreshed.access_token;
            await InstagramConnection.findOneAndUpdate(
                { userId: req.user._id, role: ROLE },
                {
                    longLivedToken: activeToken,
                    tokenExpiresAt: meta.tokenExpiresAt(refreshed.expires_in),
                    tokenStatus: 'active',
                }
            );
        } catch (refreshErr) {
            console.warn('[influencerIG] Token refresh skipped:', refreshErr.message);
        }

        // Quick sync (profile + derived metrics)
        const { profile, metrics } = await syncService.runQuickSync(req.user._id, ROLE, activeToken);

        // Update connection
        await InstagramConnection.findOneAndUpdate(
            { userId: req.user._id, role: ROLE },
            {
                followersCount: profile.followers_count || 0,
                followsCount: profile.follows_count || 0,
                mediaCount: profile.media_count || 0,
                lastSyncedAt: new Date(),
                syncStatus: 'success',
                syncError: null,
                profilePictureURL: profile.profile_picture_url || connection.profilePictureURL,
            }
        );

        // Update InfluencerProfile
        await InfluencerProfile.findOneAndUpdate(
            { userId: req.user._id },
            {
                followersCount: profile.followers_count || 0,
                followsCount: profile.follows_count || 0,
                mediaCount: profile.media_count || 0,
                engagementRate: metrics.engagementRate || 0,
                avgLikes: metrics.avgLikesPerPost || 0,
                avgComments: metrics.avgCommentsPerPost || 0,
                lastSyncedAt: new Date(),
            }
        );

        // Mirror to User doc
        await User.findByIdAndUpdate(req.user._id, {
            followers: profile.followers_count || 0,
            followsCount: profile.follows_count || 0,
            mediaCount: profile.media_count || 0,
            engagementRate: metrics.engagementRate || 0,
            avgLikes: metrics.avgLikesPerPost || 0,
            avgComments: metrics.avgCommentsPerPost || 0,
            lastSyncedAt: new Date(),
        });

        const freshUser = await User.findById(req.user._id).select('-password');
        res.json({
            success: true,
            message: 'Instagram data refreshed successfully',
            user: freshUser,
            lastSyncedAt: new Date(),
        });
    } catch (error) {
        await InstagramConnection.findOneAndUpdate(
            { userId: req.user._id, role: ROLE },
            { syncStatus: 'failed', syncError: error.message }
        ).catch(() => {});
        next(error);
    }
};

// ─── GET PROFILE ──────────────────────────────────────────────────

exports.getProfile = async (req, res, next) => {
    try {
        const [connection, account] = await Promise.all([
            InstagramConnection.findOne({ userId: req.user._id, role: ROLE })
                .select('-accessToken -longLivedToken -oauthState'),
            InstagramAccount.findOne({ userId: req.user._id, role: ROLE }),
        ]);

        res.json({ success: true, connection, account });
    } catch (error) {
        next(error);
    }
};

// ─── GET ANALYTICS ────────────────────────────────────────────────

exports.getAnalytics = async (req, res, next) => {
    try {
        const latestMetrics = await InstagramDerivedMetric.findOne({
            userId: req.user._id,
            role: ROLE,
        }).sort({ computedAt: -1 });

        res.json({ success: true, analytics: latestMetrics });
    } catch (error) {
        next(error);
    }
};

// ─── GET MEDIA ────────────────────────────────────────────────────

exports.getMedia = async (req, res, next) => {
    try {
        const media = await InstagramMedia.find({ userId: req.user._id, role: ROLE })
            .sort({ timestamp: -1 })
            .limit(25);

        res.json({ success: true, media });
    } catch (error) {
        next(error);
    }
};
