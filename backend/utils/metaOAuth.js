/**
 * metaOAuth.js — Meta / Instagram Graph API utility
 *
 * ARCHITECTURE NOTE:
 * - Brand and Influencer use SEPARATE redirect URIs (META_REDIRECT_URI_BRAND vs META_REDIRECT_URI_INFLUENCER)
 * - All token operations are server-side only — tokens NEVER reach the client
 * - Falls back to legacy INSTAGRAM_* env vars for backward compatibility
 *
 * API Versions used:
 * - Token exchange: https://api.instagram.com/oauth/ (v1 — no versioning)
 * - Graph API: https://graph.instagram.com (Basic Display / Business Discovery)
 * - Facebook Graph: https://graph.facebook.com/v19.0 (for page + IG Business lookup)
 */

const GRAPH_BASE = 'https://graph.instagram.com';
const FB_GRAPH_BASE = `https://graph.facebook.com/${process.env.META_GRAPH_API_VERSION || 'v19.0'}`;

// ─── Env helpers ─────────────────────────────────────────────────

const getAppId = () => process.env.META_APP_ID || process.env.INSTAGRAM_APP_ID;
const getAppSecret = () => process.env.META_APP_SECRET || process.env.INSTAGRAM_APP_SECRET;

const getRedirectUri = (role) => {
    // 1. Try explicit role-based overrides first
    let uri = (role === 'brand')
        ? (process.env.META_REDIRECT_URI_BRAND || process.env.INSTAGRAM_REDIRECT_URI_BRAND)
        : (process.env.META_REDIRECT_URI_INFLUENCER || process.env.INSTAGRAM_REDIRECT_URI);

    // 2. Fallback to generic callback if explicit ones missing
    if (!uri && process.env.INSTAGRAM_REDIRECT_URI) {
        uri = process.env.INSTAGRAM_REDIRECT_URI;
    }

    // 3. Fallback to construction from APP_BASE_URL
    if (!uri && process.env.APP_BASE_URL) {
        uri = `${process.env.APP_BASE_URL}/api/${role}/instagram/callback`;
    }

    // 4. Ultimate fallback for local development if everything is missing
    if (!uri) {
        // Only default to localhost if we are not in production or if explicitly needed
        console.warn(`[metaOAuth] Redirect URI for ${role} not found in env, falling back to localhost default.`);
        uri = `http://localhost:5001/api/${role}/instagram/callback`;
    }

    return uri;
};

// ─── OAuth URL Builder ────────────────────────────────────────────

/**
 * Build Meta/Instagram OAuth authorization URL for a given role.
 * @param {string} role - 'influencer' | 'brand'
 * @param {string} state - CSRF state token
 * @returns {string} Authorization URL
 */
exports.buildAuthURL = (role, state) => {
    const appId = getAppId();
    const redirectUri = getRedirectUri(role);

    if (!appId) throw new Error('META_APP_ID is not configured');
    if (!redirectUri) throw new Error(`Redirect URI for role "${role}" is not configured`);

    const scope = [
        'instagram_basic',
        'instagram_manage_insights',
        'instagram_content_publish',
        'pages_show_list',
        'pages_read_engagement',
        'business_management',
    ].join(',');

    const params = new URLSearchParams({
        client_id: appId,
        redirect_uri: redirectUri,
        scope,
        response_type: 'code',
        state: state || '',
    });

    return `https://api.instagram.com/oauth/authorize?${params.toString()}`;
};

// ─── Token Exchange ───────────────────────────────────────────────

/**
 * Exchange authorization code for a short-lived token.
 * @param {string} code - OAuth code from callback
 * @param {string} role - 'influencer' | 'brand'
 */
