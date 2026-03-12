/**
 * Instagram / Meta Graph API client utility
 * All calls are server-side only — tokens never exposed to client
 */

const https = require('https');
const GRAPH_API_BASE = 'https://graph.instagram.com';
const FACEBOOK_API_BASE = 'https://graph.facebook.com/v18.0';

/**
 * Build the Meta OAuth authorization URL
 */
exports.buildAuthURL = () => {
    const appId = process.env.INSTAGRAM_APP_ID;
    const redirectUri = encodeURIComponent(process.env.INSTAGRAM_REDIRECT_URI);
    const scope = encodeURIComponent(
        'instagram_basic,instagram_content_publish,instagram_manage_insights,pages_show_list'
    );
    return `https://api.instagram.com/oauth/authorize?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;
};

/**
 * Exchange authorization code for short-lived token
 */
exports.exchangeCodeForToken = async (code) => {
    const params = new URLSearchParams({
        client_id: process.env.INSTAGRAM_APP_ID,
        client_secret: process.env.INSTAGRAM_APP_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
        code,
    });

    const res = await fetch('https://api.instagram.com/oauth/access_token', {
        method: 'POST',
        body: params,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const data = await res.json();
    if (!res.ok || data.error) {
        throw new Error(data.error_message || 'Token exchange failed');
    }
    return data; // { access_token, user_id }
};

/**
 * Exchange short-lived token for long-lived token (60 days)
 */
exports.getLongLivedToken = async (shortToken) => {
    const url = `${GRAPH_API_BASE}/access_token?grant_type=ig_exchange_token&client_secret=${process.env.INSTAGRAM_APP_SECRET}&access_token=${shortToken}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok || data.error) {
        throw new Error(data.error?.message || 'Long-lived token exchange failed');
    }
    return data; // { access_token, token_type, expires_in }
};

/**
 * Refresh an existing long-lived token (must be within 60-day window)
 */
exports.refreshLongLivedToken = async (existingToken) => {
    const url = `${GRAPH_API_BASE}/refresh_access_token?grant_type=ig_refresh_token&access_token=${existingToken}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok || data.error) {
        throw new Error(data.error?.message || 'Token refresh failed');
    }
    return data; // { access_token, token_type, expires_in }
};

/**
 * Fetch basic Instagram profile fields
 */
exports.fetchProfile = async (accessToken) => {
    const fields = 'id,username,name,biography,profile_picture_url,followers_count,follows_count,media_count,account_type';
    const url = `${GRAPH_API_BASE}/me?fields=${fields}&access_token=${accessToken}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok || data.error) {
        throw new Error(data.error?.message || 'Profile fetch failed');
    }
    return data;
};

/**
 * Fetch recent media list (up to 25 most recent posts)
 */
exports.fetchMediaList = async (accessToken, userId) => {
    const fields = 'id,caption,media_type,permalink,thumbnail_url,timestamp,like_count,comments_count';
    const url = `${GRAPH_API_BASE}/${userId}/media?fields=${fields}&limit=25&access_token=${accessToken}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok || data.error) {
        // Non-fatal — return empty if media access fails
        console.warn('Media fetch failed:', data.error?.message);
        return [];
    }
    return data.data || [];
};

/**
 * Fetch insights for a specific media object
 * Note: only available for Business/Creator accounts with required permissions
 */
exports.fetchMediaInsights = async (accessToken, mediaId, mediaType) => {
    const reelMetrics = 'reach,impressions,plays';
    const postMetrics = 'reach,impressions,saved';
    const metricParam = mediaType === 'REEL' || mediaType === 'VIDEO' ? reelMetrics : postMetrics;
    const url = `${GRAPH_API_BASE}/${mediaId}/insights?metric=${metricParam}&access_token=${accessToken}`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok || data.error) return null;
        const result = {};
        (data.data || []).forEach(m => { result[m.name] = m.values?.[0]?.value ?? m.value ?? 0; });
        return result;
    } catch {
        return null; // graceful degradation
    }
};

/**
 * Compute analytics from raw media data
 * Returns the computed analytics object
 */
exports.computeAnalytics = (profile, mediaList) => {
    const followersCount = profile.followers_count || 0;
    const totalPosts = mediaList.length;

    if (totalPosts === 0 || followersCount === 0) {
        return {
            engagementRate: 0,
            avgLikesPerPost: 0,
            avgCommentsPerPost: 0,
            avgEngagementPerPost: 0,
            likeToCommentRatio: 0,
            topPostByEngagement: null,
            postsAnalyzed: 0,
        };
    }

    const totalLikes = mediaList.reduce((s, m) => s + (m.like_count || 0), 0);
    const totalComments = mediaList.reduce((s, m) => s + (m.comments_count || 0), 0);
    const totalEngagement = totalLikes + totalComments;

    const engagementRate = parseFloat(((totalEngagement / followersCount) * 100).toFixed(2));
    const avgLikesPerPost = parseFloat((totalLikes / totalPosts).toFixed(2));
    const avgCommentsPerPost = parseFloat((totalComments / totalPosts).toFixed(2));
    const avgEngagementPerPost = parseFloat((totalEngagement / totalPosts).toFixed(2));
    const likeToCommentRatio = totalComments > 0 ? parseFloat((totalLikes / totalComments).toFixed(2)) : 0;

    // Top post by engagement score
    const sorted = [...mediaList].sort((a, b) => {
        const aE = (a.like_count || 0) + (a.comments_count || 0);
        const bE = (b.like_count || 0) + (b.comments_count || 0);
        return bE - aE;
    });
    const top = sorted[0];
    const topPostByEngagement = top ? {
        mediaId: top.id,
        caption: top.caption?.slice(0, 200) || '',
        likeCount: top.like_count || 0,
        commentsCount: top.comments_count || 0,
        mediaType: top.media_type,
        timestamp: top.timestamp ? new Date(top.timestamp) : null,
        permalink: top.permalink,
        thumbnailUrl: top.thumbnail_url || null,
    } : null;

    // Top reel by plays/reach (if any reels exist)
    const reels = mediaList.filter(m => m.media_type === 'REEL' || m.media_type === 'VIDEO');
    const topReelByReach = reels.length > 0 ? {
        mediaId: reels[0].id,
        caption: reels[0].caption?.slice(0, 200) || '',
        mediaType: reels[0].media_type,
        timestamp: reels[0].timestamp ? new Date(reels[0].timestamp) : null,
        permalink: reels[0].permalink,
        thumbnailUrl: reels[0].thumbnail_url || null,
        reach: null,
        plays: null,
    } : null;

    return {
        engagementRate,
        avgLikesPerPost,
        avgCommentsPerPost,
        avgEngagementPerPost,
        likeToCommentRatio,
        topPostByEngagement,
        topReelByReach,
        postsAnalyzed: totalPosts,
    };
};
