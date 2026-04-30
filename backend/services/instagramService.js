const axios = require('axios');

const GRAPH_API_VERSION = process.env.META_GRAPH_API_VERSION || 'v20.0';
const GRAPH_API_BASE_URL = process.env.META_GRAPH_API_BASE_URL || `https://graph.facebook.com/${GRAPH_API_VERSION}`;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function buildError(error, fallbackMessage) {
    const metaError = error?.response?.data?.error || {};
    const err = new Error(metaError.message || error?.message || fallbackMessage);
    err.statusCode = error?.response?.status || 500;
    err.graphCode = metaError.code;
    err.graphSubcode = metaError.error_subcode;
    err.graphType = metaError.type;
    err.graphMessage = metaError.message;
    return err;
}

function isRateLimitError(error) {
    const status = error?.response?.status;
    const code = error?.response?.data?.error?.code;
    return status === 429 || code === 4 || code === 17 || code === 32;
}

function isInvalidTokenError(error) {
    return error?.response?.data?.error?.code === 190;
}

function isPermissionError(error) {
    return error?.response?.data?.error?.code === 100;
}

async function graphGet(path, params = {}, retryCount = 0) {
    const cleanPath = String(path).replace(/^\//, '');
    const url = `${GRAPH_API_BASE_URL}/${cleanPath}`;
    try {
        const response = await axios.get(url, {
            params,
            timeout: 30000,
        });
        return response.data;
    } catch (error) {
        if (isRateLimitError(error) && retryCount < 1) {
            await delay(60000);
            return graphGet(path, params, retryCount + 1);
        }
        throw buildError(error, 'Meta Graph request failed');
    }
}

function extractMetricValue(metric, key) {
    if (!metric || !Array.isArray(metric.values)) return null;
    const entry = metric.values[0];
    if (!entry) return null;
    if (typeof entry.value === 'number') return entry.value;
    if (entry.value && typeof entry.value === 'object') {
        return entry.value[key] ?? null;
    }
    return null;
}

function extractAverageFromMetric(metric) {
    if (!metric || !Array.isArray(metric.values) || !metric.values.length) return 0;
    const values = metric.values
        .map((item) => Number(item?.value ?? 0))
        .filter((value) => Number.isFinite(value));
    if (!values.length) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function normalizeBreakdownValue(value) {
    if (!value) return [];

    if (Array.isArray(value)) {
        return value
            .map((item) => ({
                name: item.name || item.city || item.country || item.key || item.label || item.value,
                value: Number(item.value ?? item.pct ?? item.percent ?? 0),
            }))
            .filter((item) => item.name != null);
    }

    if (typeof value === 'object') {
        return Object.entries(value)
            .map(([name, raw]) => ({
                name,
                value: Number(raw ?? 0),
            }))
            .filter((item) => item.name != null);
    }

    return [];
}

function pickMetric(metrics, metricName) {
    return metrics.find((metric) => metric.name === metricName);
}

function sumMetricValues(metric) {
    if (!metric || !Array.isArray(metric.values)) return 0;
    return metric.values.reduce((sum, item) => sum + Number(item?.value ?? 0), 0);
}

/**
 * Fetch the raw Instagram profile object for a connected account.
 * @param {string} accessToken
 * @param {string} igUserId
 * @returns {Promise<object>}
 */
async function fetchIgProfile(accessToken, igUserId) {
    try {
        return await graphGet(igUserId, {
            fields: [
                'id',
                'username',
                'name',
                'biography',
                'website',
                'profile_picture_url',
                'followers_count',
                'follows_count',
                'media_count',
                'account_type',
            ].join(','),
            access_token: accessToken,
        });
    } catch (error) {
        throw buildError(error, 'Failed to fetch Instagram profile');
    }
}

/**
 * Fetch 90-day account insights and compute summary aggregates.
 * @param {string} accessToken
 * @param {string} igUserId
 * @returns {Promise<{ insights: object[], aggregates: object }>}
 */
async function fetchIgAccountInsights(accessToken, igUserId) {
    try {
        const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
        const until = Math.floor(Date.now() / 1000);
        const since = Math.floor(ninetyDaysAgo / 1000);

        const response = await graphGet(`${igUserId}/insights`, {
            metric: 'reach,impressions,profile_views,website_clicks,follower_count',
            period: 'day',
            since,
            until,
            access_token: accessToken,
        });

        const insights = Array.isArray(response.data) ? response.data : [];
        const aggregates = {
            totalReach90d: Math.round(sumMetricValues(pickMetric(insights, 'reach'))),
            totalImpressions90d: Math.round(sumMetricValues(pickMetric(insights, 'impressions'))),
            totalProfileViews90d: Math.round(sumMetricValues(pickMetric(insights, 'profile_views'))),
            totalWebsiteClicks90d: Math.round(sumMetricValues(pickMetric(insights, 'website_clicks'))),
            followerGrowth90d: 0,
        };

        const followerMetric = pickMetric(insights, 'follower_count');
        const followerValues = Array.isArray(followerMetric?.values)
            ? followerMetric.values.map((item) => Number(item?.value ?? 0)).filter((value) => Number.isFinite(value))
            : [];
        if (followerValues.length > 1) {
            aggregates.followerGrowth90d = Math.round(followerValues[followerValues.length - 1] - followerValues[0]);
        }

        return { insights, aggregates };
    } catch (error) {
        throw buildError(error, 'Failed to fetch account insights');
    }
}

/**
 * Fetch recent media and merge each post with post-level insights.
 * @param {string} accessToken
 * @param {string} igUserId
 * @returns {Promise<object[]>}
 */
async function fetchRecentMedia(accessToken, igUserId) {
    try {
        const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
        const since = Math.floor(ninetyDaysAgo / 1000);

        const response = await graphGet(`${igUserId}/media`, {
            fields: 'id,media_type,timestamp,like_count,comments_count,permalink',
            since,
            limit: 50,
            access_token: accessToken,
        });

        const media = Array.isArray(response.data) ? response.data : [];
        const results = [];

        for (const item of media) {
            const mediaType = item.media_type || null;
            const canHaveVideoMetrics = mediaType === 'REEL' || mediaType === 'VIDEO';
            const metrics = canHaveVideoMetrics
                ? 'reach,impressions,saved,shares,video_views,plays'
                : 'reach,impressions,saved,shares';

            let insightData = null;
            try {
                insightData = await graphGet(`${item.id}/insights`, {
                    metric: metrics,
                    access_token: accessToken,
                });
            } catch (error) {
                const code = error?.graphCode || error?.response?.data?.error?.code;
                const status = error?.statusCode || error?.response?.status;
                if (status === 400 || code === 100) {
                    console.warn(`[Instagram] Skipping post insights for ${item.id}: ${error.message}`);
                    insightData = null;
                } else if (code === 190) {
                    throw error;
                } else {
                    console.warn(`[Instagram] Post insights unavailable for ${item.id}: ${error.message}`);
                    insightData = null;
                }
            }

            const insightMetrics = Array.isArray(insightData?.data) ? insightData.data : [];
            const reach = extractMetricValue(pickMetric(insightMetrics, 'reach'));
            const impressions = extractMetricValue(pickMetric(insightMetrics, 'impressions'));
            const saves = extractMetricValue(pickMetric(insightMetrics, 'saved'));
            const shares = extractMetricValue(pickMetric(insightMetrics, 'shares'));
            const videoViews = canHaveVideoMetrics
                ? extractMetricValue(pickMetric(insightMetrics, 'video_views')) ?? extractMetricValue(pickMetric(insightMetrics, 'plays'))
                : null;

            results.push({
                mediaId: item.id,
                mediaType,
                timestamp: item.timestamp,
                permalink: item.permalink,
                likeCount: Number(item.like_count ?? 0),
                commentsCount: Number(item.comments_count ?? 0),
                reach: reach == null ? null : Number(reach),
                impressions: impressions == null ? null : Number(impressions),
                saves: saves == null ? null : Number(saves),
                shares: shares == null ? null : Number(shares),
                videoViews: videoViews == null ? null : Number(videoViews),
            });
        }

        return results;
    } catch (error) {
        throw buildError(error, 'Failed to fetch recent media');
    }
}

/**
 * Fetch audience demographics for lifetime insights.
 * @param {string} accessToken
 * @param {string} igUserId
 * @returns {Promise<{ ageGender: object, topCities: object[], topCountries: object[] }>}
 */
async function fetchAudienceDemographics(accessToken, igUserId) {
    try {
        const response = await graphGet(`${igUserId}/insights`, {
            metric: 'audience_gender_age,audience_city,audience_country',
            period: 'lifetime',
            access_token: accessToken,
        });

        const insights = Array.isArray(response.data) ? response.data : [];
        const genderMetric = pickMetric(insights, 'audience_gender_age');
        const cityMetric = pickMetric(insights, 'audience_city');
        const countryMetric = pickMetric(insights, 'audience_country');

        const ageGender = genderMetric?.values?.[0]?.value && typeof genderMetric.values[0].value === 'object'
            ? genderMetric.values[0].value
            : {};

        const topCities = normalizeBreakdownValue(cityMetric?.values?.[0]?.value)
            .sort((a, b) => b.value - a.value)
            .slice(0, 5)
            .map((item) => ({ city: item.name, value: Number(item.value ?? 0) }));

        const topCountries = normalizeBreakdownValue(countryMetric?.values?.[0]?.value)
            .sort((a, b) => b.value - a.value)
            .slice(0, 5)
            .map((item) => ({ country: item.name, value: Number(item.value ?? 0) }));

        return { ageGender, topCities, topCountries };
    } catch (error) {
        throw buildError(error, 'Failed to fetch audience demographics');
    }
}

/**
 * Fetch the linked Instagram Business Account ID for a Facebook Page.
 * @param {string} accessToken
 * @param {string} pageId
 * @returns {Promise<string|null>}
 */
async function fetchLinkedIgAccountForPage(accessToken, pageId) {
    try {
        const response = await graphGet(pageId, {
            fields: 'instagram_business_account',
            access_token: accessToken,
        });

        const linked = response.instagram_business_account;
        if (!linked) return null;
        if (typeof linked === 'string') return linked;
        return linked.id || null;
    } catch (error) {
        throw buildError(error, 'Failed to fetch linked Instagram account for page');
    }
}

module.exports = {
    fetchIgProfile,
    fetchIgAccountInsights,
    fetchRecentMedia,
    fetchAudienceDemographics,
    fetchLinkedIgAccountForPage,
    isRateLimitError,
    isInvalidTokenError,
    isPermissionError,
};
