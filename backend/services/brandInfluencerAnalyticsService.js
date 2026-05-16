const InfluencerProfile = require('../models/InfluencerProfile');
const MediaRaw = require('../models/MediaRaw');
const InsightsRaw = require('../models/InsightsRaw');

const DATE_OPTIONS = { month: 'short', day: 'numeric' };

function clamp(value, min = 0, max = 100) {
    return Math.max(min, Math.min(max, value));
}

function normalizeString(value) {
    return value == null ? '' : String(value).trim();
}

function toDate(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function toNumber(value) {
    const next = Number(value);
    return Number.isFinite(next) ? next : 0;
}

function formatDateLabel(value) {
    const date = toDate(value);
    return date ? date.toLocaleDateString('en-US', DATE_OPTIONS) : '—';
}

function normalizeType(value) {
    const text = normalizeString(value).toLowerCase();
    if (!text) return 'photo';
    if (text.includes('story')) return 'story';
    if (text.includes('reel')) return 'reel';
    if (text.includes('video') || text.includes('igtv') || text.includes('clip')) return 'video';
    if (text.includes('image') || text.includes('photo') || text.includes('carousel')) return 'photo';
    return 'photo';
}

function mediaKey(item) {
    return [
        item.postId || '',
        item.permalink || '',
        item.timestamp ? new Date(item.timestamp).toISOString().slice(0, 10) : '',
        item.type || '',
    ].join('|');
}

function mapDistribution(source) {
    if (!source) return [];
    if (Array.isArray(source)) {
        return source
            .map((item) => ({
                name: normalizeString(item?.name || item?.range || item?.region || item?.label || ''),
                value: toNumber(item?.value ?? item?.percent ?? item?.percentage ?? 0),
            }))
            .filter((item) => item.name && item.value > 0);
    }

    if (typeof source === 'object') {
        return Object.entries(source)
            .map(([name, value]) => ({
                name: normalizeString(name),
                value: toNumber(value),
            }))
            .filter((item) => item.name && item.value > 0)
            .sort((a, b) => b.value - a.value);
    }

    return [];
}

function normalizeCountryCode(name) {
    const value = normalizeString(name).toUpperCase();
    if (!value) return '';
    return value.length <= 3 ? value : value.slice(0, 2);
}

function normalizeDemographicBuckets(source, kind) {
    const values = mapDistribution(source);
    if (!values.length) return [];

    return values.map((item) => {
        if (kind === 'locations') {
            return { region: normalizeCountryCode(item.name) || item.name, percent: item.value };
        }
        if (kind === 'genders') {
            return { gender: item.name, percent: item.value };
        }
        return { range: item.name, percent: item.value };
    });
}

function parseGenderData(profile) {
    const source = profile?.demographics?.genderDistribution || profile?.audience?.ageGender;
    const buckets = mapDistribution(source);
    if (!buckets.length) return [];

    return buckets
        .map((item) => ({ gender: item.name, percent: item.value }))
        .filter((item) => item.gender && item.percent > 0);
}

function parseAgeData(profile) {
    const source = profile?.demographics?.ageDistribution || profile?.audience?.ageGender;
    const buckets = mapDistribution(source);
    const ageOnly = buckets.filter((item) => /(\d{1,2}\s*-\s*\d{1,2}|45\+|18\+|65\+|13\+|13\s*-\s*17|18\s*-\s*24|25\s*-\s*34|35\s*-\s*44)/i.test(item.name));
    if (ageOnly.length) {
        return ageOnly.map((item) => ({ range: item.name, percent: item.value })).filter((item) => item.percent > 0);
    }

    return [];
}

function parseLocationData(profile, rawInsights) {
    const profileLocations = profile?.demographics?.topCountries || profile?.demographics?.countries || profile?.audience?.topCountries;
    if (profileLocations) {
        return normalizeDemographicBuckets(profileLocations, 'locations');
    }

    const insightPayload = rawInsights.find((doc) => {
        const payload = doc?.payload || {};
        return payload?.topCountries || payload?.countries || payload?.locationDistribution || payload?.audience?.topCountries;
    });

    if (!insightPayload) return [];

    const payload = insightPayload.payload || {};
    return normalizeDemographicBuckets(
        payload.topCountries || payload.countries || payload.locationDistribution || payload.audience?.topCountries,
        'locations'
    );
}

function extractRawMediaPost(doc) {
    const payload = doc?.payload || {};
    const timestamp = payload.timestamp || payload.created_time || doc?.fetchedAt || payload.taken_at || payload.media_timestamp || payload.date_created;
    const likes = toNumber(payload.like_count ?? payload.likes ?? payload.likeCount ?? doc?.likeCount);
    const comments = toNumber(payload.comments_count ?? payload.comments ?? payload.commentsCount ?? doc?.commentsCount);
    const shares = toNumber(payload.share_count ?? payload.shares ?? payload.shareCount ?? 0);
    const saves = toNumber(payload.save_count ?? payload.saves ?? payload.saveCount ?? 0);
    const views = toNumber(payload.view_count ?? payload.views ?? payload.play_count ?? payload.playCount ?? payload.video_views ?? payload.reach ?? 0);
    const impressions = toNumber(payload.impression_count ?? payload.impressions ?? payload.impressionCount ?? 0);
    const reach = toNumber(payload.reach_count ?? payload.reach ?? payload.reachCount ?? 0);
    const type = normalizeType(payload.media_type || payload.mediaType || doc?.mediaType);
    const postId = normalizeString(payload.id || payload.media_id || payload.mediaId || doc?.mediaId || doc?._id);
    const permalink = normalizeString(payload.permalink || payload.link || doc?.payload?.permalink || doc?.permalink || '');
    const caption = normalizeString(payload.caption || payload.text || doc?.caption || '');

    return {
        postId: postId || permalink || `${timestamp || Date.now()}`,
        timestamp,
        type,
        likes,
        comments,
        shares,
        saves,
        reach,
        impressions,
        views,
        engagement_rate: 0,
        permalink: permalink || null,
        caption: caption || null,
    };
}

function extractProfileMediaPost(item) {
    return {
        postId: normalizeString(item?.mediaId || item?.mediaUrl || item?.permalink || item?.timestamp || `${Math.random()}`),
        timestamp: item?.timestamp || item?.fetchedAt || null,
        type: normalizeType(item?.mediaType),
        likes: toNumber(item?.likeCount),
        comments: toNumber(item?.commentsCount),
        shares: toNumber(item?.shareCount),
        saves: toNumber(item?.saveCount),
        reach: toNumber(item?.reachCount),
        impressions: toNumber(item?.impressionCount),
        views: toNumber(item?.viewCount || item?.playCount),
        permalink: normalizeString(item?.permalink || item?.mediaUrl || ''),
        caption: normalizeString(item?.caption || ''),
    };
}

function getFollowerSnapshotAt(profile, timestamp) {
    const snapshots = Array.isArray(profile?.historicalSnapshots) ? profile.historicalSnapshots : [];
    const target = toDate(timestamp);
    if (!snapshots.length || !target) return Number(profile?.followersCount || profile?.igFollowersCount || 0);

    const eligible = snapshots
        .filter((snapshot) => snapshot?.capturedAt && toDate(snapshot.capturedAt) && toDate(snapshot.capturedAt).getTime() <= target.getTime())
        .sort((a, b) => toDate(a.capturedAt).getTime() - toDate(b.capturedAt).getTime());

    if (!eligible.length) {
        return Number(profile?.followersCount || profile?.igFollowersCount || 0);
    }

    return Number(eligible[eligible.length - 1]?.followersCount || profile?.followersCount || profile?.igFollowersCount || 0);
}

function getNearestSnapshot(profile, timestamp, direction = 'before') {
    const snapshots = Array.isArray(profile?.historicalSnapshots) ? profile.historicalSnapshots : [];
    const target = toDate(timestamp);
    if (!snapshots.length || !target) return null;

    const sorted = [...snapshots]
        .filter((snapshot) => snapshot?.capturedAt && toDate(snapshot.capturedAt))
        .sort((a, b) => toDate(a.capturedAt).getTime() - toDate(b.capturedAt).getTime());

    if (!sorted.length) return null;
    if (direction === 'after') {
        return sorted.find((snapshot) => toDate(snapshot.capturedAt).getTime() >= target.getTime()) || sorted[sorted.length - 1];
    }

    const before = sorted.filter((snapshot) => toDate(snapshot.capturedAt).getTime() <= target.getTime());
    return before.length ? before[before.length - 1] : sorted[0];
}

function estimateExpectedEngagementRate(followers) {
    const count = Number(followers || 0);
    if (count >= 1_000_000) return 1.8;
    if (count >= 100_000) return 2.5;
    if (count >= 10_000) return 4.2;
    return 6.5;
}

function calculateAuthenticityScore({ averageEngagementRate, followerGrowthRate, postingConsistencyWeeks, followers, periodWeeks }) {
    const benchmark = estimateExpectedEngagementRate(followers);
    const engagementAlignment = clamp((averageEngagementRate / benchmark) * 100, 0, 100);
    const denominator = Math.max(1, Math.min(8, periodWeeks || 8));
    const consistencyScore = clamp((postingConsistencyWeeks / denominator) * 100, 0, 100);
    const growthHealth = followerGrowthRate < -10
        ? 35
        : followerGrowthRate > 80
            ? 55
            : 80;
    const blended = (engagementAlignment * 0.6) + (consistencyScore * 0.25) + (growthHealth * 0.15);
    return Math.round(clamp(blended, 0, 100));
}

function weeklyBucketLabel(dateValue) {
    const date = toDate(dateValue);
    if (!date) return 'Unknown';
    const year = date.getUTCFullYear();
    const weekStart = new Date(Date.UTC(year, date.getUTCMonth(), date.getUTCDate()));
    const day = weekStart.getUTCDay() || 7;
    weekStart.setUTCDate(weekStart.getUTCDate() - day + 1);
    return weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function average(values) {
    const numbers = values.filter((value) => Number.isFinite(value) && value > 0);
    if (!numbers.length) return 0;
    return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
}

function buildEngagementBreakdown(posts) {
    const totals = posts.reduce((acc, post) => {
        acc.likes += toNumber(post.likes);
        acc.comments += toNumber(post.comments);
        acc.shares += toNumber(post.shares);
        acc.saves += toNumber(post.saves);
        return acc;
    }, { likes: 0, comments: 0, shares: 0, saves: 0 });

    return [
        { name: 'Likes', value: totals.likes },
        { name: 'Comments', value: totals.comments },
        { name: 'Shares', value: totals.shares },
        { name: 'Saves', value: totals.saves },
    ].filter((item) => item.value > 0);
}

function estimateBenchmarkCpm(followers) {
    const count = Number(followers || 0);
    if (count >= 1_000_000) return 18;
    if (count >= 100_000) return 15;
    if (count >= 10_000) return 12;
    return 10;
}

function buildRatingTier(score) {
    if (score >= 85) return 'Elite';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Average';
    return 'Needs Review';
}

function buildRadarScore({
    averageEngagementRate,
    viewRate,
    authenticityScore,
    followerGrowthRate,
    costEfficiencyScore,
    consistencyScore,
}) {
    return [
        { metric: 'Engagement', value: clamp((averageEngagementRate / 6) * 100) },
        { metric: 'View Rate', value: clamp((viewRate / 15) * 100) },
        { metric: 'Authenticity', value: clamp(authenticityScore) },
        { metric: 'Growth', value: clamp(followerGrowthRate > 0 ? Math.min(followerGrowthRate * 2, 100) : 0) },
        { metric: 'Cost Efficiency', value: clamp(costEfficiencyScore) },
        { metric: 'Consistency', value: clamp(consistencyScore) },
    ];
}

async function resolveInfluencerProfile(influencerIdentifier) {
    const id = normalizeString(influencerIdentifier);
    if (!id) {
        const error = new Error('Influencer ID is required');
        error.statusCode = 400;
        throw error;
    }

    const query = {
        $or: [
            { influencerProfileId: id },
            { instagramAccountId: id },
            { instagramUsername: id },
            { igUserId: id },
        ],
    };

    if (/^[a-f\d]{24}$/i.test(id)) {
        query.$or.unshift({ _id: id }, { userId: id });
    }

    const profile = await InfluencerProfile.findOne(query).lean();
    if (!profile) {
        const error = new Error('Influencer not found');
        error.statusCode = 404;
        throw error;
    }

    return profile;
}

function mergePosts(primaryPosts, secondaryPosts) {
    const merged = new Map();
    [...primaryPosts, ...secondaryPosts].forEach((item) => {
        const timestamp = toDate(item.timestamp);
        if (!timestamp) return;
        const normalized = {
            ...item,
            timestamp: timestamp.toISOString(),
        };
        const key = mediaKey(normalized);
        if (!merged.has(key)) {
            merged.set(key, normalized);
            return;
        }

        const existing = merged.get(key);
        merged.set(key, {
            ...existing,
            ...normalized,
            likes: Math.max(existing.likes || 0, normalized.likes || 0),
            comments: Math.max(existing.comments || 0, normalized.comments || 0),
            shares: Math.max(existing.shares || 0, normalized.shares || 0),
            saves: Math.max(existing.saves || 0, normalized.saves || 0),
            reach: Math.max(existing.reach || 0, normalized.reach || 0),
            impressions: Math.max(existing.impressions || 0, normalized.impressions || 0),
            views: Math.max(existing.views || 0, normalized.views || 0),
        });
    });

    return [...merged.values()];
}

function buildPostTrend(posts) {
    const byDay = new Map();
    const byWeek = new Map();

    posts.forEach((post) => {
        const timestamp = toDate(post.timestamp);
        if (!timestamp) return;
        const dayKey = timestamp.toISOString().slice(0, 10);
        const weekKey = weeklyBucketLabel(timestamp);
        byDay.set(dayKey, (byDay.get(dayKey) || 0) + 1);
        byWeek.set(weekKey, (byWeek.get(weekKey) || 0) + 1);
    });

    return {
        daily: [...byDay.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, postsCount]) => ({ date, label: formatDateLabel(date), postsCount })),
        weekly: [...byWeek.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([label, postsCount]) => ({ label, postsCount })),
    };
}