exports.exchangeCodeForToken = async (code, role) => {
    const redirectUri = getRedirectUri(role);
    const params = new URLSearchParams({
        client_id: getAppId(),
        client_secret: getAppSecret(),
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code,
    });

    const res = await fetch('https://api.instagram.com/oauth/access_token', {
        method: 'POST',
        body: params,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const data = await res.json();
    if (!res.ok || data.error) {
        throw new Error(data.error_message || data.error?.message || 'Token exchange failed');
    }
    return data; // { access_token, user_id }
};

/**
 * Exchange short-lived token for long-lived token (60 days).
 */
exports.getLongLivedToken = async (shortToken) => {
    const url = `${GRAPH_BASE}/access_token?grant_type=ig_exchange_token&client_secret=${getAppSecret()}&access_token=${shortToken}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok || data.error) {
        throw new Error(data.error?.message || 'Long-lived token exchange failed');
    }
    return data; // { access_token, token_type, expires_in }
};

/**
 * Refresh an existing long-lived token (must be within validity window).
 */
exports.refreshLongLivedToken = async (existingToken) => {
    const url = `${GRAPH_BASE}/refresh_access_token?grant_type=ig_refresh_token&access_token=${existingToken}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok || data.error) {
        throw new Error(data.error?.message || 'Token refresh failed');
    }
    return data;
};

// ─── Profile Fetch ────────────────────────────────────────────────

/**
 * Fetch basic Instagram profile using the Graph API.
 * Works for both Basic Display API (personal/creator) and Business accounts.
 */
exports.fetchProfile = async (accessToken) => {
    const fields = [
        'id', 'username', 'name', 'biography',
        'profile_picture_url', 'website',
        'followers_count', 'follows_count', 'media_count',
        'account_type',
    ].join(',');

    const url = `${GRAPH_BASE}/me?fields=${fields}&access_token=${accessToken}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok || data.error) {
        throw new Error(data.error?.message || 'Profile fetch failed');
    }
    return data;
};

// ─── Facebook Page + IG Business Lookup ──────────────────────────

/**
 * Fetch connected Facebook pages for the user (requires pages_show_list permission).
 * Returns an array of page objects with id, name, access_token.
 */
exports.fetchPages = async (accessToken) => {
    const url = `${FB_GRAPH_BASE}/me/accounts?access_token=${accessToken}`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok || data.error) return [];
        return data.data || [];
    } catch {
        return [];
    }
};

/**
 * Given a Facebook Page access token, fetch the linked Instagram Business Account.
 */
exports.fetchIGBusinessAccount = async (pageId, pageAccessToken) => {
    const url = `${FB_GRAPH_BASE}/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok || data.error) return null;
        return data.instagram_business_account || null; // { id }
    } catch {
        return null;
    }
};

// ─── Media Fetch ─────────────────────────────────────────────────

/**
 * Fetch recent media list (up to 25 most recent).
 * Returns [] if permissions are missing or fetch fails (non-fatal).
 */
exports.fetchMediaList = async (accessToken, igUserId) => {
    const fields = [
        'id', 'caption', 'media_type', 'permalink',
        'thumbnail_url', 'timestamp',
        'like_count', 'comments_count',
    ].join(',');

    const url = `${GRAPH_BASE}/${igUserId}/media?fields=${fields}&limit=25&access_token=${accessToken}`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok || data.error) {
            console.warn('[metaOAuth] Media fetch failed:', data.error?.message);
            return [];
        }
        return data.data || [];
    } catch (err) {
        console.warn('[metaOAuth] Media fetch exception:', err.message);
        return [];
    }
};

/**
 * Fetch insights for a specific media object.
 * Gracefully returns null if unsupported (e.g., personal accounts, missing permissions).
 */
exports.fetchMediaInsights = async (accessToken, mediaId, mediaType) => {
    // Metric availability varies by media type
    const metricsByType = {
        REEL: 'reach,impressions,plays,saved,shares',
        VIDEO: 'reach,impressions,plays,saved',
        IMAGE: 'reach,impressions,saved',
        CAROUSEL_ALBUM: 'reach,impressions,saved',
    };

    const metrics = metricsByType[mediaType] || 'reach,impressions,saved';
    const url = `${GRAPH_BASE}/${mediaId}/insights?metric=${metrics}&access_token=${accessToken}`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok || data.error) return null;

        const result = {};
        (data.data || []).forEach(m => {
            result[m.name] = m.values?.[0]?.value ?? m.value ?? null;
        });
        return result;
    } catch {
        return null;
    }
};

/**
 * Fetch recent comments for a media object.
 * Returns [] if fetch fails or permissions missing.
 */
exports.fetchComments = async (accessToken, mediaId) => {
    const url = `${GRAPH_BASE}/${mediaId}/comments?fields=id,text,username,timestamp&limit=50&access_token=${accessToken}`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok || data.error) return [];
        return data.data || [];
    } catch {
        return [];
    }
};

// ─── Analytics Computation ────────────────────────────────────────

/**
 * Compute derived metrics from raw profile + media data.
 * Returns a computed analytics object — ALL values here are DERIVED (not raw Meta values).
 *
 * @param {object} profile - Raw profile from fetchProfile()
 * @param {Array} mediaList - Raw media from fetchMediaList()
 * @returns {object} Computed analytics
 */
