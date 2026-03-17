/**
 * instagramController.js — Influencer Instagram OAuth + Sync Controller
 *
 * All raw collections are removed. This controller writes OAuth state and
 * sync triggers DIRECTLY to the InfluencerProfile.
 */

const crypto = require('crypto');
const InfluencerProfile = require('../models/InfluencerProfile');
const User = require('../models/User');
const meta = require('../utils/metaOAuth');
const syncService = require('../utils/instagramSyncService');
const { generateUniqueCode } = require('../utils/generateCode');

const ROLE = 'influencer';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const CALLBACK_PATH = '/dashboard/influencer/profile';

// ─── HELPER: ENSURE PROFILE EXISTS ──────────────────────────────────
async function ensureProfileObj(userId) {
    let profile = await InfluencerProfile.findOne({ userId });
    if (!profile) {
        const influencerProfileId = await generateUniqueCode('INF', InfluencerProfile, 'influencerProfileId');
        profile = await InfluencerProfile.create({ userId, influencerProfileId });
        await User.findByIdAndUpdate(userId, { influencerProfileId: profile._id });
    }
    return profile;
}

// ─── INITIATE CONNECT ─────────────────────────────────────────────
exports.initiateConnect = async (req, res, next) => {
    try {
        const state = `${crypto.randomBytes(12).toString('hex')}_${req.user._id}`;
        
        await ensureProfileObj(req.user._id);

        await InfluencerProfile.findOneAndUpdate(
            { userId: req.user._id },
            {
                'sync.oauthState': state,
                'sync.refreshStatus': 'idle',
                instagramConnectionStatus: 'disconnected'
            }
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

        if (oauthError) return res.redirect(`${FRONTEND_URL}${CALLBACK_PATH}?ig_error=auth_denied`);
        if (!code || !state) return res.redirect(`${FRONTEND_URL}${CALLBACK_PATH}?ig_error=missing_code`);

        const userId = state.includes('_') ? state.split('_')[1] : null;
        if (!userId) return res.redirect(`${FRONTEND_URL}${CALLBACK_PATH}?ig_error=invalid_state_format`);

        // CSRF validation via profile doc
        const profile = await InfluencerProfile.findOne({ userId, 'sync.oauthState': state });
        if (!profile) return res.redirect(`${FRONTEND_URL}${CALLBACK_PATH}?ig_error=invalid_state`);

        profile.sync.refreshStatus = 'syncing';
        await profile.save();

        // Standard Token exchange
        const shortTokenData = await meta.exchangeCodeForToken(code, ROLE);
        const shortToken = shortTokenData.access_token;

        const longTokenData = await meta.getLongLivedToken(shortToken);
        const longToken = longTokenData.access_token;
        const tokenExpiry = meta.tokenExpiresAt(longTokenData.expires_in);

        // Store tokens securely in profile BEFORE full sync so the sync layer can use it
        await InfluencerProfile.findOneAndUpdate(
            { userId },
            {
                'sync.oauthState': null,
                'sync.accessToken': shortToken,
                'sync.longLivedToken': longToken,
                'sync.tokenExpiresAt': tokenExpiry,
            }
        );

        // Run full sync (it internally updates InfluencerProfile with ALL analytics)
        await syncService.runFullSync(userId, ROLE, longToken);

        // Finalize User layer
        await Promise.all([
            User.findByIdAndUpdate(userId, { instagramConnected: true }),
            InfluencerProfile.findOneAndUpdate({ userId }, { instagramConnected: true, instagramConnectionStatus: 'connected' })
        ]);

        res.redirect(`${FRONTEND_URL}${CALLBACK_PATH}?ig_connected=1`);
    } catch (error) {
        console.error('[influencerIG] Callback error:', error);
        const state = req.query.state;
        const userId = state && state.includes('_') ? state.split('_')[1] : null;
        if (userId) {
            await InfluencerProfile.findOneAndUpdate(
                { userId },
                { 'sync.refreshStatus': 'failed', 'sync.refreshError': error.message }
            ).catch(() => {});
        }
        res.redirect(`${FRONTEND_URL}${CALLBACK_PATH}?ig_error=sync_failed`);
    }
};

// ─── DISCONNECT ───────────────────────────────────────────────────
exports.disconnect = async (req, res, next) => {
    try {
        const userId = req.user._id;

        // Strip ALL Instagram Data natively
        await InfluencerProfile.findOneAndUpdate(
            { userId },
            {
                $set: {
                    instagramConnected:    false,
                    instagramConnectionStatus: 'disconnected',
                    lastDisconnectedAt:    new Date(),
                    instagramUserId:       null,
                    instagramUsername:     null,
                    instagramProfileURL:   null,
                    instagramDPURL:        null,
                    instagramBiography:    null,
                    instagramAccountType:  null,
                    followersCount:        0,
                    followingCount:        0,
                    mediaCount:            0,
                    postsCount:            0,
                    reelsCount:            0,
                    engagementRate:        0,
                    avgLikes:              0,
                    avgComments:           0,
                    avgLikesPerPost:       0,
                    avgCommentsPerPost:    0,
                    avgEngagementPerPost:  0,
                    likeToCommentRatio:    null,
                    avgShares:             0,
                    avgViews:              0,
                    avgReach:              0,
                    avgImpressions:        0,
                    growthRate:            0,
                    postingFrequency:      0,
                    postingFrequency7d:    0,
                    postingFrequency30d:   0,
                    topPerformingContentType: null,
                    demographics:          null,
                    recentMediaSummary:    [],
                    postsAnalyzed:         0,
                    influencerEfficiencyRate: 0,
                    fitScore:              0,
                    qualityScore:          0,
                    topPostScore:          0,
                    topReelScore:          0,
                    scoreLabel:            null,
                    lastSyncAt:            null,
                    lastAnalyticsRefreshAt: null,
                    nextScheduledRefreshAt: null,
                    'sync.oauthState':     null,
                    'sync.accessToken':    null,
                    'sync.longLivedToken': null,
                    'sync.tokenExpiresAt': null,
                    'sync.refreshStatus':  'idle',
                }
            }
        );

        await User.findByIdAndUpdate(userId, { instagramConnected: false });

        res.json({ success: true, message: 'Instagram completely disconnected. Privacy reset applied.' });
    } catch (error) {
        next(error);
    }
};

// ─── REFRESH SYNC ─────────────────────────────────────────────────
exports.refreshSync = async (req, res, next) => {
    try {
        const profile = await InfluencerProfile.findOne({ userId: req.user._id });

        if (!profile || profile.instagramConnectionStatus === 'disconnected' || !profile.sync.longLivedToken) {
            return res.status(400).json({ success: false, message: 'Instagram is not currently connected.' });
        }

        if (profile.sync.tokenExpiresAt && profile.sync.tokenExpiresAt < new Date()) {
            profile.instagramConnectionStatus = 'token_expired';
            profile.sync.refreshStatus = 'failed';
            await profile.save();
            return res.status(401).json({ success: false, message: 'Token expired. Reconnect required.', code: 'TOKEN_EXPIRED' });
        }

        profile.sync.refreshStatus = 'syncing';
        await profile.save();

        let activeToken = profile.sync.longLivedToken;

        try {
            const refreshed = await meta.refreshLongLivedToken(activeToken);
            activeToken = refreshed.access_token;
            profile.sync.longLivedToken = activeToken;
            profile.sync.tokenExpiresAt = meta.tokenExpiresAt(refreshed.expires_in);
            await profile.save();
        } catch (refreshErr) {
            console.warn('[influencerIG] Token refresh skipped:', refreshErr.message);
        }

        // Run full sync safely natively into profile
        await syncService.runFullSync(req.user._id, ROLE, activeToken);

        res.json({ success: true, message: 'Instagram data completely refreshed natively.' });
    } catch (error) {
        await InfluencerProfile.findOneAndUpdate(
            { userId: req.user._id },
            { 'sync.refreshStatus': 'failed', 'sync.refreshError': error.message }
        ).catch(() => {});
        next(error);
    }
};

// ─── GET PROFILE / RECENT MEDIA DISPLAY ROUTE ─────────────────────
// The UI expects connection and account object shapes originally, so we map them out of the unified profile document to avoid breaking frontend immediately
exports.getProfile = async (req, res, next) => {
    try {
        const profile = await InfluencerProfile.findOne({ userId: req.user._id });
        if (!profile) return res.json({ success: true, connection: null, account: null });

        const connection = {
            isConnected: profile.instagramConnected || profile.instagramConnectionStatus === 'connected',
            syncStatus: profile.sync?.refreshStatus,
            lastSyncedAt: profile.lastSyncAt,
            username: profile.instagramUsername,
            profilePictureURL: profile.instagramDPURL || profile.profilePictureUrl,
            followersCount: profile.followersCount,
            followsCount: profile.followingCount,
            mediaCount: profile.mediaCount,
            accountType: profile.instagramAccountType,
            biography: profile.instagramBiography
        };

        const account = {
            username: profile.instagramUsername,
            profilePictureURL: profile.instagramDPURL,
            biography: profile.instagramBiography,
            mediaCount: profile.mediaCount,
        };

        res.json({ success: true, connection, account, identity: profile });
    } catch (error) {
        next(error);
    }
};

exports.getAnalytics = async (req, res, next) => {
    try {
        const profile = await InfluencerProfile.findOne({ userId: req.user._id });
        if (!profile) return res.json({ success: true, analytics: {} });

        // Map the fields from the profile document to the shape the frontend/user requested
        const analytics = {
            followersCount: profile.followersCount || 0,
            avgLikes: profile.avgLikes || 0,
            avgComments: profile.avgComments || 0,
            engagementRate: profile.engagementRate || 0,
            growthRate: profile.growthRate || 0,
            postsLast7Days: profile.postingFrequency7d || 0,
            postsLast30Days: profile.postingFrequency30d || 0,
            efficiencyRate: profile.influencerEfficiencyRate || 0,
            qualityScore: profile.qualityScore || 0,
            scoreLabel: profile.scoreLabel || 'Average',
            
            // Helpful supporting fields
            topPostScore: profile.topPostScore || 0,
            topReelScore: profile.topReelScore || 0,
            likeToCommentRatio: profile.likeToCommentRatio,
            postsAnalyzed: profile.postsAnalyzed || 0,
            lastSyncedAt: profile.lastSyncAt
        };

        res.json({ success: true, analytics });
    } catch (error) {
        next(error);
    }
};

exports.getMedia = async (req, res, next) => {
    try {
        const profile = await InfluencerProfile.findOne({ userId: req.user._id });
        res.json({ success: true, media: profile?.recentMediaSummary || [] });
    } catch (error) {
        next(error);
    }
};

exports.lookupPostByUrl = async (req, res, next) => {
    res.json({
        success: false,
        message: 'Real-time post analyzer is temporarily out of service as we transition to the native profile architecture.' 
    });
};