function buildFollowerTrend(profile, posts, cutoff) {
    const snapshots = Array.isArray(profile?.historicalSnapshots) ? [...profile.historicalSnapshots] : [];
    const cutoffTime = cutoff ? cutoff.getTime() : Date.now();
    const trend = snapshots
        .filter((snapshot) => snapshot?.capturedAt && toDate(snapshot.capturedAt) && toDate(snapshot.capturedAt).getTime() >= cutoffTime)
        .sort((a, b) => toDate(a.capturedAt).getTime() - toDate(b.capturedAt).getTime())
        .map((snapshot) => ({
            date: toDate(snapshot.capturedAt).toISOString().slice(0, 10),
            label: formatDateLabel(snapshot.capturedAt),
            followers: Math.round(toNumber(snapshot.followersCount)),
        }));

    if (trend.length) return trend;

    const byPostDay = new Map();
    posts.forEach((post) => {
        const timestamp = toDate(post.timestamp);
        if (!timestamp) return;
        const key = timestamp.toISOString().slice(0, 10);
        const followers = getFollowerSnapshotAt(profile, timestamp);
        byPostDay.set(key, {
            date: key,
            label: formatDateLabel(key),
            followers: Math.round(followers),
        });
    });

    if (byPostDay.size) return [...byPostDay.values()].sort((a, b) => a.date.localeCompare(b.date));

    return [{
        date: new Date().toISOString().slice(0, 10),
        label: formatDateLabel(new Date()),
        followers: Math.round(toNumber(profile?.followersCount || profile?.igFollowersCount)),
    }];
}

