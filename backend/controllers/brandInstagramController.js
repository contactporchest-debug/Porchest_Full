/**
 * brandInstagramController.js — Brand Instagram OAuth + Sync Controller
 *
 * Routes handled (all under /api/brand/instagram/):
 *   GET  /connect       → initiate OAuth for brand
 *   GET  /callback      → handle Meta callback for brand
 *   POST /disconnect    → revoke brand connection
 *   POST /refresh       → re-sync brand data
 *   GET  /profile       → get brand connection + account data
 *   GET  /analytics     → get brand latest derived metrics
 *   GET  /media         → get brand stored media
 *
 * CRITICAL: Brand and Influencer connections are SEPARATE records.
 * All operations are scoped by role='brand'.
 */

const crypto = require('crypto');
const InstagramConnection = require('../models/InstagramConnection');
const InstagramAccount = require('../models/InstagramAccount');
const InstagramMedia = require('../models/InstagramMedia');
const InstagramMediaInsight = require('../models/InstagramMediaInsight');
const InstagramComment = require('../models/InstagramComment');
const InstagramDerivedMetric = require('../models/InstagramDerivedMetric');
const BrandProfile = require('../models/BrandProfile');
const User = require('../models/User');
const meta = require('../utils/metaOAuth');
const syncService = require('../utils/instagramSyncService');

const ROLE = 'brand';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const CALLBACK_PATH = '/dashboard/brand/profile';

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

        // CSRF validation — brand-specific state
        const connection = await InstagramConnection.findOne({
            userId,
            role: ROLE,
            oauthState: state,
        });
        if (!connection) {
            return res.redirect(`${FRONTEND_URL}${CALLBACK_PATH}?ig_error=invalid_state`);
        }

        connection.syncStatus = 'syncing';
        await connection.save();

        // Token exchange with brand-specific redirect URI
        const shortTokenData = await meta.exchangeCodeForToken(code, ROLE);
        const shortToken = shortTokenData.access_token;

        // Long-lived token
        const longTokenData = await meta.getLongLivedToken(shortToken);
        const longToken = longTokenData.access_token;
        const tokenExpiry = meta.tokenExpiresAt(longTokenData.expires_in);

        // Full sync — same pipeline as influencer but stored under role='brand'
        const { profile, metrics } = await syncService.runFullSync(
            userId, ROLE, longToken, connection
        );

        // Try to fetch linked Facebook page (brands often link pages)
        let linkedPageId = null;
        let linkedPageName = null;
        try {
            const pages = await meta.fetchPages(longToken);
            if (pages && pages.length > 0) {
                const page = pages[0];
                linkedPageId = page.id;
                linkedPageName = page.name;

                // Try to get IG Business Account ID from page
                const igBusiness = await meta.fetchIGBusinessAccount(page.id, page.access_token || longToken);
                if (igBusiness) {
                    // Store the linked page info in connection
                    linkedPageId = page.id;
                }
            }
        } catch (pageErr) {
            console.warn('[brandIG] Page fetch skipped:', pageErr.message);
        }

        // Update connection record (tokens NEVER leave server)
        await InstagramConnection.findOneAndUpdate(
            { userId, role: ROLE },
            {
                instagramUserId: profile.id,
                username: profile.username,
                profilePictureURL: profile.profile_picture_url || null,
                biography: profile.biography || null,
                accountType: profile.account_type || null,
                linkedPageId,
                linkedPageName,
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

        // Update BrandProfile with synced Instagram data (non-sensitive)
        await BrandProfile.findOneAndUpdate(
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
                    instagramConnected: true,
                    lastSyncedAt: new Date(),
                    linkedPageId,
                    linkedPageName,
                }
            },
            { upsert: true }
        );

        // Mirror brand instagram handle in User doc
        await User.findByIdAndUpdate(userId, {
            brandInstagramHandle: profile.username,
        });

        res.redirect(`${FRONTEND_URL}${CALLBACK_PATH}?ig_connected=1`);
    } catch (error) {
        console.error('[brandIG] Callback error:', error);
        // We might not have userId if it failed very early, so we try our best
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

        await BrandProfile.findOneAndUpdate(
            { userId: req.user._id },
            { instagramConnected: false }
        );

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
        } catch (err) {
            console.warn('[brandIG] Token refresh skipped:', err.message);
        }

        const { profile, metrics } = await syncService.runQuickSync(req.user._id, ROLE, activeToken);

        await InstagramConnection.findOneAndUpdate(
            { userId: req.user._id, role: ROLE },
            {
                followersCount: profile.followers_count || 0,
                followsCount: profile.follows_count || 0,
                mediaCount: profile.media_count || 0,
                lastSyncedAt: new Date(),
                syncStatus: 'success',
                syncError: null,
            }
        );

        await BrandProfile.findOneAndUpdate(
            { userId: req.user._id },
            {
                followersCount: profile.followers_count || 0,
                followsCount: profile.follows_count || 0,
                mediaCount: profile.media_count || 0,
                lastSyncedAt: new Date(),
            }
        );

        res.json({
            success: true,
            message: 'Brand Instagram data refreshed',
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

// ─── LOOKUP POST BY URL ──────────────────────────────────────────

exports.lookupPostByUrl = async (req, res, next) => {
    try {
        const { postUrl } = req.body;
        if (!postUrl) return res.status(400).json({ success: false, message: 'postUrl is required' });

        const media = await InstagramMedia.findOne({
            userId: req.user._id,
            role: ROLE,
            permalink: { $regex: postUrl.trim(), $options: 'i' }
        });

        if (!media) {
            return res.status(404).json({
                success: false,
                message: 'Post not found in your synced media. Try refreshing your sync first.'
            });
        }

        const insight = await InstagramMediaInsight.findOne({
            userId: req.user._id, role: ROLE, mediaId: media.mediaId
        }).sort({ createdAt: -1 });

        const comments = await InstagramComment.find({
            userId: req.user._id, role: ROLE, mediaId: media.mediaId
        }).sort({ timestamp: -1 }).limit(20);

        const engagement = (media.likeCount || 0) + (media.commentsCount || 0) + (insight?.saved || 0);
        const connection = await InstagramConnection.findOne({ userId: req.user._id, role: ROLE });
        const followers = connection?.followersCount || 1;

        const postMetrics = {
            engagementTotal: engagement,
            engagementRateByFollowers: parseFloat(((engagement / followers) * 100).toFixed(2)),
            engagementRateByReach: insight?.reach ? parseFloat(((engagement / insight.reach) * 100).toFixed(2)) : null,
            engagementPerImpression: insight?.impressions ? parseFloat((engagement / insight.impressions).toFixed(4)) : null,
            likeToCommentRatio: media.commentsCount > 0 ? parseFloat((media.likeCount / media.commentsCount).toFixed(2)) : null,
            savesPerReach: (insight?.saved && insight?.reach) ? parseFloat(((insight.saved / insight.reach) * 100).toFixed(2)) : null,
            commentRate: parseFloat(((media.commentsCount / followers) * 100).toFixed(3)),
        };

        res.json({ success: true, media, insight: insight || null, comments, postMetrics });
    } catch (error) {
        next(error);
    }
};
