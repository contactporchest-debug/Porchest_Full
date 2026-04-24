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

const FB_GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || 'v19.0';
const GRAPH_BASE = 'https://graph.instagram.com';
const FB_GRAPH_BASE = `https://graph.facebook.com/${FB_GRAPH_VERSION}`;
const FB_OAUTH_BASE = `https://www.facebook.com/${FB_GRAPH_VERSION}/dialog/oauth`;

// ─── Env helpers ─────────────────────────────────────────────────

const getAppId = () => process.env.META_APP_ID || process.env.INSTAGRAM_APP_ID;
const getAppSecret = () => process.env.META_APP_SECRET || process.env.INSTAGRAM_APP_SECRET;

const getRedirectUri = (role) => {
    // 1. Try explicit role-based overrides from .env first
    let uri = (role === 'brand')
        ? (process.env.META_REDIRECT_URI_BRAND || process.env.INSTAGRAM_REDIRECT_URI_BRAND)
        : (process.env.META_REDIRECT_URI_INFLUENCER || process.env.INSTAGRAM_REDIRECT_URI);

    if (uri) return uri;

    // 2. Auto-construct based on environment
    const isProd = process.env.NODE_ENV === 'production';
    const baseUrl = isProd 
        ? (process.env.APP_BASE_URL || 'https://www.porchest.com')
        : 'http://localhost:5001';

    return `${baseUrl}/api/${role}/instagram/callback`;
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

    return `${FB_OAUTH_BASE}?${params.toString()}`;
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
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        code,
    });
    const url = `${FB_GRAPH_BASE}/oauth/access_token?${params.toString()}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok || data.error) {
        throw new Error(data.error_message || data.error?.message || 'Token exchange failed');
    }
    if (!data.access_token) {
        throw new Error('Code exchanged successfully but no access_token was returned in response');
    }
    return data; // { access_token, ... }
};

/**
 * Exchange short-lived token for long-lived token (60 days).
 * Uses Facebook Graph API if discovery is active/Facebook login used.
 */
exports.getLongLivedToken = async (shortToken) => {
    // For Facebook Login / Instagram Graph API
    const params = new URLSearchParams({
        grant_type: 'fb_exchange_token',
        client_id: getAppId(),
        client_secret: getAppSecret(),
        fb_exchange_token: shortToken,
    });
    const url = `${FB_GRAPH_BASE}/oauth/access_token?${params.toString()}`;
    
    // Fallback attempt for IG Basic Display if the above fails
    const igUrl = `${GRAPH_BASE}/access_token?grant_type=ig_exchange_token&client_secret=${getAppSecret()}&access_token=${shortToken}`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        if (res.ok && !data.error) return data;
        
        console.warn(`[metaOAuth] FB token extension failed (${data.error?.message}). Trying IG Basic fallback...`);
        const igRes = await fetch(igUrl);
        const igData = await igRes.json();
        if (igRes.ok && !igData.error) return igData;

        // If both failed, throw the initial FB error so we know what went wrong with the FB token
        throw new Error(`FB: ${data.error?.message || 'unknown'} | IG: ${igData.error?.message || 'unknown'}`);
    } catch (err) {
        throw new Error(`Long-lived token exchange failed: ${err.message}`);
    }
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
 * Fetch Instagram profile data.
 * Handles both Basic Display (personal/creator) and Graph API (Business/Creator via Facebook).
 */
exports.fetchProfile = async (accessToken) => {
    const igBasicFields = 'id,username,name,biography,profile_picture_url,website,followers_count,follows_count,media_count,account_type';
    // Facebook Graph API for IG Business/Creator accounts does not support 'account_type'
    const fbFields = 'id,username,name,biography,profile_picture_url,website,followers_count,follows_count,media_count';
    
    // Attempt 1: Try Direct Graph API lookup (if token is from Facebook)
    try {
        console.log('[metaOAuth] Attempting IG Business discovery via Facebook Pages...');
        // First discover the IG User ID from the user's pages
        const pages = await exports.fetchPages(accessToken);
        console.log(`[metaOAuth] Found ${pages.length} pages associated with this account`);
        
        if (pages && pages.length > 0) {
            let debugTrace = [];
            // Find the first page with a linked IG Business account
            for (const page of pages) {
                console.log(`[metaOAuth] Checking page: ${page.name} (${page.id})`);
                debugTrace.push(`[Pg:${page.id},Tok:${!!(page.access_token)}]`);
                
                const url = `${FB_GRAPH_BASE}/${page.id}?fields=instagram_business_account,connected_instagram_account&access_token=${page.access_token || accessToken}`;
                const res = await fetch(url);
                const data = await res.json();
                
                debugTrace.push(`[Data:${JSON.stringify(data).substring(0, 100)}]`);

                const igAccount = data.instagram_business_account || data.connected_instagram_account || null;
                
                if (igAccount && igAccount.id) {
                    console.log(`[metaOAuth] 🚀 FOUND linked IG Business Account: ${igAccount.id}`);
                    // Fetch full profile for this IG Business ID
                    const igUrl = `${FB_GRAPH_BASE}/${igAccount.id}?fields=${fbFields}&access_token=${accessToken}`;
                    const igRes = await fetch(igUrl);
                    const igData = await igRes.json();
                    if (igRes.ok && !igData.error) {
                        return { ...igData, isBusiness: true, linkedPageId: page.id };
                    } else {
                        throw new Error(`Failed IG fetch: ${igData.error?.message}`);
                    }
                }
            }
            throw new Error(`Failed IG: MultiPage Trace: ${debugTrace.join(' ')}`);
        } else {
            throw new Error('Failed IG: 0 Facebook Pages returned by Meta.');
        }
    } catch (discoveryErr) {
        if (discoveryErr.message && discoveryErr.message.includes('Failed IG')) throw discoveryErr;
        console.warn('[metaOAuth] IG Business discovery failed:', discoveryErr.message);
    }

    // Attempt 2: Fallback to Basic Display API (ONLY if the token seems to belong to IG Basic)
    throw new Error('Failed IG: Not an Instagram token, and Facebook discovery failed.');
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
    const url = `${FB_GRAPH_BASE}/${pageId}?fields=instagram_business_account,connected_instagram_account&access_token=${pageAccessToken}`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok || data.error) return null;
        return data.instagram_business_account || data.connected_instagram_account || null; // { id }
    } catch {
        return null;
    }
};

// ─── Media Fetch ─────────────────────────────────────────────────

/**
 * Fetch all recent media within the last 60 days.
 * Traverses Graph pagination until the cutoff is reached or no more pages exist.
 * Returns [] if permissions are missing or fetch fails (non-fatal).
 */
exports.fetchMediaList = async (accessToken, igUserId) => {
    const fields = 'id,caption,media_type,permalink,thumbnail_url,media_url,timestamp,like_count,comments_count';
    const base = igUserId.startsWith('1784') ? FB_GRAPH_BASE : GRAPH_BASE; // 1784 is typical for IG Business IDs on FB Graph
    const cutoffTime = Date.now() - (60 * 24 * 60 * 60 * 1000);
    let url = `${base}/${igUserId}/media?fields=${fields}&limit=100&access_token=${accessToken}`;
    const media = [];

    try {
        while (url) {
            const res = await fetch(url);
            const data = await res.json();
            if (!res.ok || data.error) {
                console.warn('[metaOAuth] Media fetch failed:', data.error?.message);
                return media;
            }

            const pageItems = Array.isArray(data.data) ? data.data : [];
            let reachedCutoff = false;

            for (const item of pageItems) {
                const timestamp = item?.timestamp ? new Date(item.timestamp).getTime() : null;
                if (timestamp && timestamp < cutoffTime) {
                    reachedCutoff = true;
                    continue;
                }
                media.push(item);
            }

            if (reachedCutoff) break;
            url = data?.paging?.next || null;
        }

        return media;
    } catch (err) {
        console.warn('[metaOAuth] Media fetch exception:', err.message);
        return media;
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
    const base = mediaId.length > 15 ? FB_GRAPH_BASE : GRAPH_BASE; // Heuristic to switch between FB and IG domains
    const url = `${base}/${mediaId}/insights?metric=${metrics}&access_token=${accessToken}`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok || data.error) return { raw: data, parsed: null };

        const result = {};
        (data.data || []).forEach(m => {
            result[m.name] = m.values?.[0]?.value ?? m.value ?? null;
        });
        return { raw: data, parsed: result };
    } catch {
        return { raw: null, parsed: null };
    }
};

/**
 * Fetch recent comments for a media object.
 * Returns [] if fetch fails or permissions missing.
 */
exports.fetchComments = async (accessToken, mediaId) => {
    const base = mediaId.length > 15 ? FB_GRAPH_BASE : GRAPH_BASE;
    const url = `${base}/${mediaId}/comments?fields=id,text,username,timestamp&limit=50&access_token=${accessToken}`;
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
 * Fetch lifetime audience demographics for the Instagram User.
 */
exports.fetchAudienceDemographics = async (accessToken, igUserId) => {
    // Note: Business discovery requires FB_GRAPH_BASE
    const base = igUserId.length > 15 ? FB_GRAPH_BASE : GRAPH_BASE;
    // Audience demographics use period=lifetime
    const url = `${base}/${igUserId}/insights?metric=audience_city,audience_country,audience_gender_age&period=lifetime&access_token=${accessToken}`;
    
    try {
        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok || data.error) return { raw: data, parsed: null };

        const result = { cities: null, countries: null, genderAge: null };
        (data.data || []).forEach(m => {
            if (m.name === 'audience_city') result.cities = m.values?.[0]?.value ?? null;
            if (m.name === 'audience_country') result.countries = m.values?.[0]?.value ?? null;
            if (m.name === 'audience_gender_age') result.genderAge = m.values?.[0]?.value ?? null;
        });
        return { raw: data, parsed: result };
    } catch {
        return { raw: null, parsed: null };
    }
};

exports.fetchAccountInsights = async (accessToken, igUserId) => {
    const base = igUserId.length > 15 ? FB_GRAPH_BASE : GRAPH_BASE;
    const summaryUrl = `${base}/${igUserId}/insights?metric=reach,impressions,profile_views,website_clicks&period=day&access_token=${accessToken}`;
    const onlineFollowersUrl = `${base}/${igUserId}/insights?metric=online_followers&period=lifetime&access_token=${accessToken}`;

    try {
        const [summaryRes, onlineFollowersRes] = await Promise.all([
            fetch(summaryUrl),
            fetch(onlineFollowersUrl),
        ]);

        const summaryRaw = await summaryRes.json();
        const onlineFollowersRaw = await onlineFollowersRes.json();

        const parsed = {
            reach: 0,
            impressions: 0,
            profileViews: 0,
            websiteClicks: 0,
            onlineFollowers: null,
        };

        if (summaryRes.ok && !summaryRaw.error) {
            (summaryRaw.data || []).forEach((metric) => {
                const value = Number(metric?.values?.[0]?.value || 0);
                if (metric.name === 'reach') parsed.reach = value;
                if (metric.name === 'impressions') parsed.impressions = value;
                if (metric.name === 'profile_views') parsed.profileViews = value;
                if (metric.name === 'website_clicks') parsed.websiteClicks = value;
            });
        }

        if (onlineFollowersRes.ok && !onlineFollowersRaw.error) {
            parsed.onlineFollowers = onlineFollowersRaw?.data?.[0]?.values?.[0]?.value ?? null;
        }

        return {
            raw: {
                summary: summaryRaw,
                onlineFollowers: onlineFollowersRaw,
            },
            parsed,
        };
    } catch {
        return {
            raw: null,
            parsed: {
                reach: 0,
                impressions: 0,
                profileViews: 0,
                websiteClicks: 0,
                onlineFollowers: null,
            },
        };
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
exports.computeDerivedMetrics = (profile, mediaList, existingProfile = null, accountInsights = {}) => {
    const followersCount = profile.followers_count || 0;
    const totalPosts = mediaList.length;

    const base = {
        engagementRate: 0,
        engagementPerImpression: 0,
        avgEngagementPerPost: 0,
        avgLikesPerPost: 0,
        avgCommentsPerPost: 0,
        avgViewsPerPost: 0,
        avgReachPerPost: 0,
        averageEngagement: 0,
        averageReach: 0,
        averageViews: 0,
        viewRate: 0,
        likeToCommentRatio: 0,
        followerGrowthRate: 0,
        followerGrowthTrend: null,
        postingFrequency: 0,
        postingFrequency7d: 0,
        postingFrequency30d: 0,
        consistencyRatio: 0,
        postingConsistencyScore: 0,
        topPostScore: 0,
        topReelScore: 0,
        contentEfficiencyRate: 0,
        sentimentScore: null,
        positiveCommentRatio: null,
        negativeCommentRatio: null,
        qualityScore: 0,
        authenticityScore: 0,
        fakeFollowerRiskScore: 0,
        influencerEfficiencyRate: 0,
        engagementQualityScore: 0,
        viralityScore: 0,
        influencerScore: 0,
        totalReach: 0,
        totalImpressions: 0,
        totalPlays: 0,
        totalShares: 0,
        totalSaved: 0,
        totalEngagements: 0,
        costPerView: null,
        costPerEngagement: null,
        postsAnalyzed: totalPosts,
        hasEstimatedMetrics: true,
    };

    if (totalPosts === 0 || followersCount === 0) return base;

    const totalLikes = mediaList.reduce((s, m) => s + Number(m.like_count || 0), 0);
    const totalComments = mediaList.reduce((s, m) => s + Number(m.comments_count || 0), 0);
    const totalShares = mediaList.reduce((s, m) => s + Number(m.insights?.shares || 0), 0);
    const totalSaved = mediaList.reduce((s, m) => s + Number(m.insights?.saved || 0), 0);
    const totalReach = mediaList.reduce((s, m) => s + Number(m.insights?.reach || 0), 0);
    const totalImpressions = mediaList.reduce((s, m) => s + Number(m.insights?.impressions || 0), 0);
    const totalPlays = mediaList.reduce((s, m) => s + Number(m.insights?.plays || 0), 0);
    const totalEngagement = totalLikes + totalComments + totalShares;
    const totalVisibility = mediaList.reduce((sum, media) => {
        if (media.media_type === 'VIDEO' || media.media_type === 'REEL') return sum + Number(media.insights?.plays || 0);
        return sum + Number(media.insights?.reach || 0);
    }, 0);

    const avgLikesPerPost = totalPosts > 0 ? parseFloat((totalLikes / totalPosts).toFixed(2)) : 0;
    const avgCommentsPerPost = totalPosts > 0 ? parseFloat((totalComments / totalPosts).toFixed(2)) : 0;
    const avgEngagementPerPost = totalPosts > 0 ? parseFloat((totalEngagement / totalPosts).toFixed(2)) : 0;
    const avgReachPerPost = totalPosts > 0 ? parseFloat((totalReach / totalPosts).toFixed(2)) : 0;
    const avgViewsPerPost = totalPosts > 0 ? parseFloat((totalVisibility / totalPosts).toFixed(2)) : 0;

    const engagementRate = followersCount > 0 ? parseFloat(((totalEngagement / followersCount) * 100).toFixed(2)) : 0;
    const viewRate = followersCount > 0 ? parseFloat(((avgViewsPerPost / followersCount) * 100).toFixed(2)) : 0;
    
    const likeToCommentRatio = totalComments > 0
        ? parseFloat((totalLikes / totalComments).toFixed(2))
        : null;
    const engagementQualityScore = totalLikes > 0
        ? parseFloat(Math.min(100, ((totalComments / totalLikes) * 100)).toFixed(2))
        : 0;
    const viralityScore = followersCount > 0
        ? parseFloat((((totalPlays / Math.max(totalPosts, 1)) / followersCount) * 100).toFixed(2))
        : 0;

    // Follower Growth Rate
    let growthRate = 0;
    if (existingProfile && existingProfile.followersCount && existingProfile.followersCount > 0) {
        const oldFollowers = existingProfile.followersCount;
        growthRate = parseFloat((((followersCount - oldFollowers) / oldFollowers) * 100).toFixed(2));
    }
    const followerGrowthRate = growthRate;

    // Posting frequency
    const now = Date.now();
    const posts7d = mediaList.filter(m => m.timestamp && (now - new Date(m.timestamp).getTime()) < 7 * 86400000).length;
    const posts30d = mediaList.filter(m => m.timestamp && (now - new Date(m.timestamp).getTime()) < 30 * 86400000).length;
    const postingFrequency = posts7d;
    const postingFrequency7d = posts7d;
    const postingFrequency30d = posts30d;

    const engagementSeries = mediaList.map((media) => (
        Number(media.like_count || 0) + Number(media.comments_count || 0) + Number(media.insights?.shares || 0)
    ));
    const meanEngagement = engagementSeries.reduce((sum, value) => sum + value, 0) / Math.max(engagementSeries.length, 1);
    const variance = engagementSeries.reduce((sum, value) => sum + ((value - meanEngagement) ** 2), 0) / Math.max(engagementSeries.length, 1);
    const stdDeviation = Math.sqrt(variance);
    const consistencyRatio = meanEngagement > 0
        ? Math.max(0, Math.min(1, 1 - (stdDeviation / meanEngagement)))
        : 0;
    const consistencyScore = parseFloat((consistencyRatio * 100).toFixed(2));

    // Top post by engagement
    const sorted = [...mediaList].sort((a, b) =>
        ((b.like_count || 0) + (b.comments_count || 0) + Number(b.insights?.shares || 0)) -
        ((a.like_count || 0) + (a.comments_count || 0) + Number(a.insights?.shares || 0))
    );
    const topPost = sorted[0];
    const topPostScore = (topPost && followersCount > 0)
        ? parseFloat(((((topPost.like_count || 0) + (topPost.comments_count || 0) + Number(topPost.insights?.shares || 0)) / followersCount) * 100).toFixed(2))
        : 0;

    // Top reel score
    const reels = mediaList.filter(m => m.media_type === 'REEL' || m.media_type === 'VIDEO');
    const topReel = reels.length > 0 ? reels.sort((a, b) =>
        ((b.like_count || 0) + (b.comments_count || 0) + Number(b.insights?.shares || 0)) -
        ((a.like_count || 0) + (a.comments_count || 0) + Number(a.insights?.shares || 0))
    )[0] : null;
    const topReelScore = (topReel && followersCount > 0)
        ? parseFloat(((((topReel.like_count || 0) + (topReel.comments_count || 0) + Number(topReel.insights?.shares || 0)) / followersCount) * 100).toFixed(2))
        : 0;

    const reachRatio = followersCount > 0 ? ((avgReachPerPost / followersCount) * 100) : 0;
    let authenticityScore = 100;
    if (followersCount > 100000 && engagementRate < 1) authenticityScore -= 20;
    if (reachRatio < 8) authenticityScore -= 15;
    if (growthRate > 40 && engagementRate < 2) authenticityScore -= 20;
    if (accountInsights.reach && followersCount > 0 && ((accountInsights.reach / followersCount) * 100) < 12) authenticityScore -= 10;
    authenticityScore = parseFloat(Math.max(0, Math.min(100, authenticityScore)).toFixed(2));

    // ── PROPER NORMALIZED QUALITY SCORE (0-100) ──
    // 1. Engagement Score
    let engagementScore = 30;
    if (engagementRate > 10) engagementScore = 100;
    else if (engagementRate >= 5) engagementScore = 80;
    else if (engagementRate >= 3) engagementScore = 60;

    // 2. Growth Score
    let growthScore = 50;
    if (growthRate !== null) {
        if (growthRate > 5) growthScore = 100;
        else if (growthRate > 2) growthScore = 80;
        else if (growthRate > 0) growthScore = 60;
        else growthScore = 40;
    }

    // 3. Consistency Score
    let cadenceConsistencyScore = 40;
    if (posts7d >= 3) cadenceConsistencyScore = 100;
    else if (posts7d >= 1) cadenceConsistencyScore = 80;

    // 4. Content Score
    let contentScore = 70;
    if (topPostScore && topPostScore > engagementRate * 2) contentScore = 100;
    else if (topPostScore && topPostScore > engagementRate * 1.5) contentScore = 85;

    const qualityScore = parseFloat((
        (engagementScore * 0.4) +
        (growthScore * 0.2) +
        (cadenceConsistencyScore * 0.2) +
        (contentScore * 0.2)
    ).toFixed(1));

    let scoreLabel = 'Average';
    if (qualityScore >= 80) scoreLabel = 'Excellent';
    else if (qualityScore >= 60) scoreLabel = 'Good';
    else if (qualityScore < 40) scoreLabel = 'Poor';

    // efficiencyRate: engagement per 1000 followers
    const influencerEfficiencyRate = followersCount > 0 ? parseFloat(((avgEngagementPerPost / followersCount) * 1000).toFixed(2)) : 0;
    const engagementPerImpression = totalImpressions > 0 ? parseFloat((totalEngagement / totalImpressions).toFixed(4)) : 0;

    const perMediaViewCosts = mediaList
        .map((media) => {
            const isReel = media.media_type === 'VIDEO' || media.media_type === 'REEL';
            const denominator = isReel ? Number(media.insights?.plays || 0) : Number(media.insights?.reach || 0);
            const price = isReel ? Number(existingProfile?.avgReelPrice || 0) : Number(existingProfile?.avgPostPrice || 0);
            if (!price || !denominator) return null;
            return price / denominator;
        })
        .filter((value) => Number.isFinite(value));

    const perMediaEngagementCosts = mediaList
        .map((media) => {
            const engagement = Number(media.like_count || 0) + Number(media.comments_count || 0) + Number(media.insights?.shares || 0);
            const isReel = media.media_type === 'VIDEO' || media.media_type === 'REEL';
            const price = isReel ? Number(existingProfile?.avgReelPrice || 0) : Number(existingProfile?.avgPostPrice || 0);
            if (!price || !engagement) return null;
            return price / engagement;
        })
        .filter((value) => Number.isFinite(value));

    const costPerView = perMediaViewCosts.length
        ? parseFloat((perMediaViewCosts.reduce((sum, value) => sum + value, 0) / perMediaViewCosts.length).toFixed(4))
        : null;
    const costPerEngagement = perMediaEngagementCosts.length
        ? parseFloat((perMediaEngagementCosts.reduce((sum, value) => sum + value, 0) / perMediaEngagementCosts.length).toFixed(4))
        : null;
    const influencerScore = parseFloat(Math.max(0, Math.min(100, (
        (0.3 * engagementRate) +
        (0.25 * viewRate) +
        (0.2 * Math.max(growthRate, 0)) +
        (0.15 * consistencyScore) +
        (0.1 * authenticityScore)
    ))).toFixed(2));

    return {
        ...base,
        engagementRate,
        engagementPerImpression,
        avgEngagementPerPost,
        avgLikesPerPost,
        avgCommentsPerPost,
        avgViewsPerPost,
        avgReachPerPost,
        averageEngagement: avgEngagementPerPost,
        averageReach: avgReachPerPost,
        averageViews: avgViewsPerPost,
        viewRate,
        likeToCommentRatio,
        followerGrowthRate,
        postingFrequency,
        postingFrequency7d,
        postingFrequency30d,
        consistencyRatio,
        postingConsistencyScore: consistencyScore,
        topPostScore,
        topReelScore,
        qualityScore,
        scoreLabel,
        growthRate,
        influencerEfficiencyRate,
        authenticityScore,
        engagementQualityScore,
        viralityScore,
        influencerScore,
        totalReach,
        totalImpressions,
        totalPlays,
        totalShares,
        totalSaved,
        totalEngagements: totalEngagement,
        costPerView,
        costPerEngagement,
        postsAnalyzed: totalPosts,
        hasEstimatedMetrics: false,
    };
};

// ─── Token expiry helper ──────────────────────────────────────────

/** Compute token expiry Date from expiresIn seconds */
exports.tokenExpiresAt = (expiresIn) => new Date(Date.now() + (expiresIn || 5184000) * 1000);