function buildEngagementTrend(posts) {
    const byDay = new Map();
    posts.forEach((post) => {
        const timestamp = toDate(post.timestamp);
        if (!timestamp) return;
        const dayKey = timestamp.toISOString().slice(0, 10);
        const current = byDay.get(dayKey) || { engagement: 0, count: 0 };
        byDay.set(dayKey, {
            engagement: current.engagement + toNumber(post.engagement_rate),
            count: current.count + 1,
        });
    });

    return [...byDay.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, data]) => ({
            date,
            label: formatDateLabel(date),
            engagementRate: Number((data.count ? data.engagement / data.count : 0).toFixed(2)),
        }));
}

function buildWeeklyPostsTrend(posts) {
    const byWeek = new Map();

    posts.forEach((post) => {
        const timestamp = toDate(post.timestamp);
        if (!timestamp) return;
        const weekKey = weeklyBucketLabel(timestamp);
        byWeek.set(weekKey, (byWeek.get(weekKey) || 0) + 1);
    });

    return [...byWeek.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([label, postsCount]) => ({ label, postsCount }));
}

async function loadInsightDocs(profile, cutoff) {
    return InsightsRaw.find({
        $or: [
            { influencerProfileId: profile._id },
            { userId: profile.userId },
        ],
        fetchedAt: { $gte: cutoff },
    }).sort({ fetchedAt: -1 }).lean();
}

