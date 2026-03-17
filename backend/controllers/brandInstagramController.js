/**
 * brandInstagramController.js — Brand Instagram OAuth + Sync Controller
 *
 * All raw collections are removed. This controller writes OAuth state and
 * sync triggers DIRECTLY to the BrandProfile.
 */

const crypto = require('crypto');
const BrandProfile = require('../models/BrandProfile');
const User = require('../models/User');
const meta = require('../utils/metaOAuth');
const syncService = require('../utils/instagramSyncService');
const { generateUniqueCode } = require('../utils/generateCode');

const ROLE = 'brand';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const CALLBACK_PATH = '/dashboard/brand/profile';

// ─── HELPER: ENSURE PROFILE EXISTS ──────────────────────────────────
async function ensureProfileObj(userId) {
    let profile = await BrandProfile.findOne({ userId });
    if (!profile) {
        const brandProfileId = await generateUniqueCode('BRD', BrandProfile, 'brandProfileId');
        profile = await BrandProfile.create({ userId, brandProfileId });
        await User.findByIdAndUpdate(userId, { brandProfileId: profile._id });
    }
    return profile;
}

// ─── INITIATE CONNECT ─────────────────────────────────────────────
exports.initiateConnect = async (req, res, next) => {
    try {
        const state = `${crypto.randomBytes(12).toString('hex')}_${req.user._id}`;
        
        await ensureProfileObj(req.user._id);

        await BrandProfile.findOneAndUpdate(
            { userId: req.user._id },
            {
                'sync.oauthState': state,
                'sync.refreshStatus': 'idle',
                instagramConnected: false
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
        const profile = await BrandProfile.findOne({ userId, 'sync.oauthState': state });
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
        await BrandProfile.findOneAndUpdate(
            { userId },
            {
                'sync.oauthState': null,
                'sync.accessToken': shortToken,
                'sync.longLivedToken': longToken,
                'sync.tokenExpiresAt': tokenExpiry,
                instagramConnected: true
            }
        );

        // Run full sync (generates native structure directly into BrandProfile)
        await syncService.runFullSync(userId, ROLE, longToken);

        res.redirect(`${FRONTEND_URL}${CALLBACK_PATH}?ig_connected=1`);
    } catch (error) {
        console.error('[brandIG] Callback error:', error);
        const state = req.query.state;
        const userId = state && state.includes('_') ? state.split('_')[1] : null;
        if (userId) {
            await BrandProfile.findOneAndUpdate(
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
        await BrandProfile.findOneAndUpdate(
            { userId },
            {
                $set: {
                    instagramConnected:    false,
                    instagramUserId:       null,
                    instagramUsername:     null,
                    instagramProfileURL:   null,
                    instagramDPURL:        null,
                    instagramBiography:    null,
                    instagramAccountType:  null,
                    followersCount:        0,
                    followsCount:          0,
                    mediaCount:            0,
                    linkedPageId:          null,
                    linkedPageName:        null,
                    lastSyncedAt:          null,
                    'sync.oauthState':     null,
                    'sync.accessToken':    null,
                    'sync.longLivedToken': null,
                    'sync.tokenExpiresAt': null,
                    'sync.refreshStatus':  'idle',
                }
            }
        );

        res.json({ success: true, message: 'Instagram disconnected completely. Brand data reset.' });
    } catch (error) {
        next(error);
    }
};

// ─── REFRESH SYNC ─────────────────────────────────────────────────
exports.refreshSync = async (req, res, next) => {
    try {
        const profile = await BrandProfile.findOne({ userId: req.user._id });

        if (!profile || !profile.instagramConnected || !profile.sync.longLivedToken) {
            return res.status(400).json({ success: false, message: 'Instagram is not currently connected.' });
        }

        if (profile.sync.tokenExpiresAt && profile.sync.tokenExpiresAt < new Date()) {
            profile.instagramConnected = false; // pseudo-disconnect
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
            console.warn('[brandIG] Token refresh skipped:', refreshErr.message);
        }

        // Run full sync safely natively into profile
        await syncService.runFullSync(req.user._id, ROLE, activeToken);

        res.json({ success: true, message: 'Brand Instagram data refreshed natively.' });
    } catch (error) {
        await BrandProfile.findOneAndUpdate(
            { userId: req.user._id },
            { 'sync.refreshStatus': 'failed', 'sync.refreshError': error.message }
        ).catch(() => {});
        next(error);
    }
};

// ─── GET API ──────────────────────────────────────────────────────
exports.getProfile = async (req, res, next) => {
    try {
        const profile = await BrandProfile.findOne({ userId: req.user._id });
        if (!profile) return res.json({ success: true, connection: null, account: null });

        const connection = {
            isConnected: profile.instagramConnected,
            syncStatus: profile.sync?.refreshStatus,
            followersCount: profile.followersCount,
            lastSyncedAt: profile.lastSyncedAt
        };
        const account = {
            username: profile.instagramUsername,
            profilePictureURL: profile.instagramDPURL,
            biography: profile.instagramBiography,
            mediaCount: profile.mediaCount,
        };

        res.json({ success: true, connection, account });
    } catch (error) {
        next(error);
    }
};

exports.getAnalytics = async (req, res, next) => {
    res.json({ success: true, analytics: {} }); // We don't trace brand engagement right now.
};

exports.getMedia = async (req, res, next) => {
    res.json({ success: true, media: [] }); // We don't keep brand media array right now.
};

exports.lookupPostByUrl = async (req, res, next) => {
    res.json({
        success: false,
        message: 'Real-time post analyzer is temporarily out of service as we transition to the native profile architecture.' 
    });
};