exports.computeDerivedMetrics = (profile, mediaList) => {
    const followersCount = profile.followers_count || 0;
    const totalPosts = mediaList.length;

    const base = {
        engagementRate: 0,
        engagementPerImpression: null,
        avgEngagementPerPost: 0,
        avgLikesPerPost: 0,
        avgCommentsPerPost: 0,
        avgViewsPerPost: null,
        likeToCommentRatio: 0,
        followerGrowthRate: null,
        followerGrowthTrend: null,
        postingFrequency7d: null,
        postingFrequency30d: null,
        postingConsistencyScore: null,
        topPostScore: null,
        topReelScore: null,
        contentEfficiencyRate: null,
        sentimentScore: null,
        positiveCommentRatio: null,
        negativeCommentRatio: null,
        qualityScore: null,
        authenticityScore: null,
        fakeFollowerRiskScore: null,
        influencerEfficiencyRate: null,
        postsAnalyzed: totalPosts,
        hasEstimatedMetrics: true,
    };

    if (totalPosts === 0 || followersCount === 0) return base;

    const totalLikes = mediaList.reduce((s, m) => s + (m.like_count || 0), 0);
    const totalComments = mediaList.reduce((s, m) => s + (m.comments_count || 0), 0);
    const totalEngagement = totalLikes + totalComments;

    const engagementRate = parseFloat(((totalEngagement / followersCount) * 100).toFixed(2));
    const avgLikesPerPost = parseFloat((totalLikes / totalPosts).toFixed(2));
    const avgCommentsPerPost = parseFloat((totalComments / totalPosts).toFixed(2));
    const avgEngagementPerPost = parseFloat((totalEngagement / totalPosts).toFixed(2));
    const likeToCommentRatio = totalComments > 0
        ? parseFloat((totalLikes / totalComments).toFixed(2))
        : 0;

    // Posting frequency
    const now = Date.now();
    const posts7d = mediaList.filter(m => m.timestamp && (now - new Date(m.timestamp).getTime()) < 7 * 86400000).length;
    const posts30d = mediaList.filter(m => m.timestamp && (now - new Date(m.timestamp).getTime()) < 30 * 86400000).length;
    const postingFrequency7d = parseFloat(posts7d.toFixed(1));
    const postingFrequency30d = parseFloat(posts30d.toFixed(1));

    // Top post by engagement
    const sorted = [...mediaList].sort((a, b) =>
        ((b.like_count || 0) + (b.comments_count || 0)) - ((a.like_count || 0) + (a.comments_count || 0))
    );
    const topPost = sorted[0];
    const topPostScore = topPost
        ? parseFloat(((((topPost.like_count || 0) + (topPost.comments_count || 0)) / followersCount) * 100).toFixed(2))
        : null;

    // Top reel score
    const reels = mediaList.filter(m => m.media_type === 'REEL' || m.media_type === 'VIDEO');
    const topReel = reels.length > 0 ? reels.sort((a, b) =>
        ((b.like_count || 0) + (b.comments_count || 0)) - ((a.like_count || 0) + (a.comments_count || 0))
    )[0] : null;
    const topReelScore = topReel
        ? parseFloat(((((topReel.like_count || 0) + (topReel.comments_count || 0)) / followersCount) * 100).toFixed(2))
        : null;

    // ── ESTIMATED quality scores (clearly marked as estimated) ──
    // These are heuristic calculations — NOT official Meta data.
    // qualityScore: weighted combo of engagement rate, consistency, and post frequency
    const normalizedER = Math.min(engagementRate / 10, 1); // cap at 10% for normalization
    const normalizedFreq = Math.min(postingFrequency7d / 3, 1); // cap at 3/week
    const qualityScore = parseFloat(((normalizedER * 60 + normalizedFreq * 40) * 100).toFixed(1));

    // influencerEfficiencyRate: engagement per 1000 followers
    const influencerEfficiencyRate = parseFloat(((totalEngagement / followersCount) * 1000).toFixed(2));

    return {
        ...base,
        engagementRate,
        avgEngagementPerPost,
        avgLikesPerPost,
        avgCommentsPerPost,
        likeToCommentRatio,
        postingFrequency7d,
        postingFrequency30d,
        topPostScore,
        topReelScore,
        qualityScore,
        influencerEfficiencyRate,
        postsAnalyzed: totalPosts,
        hasEstimatedMetrics: true,
    };
};

// ─── Token expiry helper ──────────────────────────────────────────

/** Compute token expiry Date from expiresIn seconds */
exports.tokenExpiresAt = (expiresIn) => new Date(Date.now() + (expiresIn || 5184000) * 1000);