async function loadMediaDocs(profile, cutoff) {
    return MediaRaw.find({
        $or: [
            { influencerProfileId: profile._id },
            { userId: profile.userId },
        ],
        fetchedAt: { $gte: cutoff },
    }).sort({ fetchedAt: -1 }).lean();
}

function extractDemographicSource(insightDocs, profile) {
    for (const doc of insightDocs) {
        const payload = doc?.payload || {};
        const source = payload.audience || payload;
        if (source?.countries || source?.topCountries || source?.locationDistribution || source?.genderDistribution || source?.ageDistribution || source?.gender || source?.ageRanges) {
            return source;
        }
    }

    return {
        countries: profile?.demographics?.topCountries || profile?.demographics?.countries || profile?.audience?.topCountries,
        genderDistribution: profile?.demographics?.genderDistribution || profile?.audience?.genderDistribution,
        ageDistribution: profile?.demographics?.ageDistribution || profile?.audience?.ageDistribution,
    };
}

function normalizePeriodDays(period) {
    const requestedPeriod = Number(period || 60);
    if ([10, 30, 60].includes(requestedPeriod)) return requestedPeriod;
    return null;
}

async function getInfluencerAnalytics({ id, period = 60 }) {
    const requestedPeriod = Number(period || 60);
    const normalizedPeriod = normalizePeriodDays(requestedPeriod);
    if (!Number.isFinite(requestedPeriod) || !normalizedPeriod) {
        const error = new Error('Only 10, 30, or 60 days are supported');
        error.statusCode = 400;
        throw error;
    }

    const profile = await resolveInfluencerProfile(id);
    const cutoff = new Date(Date.now() - (normalizedPeriod * 24 * 60 * 60 * 1000));
    const [mediaDocs, insightDocs] = await Promise.all([
        loadMediaDocs(profile, cutoff),
        loadInsightDocs(profile, cutoff),
    ]);

    const basePosts = Array.isArray(profile.recentMediaSummary)
        ? profile.recentMediaSummary
            .map(extractProfileMediaPost)
            .filter((item) => toDate(item.timestamp) && toDate(item.timestamp).getTime() >= cutoff.getTime())
        : [];

    const rawPosts = mediaDocs.map(extractRawMediaPost).filter((item) => toDate(item.timestamp) && toDate(item.timestamp).getTime() >= cutoff.getTime());
    const posts = mergePosts(basePosts, rawPosts)
        .map((post) => {
            const timestamp = toDate(post.timestamp);
            if (!timestamp) return null;

            const followersAtTime = getFollowerSnapshotAt(profile, timestamp);
            const engagementRate = followersAtTime > 0
                ? Number((((toNumber(post.likes) + toNumber(post.comments) + toNumber(post.shares)) / followersAtTime) * 100).toFixed(2))
                : 0;

            return {
                postId: post.postId,
                timestamp: timestamp.toISOString(),
                type: normalizeType(post.type),
                likes: Math.round(toNumber(post.likes)),
                comments: Math.round(toNumber(post.comments)),
                engagement_rate: engagementRate,
                reach: Math.round(toNumber(post.reach)),
                impressions: Math.round(toNumber(post.impressions || post.views)),
                permalink: post.permalink || null,
                caption: post.caption || null,
            };
        })
        .filter(Boolean)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const totalPosts = posts.length;
    const averageLikes = totalPosts ? posts.reduce((sum, post) => sum + toNumber(post.likes), 0) / totalPosts : 0;
    const averageComments = totalPosts ? posts.reduce((sum, post) => sum + toNumber(post.comments), 0) / totalPosts : 0;
    const averageEngagementRate = totalPosts ? posts.reduce((sum, post) => sum + toNumber(post.engagement_rate), 0) / totalPosts : Number(profile.engagementRate || profile.avgEngagementRate || 0);
    const totalEngagements = posts.reduce((sum, post) => sum + toNumber(post.likes) + toNumber(post.comments), 0);
    const totalShares = posts.reduce((sum, post) => sum + toNumber(post.shares), 0);
    const totalSaves = posts.reduce((sum, post) => sum + toNumber(post.saves), 0);
    const averageViews = totalPosts ? posts.reduce((sum, post) => sum + toNumber(post.impressions || post.views), 0) / totalPosts : 0;

    const startSnapshot = getNearestSnapshot(profile, cutoff, 'after') || getNearestSnapshot(profile, cutoff, 'before');
    const endSnapshot = getNearestSnapshot(profile, new Date(), 'before') || getNearestSnapshot(profile, new Date(), 'after');
    const followersStart = toNumber(startSnapshot?.followersCount || profile.followersCount || profile.igFollowersCount);
    const followersNow = toNumber(endSnapshot?.followersCount || profile.followersCount || profile.igFollowersCount);
    const followerGrowthRate = followersStart > 0 ? Number((((followersNow - followersStart) / followersStart) * 100).toFixed(2)) : 0;
    const viewRate = followersNow > 0 ? Number(((averageViews / followersNow) * 100).toFixed(2)) : 0;

    const contentDistribution = posts.reduce((acc, post) => {
        const key = `${normalizeType(post.type)}_count`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {
        photo_count: 0,
        video_count: 0,
        reel_count: 0,
        story_count: 0,
    });

    const followerTrend = buildFollowerTrend(profile, posts, cutoff);
    const engagementTrend = buildEngagementTrend(posts);
    const weeklyPosts = buildWeeklyPostsTrend(posts);
    const uniqueWeeks = new Set(weeklyPosts.map((item) => item.label)).size;
    const periodWeeks = Math.max(1, Math.min(8, Math.ceil(normalizedPeriod / 7)));

    const authenticityScore = calculateAuthenticityScore({
        averageEngagementRate,
        followerGrowthRate,
        postingConsistencyWeeks: uniqueWeeks,
        periodWeeks,
        followers: followersNow,
    });

    const deliverableCosts = [toNumber(profile.avgPostPrice), toNumber(profile.avgReelPrice)].filter((value) => value > 0);
    const averageDeliverableCost = average(deliverableCosts);
    const campaignCostEstimate = averageDeliverableCost > 0 ? averageDeliverableCost * Math.max(totalPosts, 1) : 0;
    const costPerView = campaignCostEstimate > 0 && averageViews > 0 ? Number((campaignCostEstimate / averageViews).toFixed(4)) : null;
    const costPerEngagement = campaignCostEstimate > 0 && totalEngagements > 0 ? Number((campaignCostEstimate / totalEngagements).toFixed(2)) : null;
    const estimatedCostPerPost = toNumber(profile.avgPostPrice) > 0 ? Number(profile.avgPostPrice) : null;
    const estimatedCostPerReel = toNumber(profile.avgReelPrice) > 0 ? Number(profile.avgReelPrice) : null;

    const benchmarkCpm = estimateBenchmarkCpm(followersNow);
    const estimatedMediaValue = totalPosts > 0
        ? Number(((Math.max(averageViews, followersNow * 0.2) / 1000) * benchmarkCpm).toFixed(2))
        : null;
    const predictedROI = campaignCostEstimate > 0 && estimatedMediaValue != null
        ? Number((((estimatedMediaValue - campaignCostEstimate) / campaignCostEstimate) * 100).toFixed(2))
        : null;

    const engagementAlignment = clamp((averageEngagementRate / estimateExpectedEngagementRate(followersNow)) * 100, 0, 100);
    const viewAlignment = clamp((viewRate / 12) * 100, 0, 100);
    const costEfficiencyScore = costPerView == null ? 0 : clamp(100 - ((costPerView / 0.05) * 100), 0, 100);
    const consistencyScore = clamp((uniqueWeeks / 8) * 100, 0, 100);
    const growthScore = followerGrowthRate <= 0 ? 35 : followerGrowthRate >= 50 ? 100 : clamp(50 + followerGrowthRate, 0, 100);
    const finalScore = Math.round(clamp(
        (engagementAlignment * 0.28)
        + (viewAlignment * 0.18)
        + (authenticityScore * 0.24)
        + (growthScore * 0.10)
        + (costEfficiencyScore * 0.10)
        + (consistencyScore * 0.10),
        0,
        100
    ));
    const ratingTier = buildRatingTier(finalScore);

    const demographicSource = extractDemographicSource(insightDocs, profile);
    const locations = parseLocationData(profile, insightDocs).slice(0, 10);
    const genders = parseGenderData({
        demographics: demographicSource,
        audience: profile?.audience,
    }).slice(0, 10);
    const ages = parseAgeData({
        demographics: demographicSource,
        audience: profile?.audience,
    }).slice(0, 10);

    return {
        influencerId: String(profile._id),
        period_days: normalizedPeriod,
        influencer: {
            id: String(profile._id),
            userId: String(profile.userId),
            name: profile.fullName || profile.displayName || profile.instagramUsername || profile.username || 'Influencer',
            username: profile.instagramUsername || profile.username || null,
            profilePictureUrl: profile.profilePictureUrl || profile.igProfileUrl || null,
            followers: followersNow,
            verified: Boolean(profile.verified || profile.isVerified),
            platform: profile.platform || 'Instagram',
        },
        summary: {
            avg_engagement_rate: Number(averageEngagementRate.toFixed(2)),
            average_engagement_rate: Number(averageEngagementRate.toFixed(2)),
            avg_likes: Number(averageLikes.toFixed(2)),
            average_likes: Number(averageLikes.toFixed(2)),
            avg_comments: Number(averageComments.toFixed(2)),
            average_comments: Number(averageComments.toFixed(2)),
            posts_analyzed: totalPosts,
            total_posts: totalPosts,
            follower_growth_rate: followerGrowthRate,
            authenticity_score: authenticityScore,
            average_views: Number(averageViews.toFixed(2)),
            view_rate: viewRate,
            cost_per_view: costPerView,
            cost_per_engagement: costPerEngagement,
            estimated_cost_per_post: estimatedCostPerPost,
            estimated_cost_per_reel: estimatedCostPerReel,
            estimated_media_value: estimatedMediaValue,
            predicted_roi: predictedROI,
            final_score: finalScore,
            rating_tier: ratingTier,
            consistency_score: Math.round(consistencyScore),
        },
        trends: {
            engagement_rate_over_time: engagementTrend,
            follower_count_over_time: followerTrend,
            posting_frequency_over_time: weeklyPosts,
            posts_per_week: weeklyPosts,
        },
        content_distribution: {
            photo_count: contentDistribution.photo_count || 0,
            video_count: contentDistribution.video_count || 0,
            reel_count: contentDistribution.reel_count || 0,
            story_count: contentDistribution.story_count || 0,
        },
        engagement_breakdown: buildEngagementBreakdown(posts),
        radar: buildRadarScore({
            averageEngagementRate,
            viewRate,
            authenticityScore,
            followerGrowthRate,
            costEfficiencyScore,
            consistencyScore,
        }),
        roi: {
            predicted_roi: predictedROI,
            estimated_media_value: estimatedMediaValue,
            final_score: finalScore,
            rating_tier: ratingTier,
        },
        demographics: {
            locations,
            genders,
            ages,
        },
        posts,
        generatedAt: new Date().toISOString(),
        total_engagements: totalEngagements,
    };
}

module.exports = {
    getInfluencerAnalytics,
    getInfluencer60DayAnalytics: getInfluencerAnalytics,
};
