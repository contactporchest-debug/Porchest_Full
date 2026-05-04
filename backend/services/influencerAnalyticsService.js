const mongoose = require('mongoose');
const Analytics = require('../models/Analytics');
const CampaignRequest = require('../models/CampaignRequest');
const { isValidObjectId } = require('../utils/validators');
const { getProfileCollectionInfo } = require('../utils/profileCollectionResolver');
const {
    calculateAverageViews,
    calculateAuthenticityScore,
    calculateCommentRate,
    calculateConsistencyScore,
    calculateCostEfficiencyScore,
    calculateCostPerEngagement,
    calculateCostPerView,
    calculateEngagementRate,
    calculateFinalInfluencerScore,
    calculateGrowthRate,
    calculateLikeToViewRate,
    calculateViewRate,
    clamp,
    getInfluencerRatingTier,
} = require('../utils/influencerMetrics');

const { ObjectId } = mongoose.Types;
const ANALYTICS_LIST_LIMIT = 100;
const ANALYTICS_READ_STALE_MS = 15 * 60 * 1000;
const PROFILE_LIST_PROJECTION = {
    fullName: 1,
    displayName: 1,
    instagramUsername: 1,
    username: 1,
    niche: 1,
    country: 1,
    profilePictureUrl: 1,
    followersCount: 1,
    platform: 1,
    updatedAt: 1,
    userId: 1,
    avgPostPrice: 1,
    avgReelPrice: 1,
    recentMediaSummary: 1,
    demographics: 1,
    engagementRate: 1,
    avgViews: 1,
    viewRate: 1,
    costPerView: 1,
    costPerEngagement: 1,
    authenticityScore: 1,
    consistencyScore: 1,
    influencerScore: 1,
    growthRate: 1,
    postsAnalyzed: 1,
};

const toObjectId = (value) => (value instanceof ObjectId ? value : new ObjectId(value));

const formatDateLabel = (value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const SIXTY_DAYS_IN_MS = 60 * 24 * 60 * 60 * 1000;

function mapDemographicEntries(source) {
    if (!source || typeof source !== 'object') return [];
    return Object.entries(source)
        .filter(([, value]) => Number.isFinite(Number(value)))
        .map(([name, value]) => ({ name, value: Number(value) }))
        .sort((a, b) => b.value - a.value);
}

function normalizeGenderDistribution(source) {
    if (!source || typeof source !== 'object') return [];
    if (Array.isArray(source)) return source;

    if ('male' in source || 'female' in source) {
        return mapDemographicEntries({
            Male: Number(source.male || 0),
            Female: Number(source.female || 0),
        });
    }

    return mapDemographicEntries(
        Object.entries(source).reduce((acc, [key, value]) => {
            if (key === 'M') acc.Male = Number(value || 0);
            else if (key === 'F') acc.Female = Number(value || 0);
            else acc[key] = Number(value || 0);
            return acc;
        }, {})
    );
}

function normalizeAgeDistribution(source, genderAgeSource) {
    if (source && typeof source === 'object' && !Array.isArray(source)) {
        const mapped = mapDemographicEntries(source);
        if (mapped.length) return mapped;
    }

    if (!genderAgeSource || typeof genderAgeSource !== 'object') return [];

    const ages = Object.entries(genderAgeSource).reduce((acc, [key, value]) => {
        const ageKey = key.includes('.') ? key.split('.').slice(1).join('.') : key;
        if (!ageKey) return acc;
        acc[ageKey] = (acc[ageKey] || 0) + Number(value || 0);
        return acc;
    }, {});

    return mapDemographicEntries(ages);
}

function normalizeCountryDistribution(source) {
    if (!source || typeof source !== 'object') return [];
    return mapDemographicEntries(source);
}

function calculateEstimatedMediaValue({ averageViews, totalEngagements, followers, finalScore }) {
    const value = (averageViews * 0.01) + (totalEngagements * 0.2) + (followers * 0.0025) + (finalScore * 2);
    return Number(value.toFixed(2));
}

function calculatePredictedROI({ estimatedMediaValue, postRate }) {
    if (!Number.isFinite(postRate) || postRate <= 0) return null;
    return Number((((estimatedMediaValue - postRate) / postRate) * 100).toFixed(2));
}

function buildTrendPoint(date, followers, engagementRate) {
    return {
        date: new Date(date),
        label: formatDateLabel(date),
        followers: Math.round(followers || 0),
        engagementRate: Number((engagementRate || 0).toFixed(2)),
    };
}

function buildTrendHistoryFromSnapshots(profile) {
    if (!Array.isArray(profile?.historicalSnapshots) || profile.historicalSnapshots.length === 0) {
        return {
            followerGrowth: [],
            engagementTrend: [],
        };
    }

    const snapshots = [...profile.historicalSnapshots]
        .filter((item) => item?.capturedAt)
        .sort((a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime())
        .slice(-12);

    return {
        followerGrowth: snapshots.map((item) => ({
            date: new Date(item.capturedAt),
            label: formatDateLabel(item.capturedAt),
            followers: Math.round(Number(item.followersCount || 0)),
        })),
        engagementTrend: snapshots.map((item) => ({
            date: new Date(item.capturedAt),
            label: formatDateLabel(item.capturedAt),
            engagementRate: Number(Number(item.engagementRate || 0).toFixed(2)),
        })),
    };
}

function upsertTrendPoint(history, nextPoint) {
    if (!Array.isArray(history) || history.length === 0) return [nextPoint];
    const cloned = history.map((point) => ({ ...point }));
    const last = cloned[cloned.length - 1];
    const lastDate = new Date(last.date).toISOString().slice(0, 10);
    const nextDate = new Date(nextPoint.date).toISOString().slice(0, 10);

    if (lastDate === nextDate) {
        cloned[cloned.length - 1] = nextPoint;
        return cloned.slice(-12);
    }

    cloned.push(nextPoint);
    return cloned.slice(-12);
}

function isAnalyticsFresh(profile, analytics, { forceRecalculate = false } = {}) {
    if (forceRecalculate || !analytics) return false;
    const analyticsUpdatedAt = analytics.updatedAt ? new Date(analytics.updatedAt).getTime() : 0;
    const profileUpdatedAt = profile.updatedAt ? new Date(profile.updatedAt).getTime() : 0;
    if (!analyticsUpdatedAt) return false;
    if (profileUpdatedAt > analyticsUpdatedAt) return false;
    if ((Date.now() - analyticsUpdatedAt) > ANALYTICS_READ_STALE_MS) return false;
    return true;
}

async function getInfluencerProfileCollection() {
    const info = await getProfileCollectionInfo();
    return {
        info,
        collection: mongoose.connection.db.collection(info.influencerCollection),
    };
}

async function getAccessibleProfiles({ user, search = '' }) {
    const { collection, info } = await getInfluencerProfileCollection();
    const query = {};

    if (user.role === 'influencer') {
        query.userId = toObjectId(user._id);
    }

    if (search) {
        query.$or = [
            { fullName: { $regex: search, $options: 'i' } },
            { displayName: { $regex: search, $options: 'i' } },
            { instagramUsername: { $regex: search, $options: 'i' } },
            { niche: { $regex: search, $options: 'i' } },
        ];
    }

    const profiles = await collection.find(query, { projection: PROFILE_LIST_PROJECTION }).sort({ followersCount: -1, updatedAt: -1 }).limit(ANALYTICS_LIST_LIMIT).toArray();
    return { profiles, collectionInfo: info };
}

async function getProfileById({ id, user }) {
    const { collection, info } = await getInfluencerProfileCollection();
    const query = {};

    if (id === 'me') {
        query.userId = toObjectId(user._id);
    } else if (isValidObjectId(id)) {
        query._id = toObjectId(id);
    } else {
        const error = new Error('Invalid influencer ID');
        error.statusCode = 400;
        throw error;
    }

    if (user.role === 'influencer' && id !== 'me') {
        query.userId = toObjectId(user._id);
    }

    const profile = await collection.findOne(query);
    if (!profile) {
        const error = new Error('Influencer profile not found');
        error.statusCode = 404;
        throw error;
    }

    return { profile, collectionInfo: info };
}

async function getCampaignPricingSummary(profile) {
    const requests = await CampaignRequest.find({
        influencerUserId: profile.userId,
        status: { $in: ['accepted', 'deal_closed'] },
    }).select('campaignType agreedPrice').lean();

    const priced = requests.filter((request) => Number.isFinite(request.agreedPrice) && request.agreedPrice > 0);
    const averageForType = (campaignType) => {
        const matches = priced.filter((request) => request.campaignType === campaignType).map((request) => request.agreedPrice);
        if (!matches.length) return null;
        return matches.reduce((sum, value) => sum + value, 0) / matches.length;
    };

    const averageAgreedPrice = priced.length
        ? priced.reduce((sum, request) => sum + request.agreedPrice, 0) / priced.length
        : null;

    const estimatedPostRate = [profile.avgPostPrice, averageForType('sponsored_post'), averageAgreedPrice].find((value) => Number.isFinite(value) && value > 0) || null;
    const estimatedReelRate = [profile.avgReelPrice, averageForType('reel'), averageForType('ugc'), averageAgreedPrice].find((value) => Number.isFinite(value) && value > 0) || null;

    return {
        estimatedPostRate,
        estimatedReelRate,
        averageAgreedPrice,
    };
}

function deriveMediaStats(profile) {
    const cutoffTime = Date.now() - SIXTY_DAYS_IN_MS;
    const media = (Array.isArray(profile.recentMediaSummary) ? profile.recentMediaSummary : [])
        .filter((item) => {
            if (!item?.timestamp) return false;
            const timestamp = new Date(item.timestamp).getTime();
            return Number.isFinite(timestamp) && timestamp >= cutoffTime;
        });
    const totalPosts = media.length;
    const totalViews = media.reduce((sum, item) => sum + Number(item.viewCount || item.videoViews || 0), 0);
    const likes = media.reduce((sum, item) => sum + Number(item.likeCount || 0), 0);
    const comments = media.reduce((sum, item) => sum + Number(item.commentsCount || 0), 0);
    const shares = media.reduce((sum, item) => sum + Number(item.shareCount || 0), 0);
    const saves = media.reduce((sum, item) => sum + Number(item.saveCount || 0), 0);
    const totalEngagements = likes + comments + shares + saves;

    const engagementRates = media.map((item) => calculateEngagementRate({
        likes: Number(item.likeCount || 0),
        comments: Number(item.commentsCount || 0),
        shares: Number(item.shareCount || 0),
        followers: Number(profile.followersCount || 0),
    }));

    return {
        media,
        totalPosts,
        totalViews,
        likes,
        comments,
        shares,
        saves,
        totalEngagements,
        engagementRates,
    };
}

async function buildAnalyticsDocument(profile, existingAnalytics = null, { appendTrendPoint = true } = {}) {
    const followers = Number(profile.followersCount || 0);
    const previousFollowers = Number(existingAnalytics?.metrics?.followers || 0);
    const previousEngagementRate = Number(existingAnalytics?.metrics?.engagementRate || 0);
    const mediaStats = deriveMediaStats(profile);
    const pricing = await getCampaignPricingSummary(profile);

    const averageViews = Number(profile.avgViews || calculateAverageViews({
        totalViews: mediaStats.totalViews,
        totalPosts: mediaStats.totalPosts,
    }));
    const engagementRate = Number(profile.engagementRate || calculateEngagementRate({
        likes: mediaStats.likes,
        comments: mediaStats.comments,
        shares: mediaStats.shares,
        followers,
    }));
    const viewRate = Number(profile.viewRate || calculateViewRate({ averageViews, followers }));
    const commentRate = calculateCommentRate({ comments: mediaStats.comments, views: mediaStats.totalViews });
    const likeToViewRate = calculateLikeToViewRate({ likes: mediaStats.likes, views: mediaStats.totalViews });
    const growthRate = Number(profile.growthRate || calculateGrowthRate({ currentFollowers: followers, previousFollowers }));
    const costPerView = profile.costPerView != null ? Number(profile.costPerView) : calculateCostPerView({ postRate: pricing.estimatedPostRate, averageViews });
    const costPerEngagement = profile.costPerEngagement != null ? Number(profile.costPerEngagement) : calculateCostPerEngagement({ postRate: pricing.estimatedPostRate, totalEngagements: mediaStats.totalEngagements });
    const consistencyScore = Number(profile.consistencyScore || calculateConsistencyScore({ engagementRates: mediaStats.engagementRates }));
    const costEfficiencyScore = calculateCostEfficiencyScore({ costPerView });
    const engagementGrowthDelta = previousEngagementRate > 0
        ? ((engagementRate - previousEngagementRate) / previousEngagementRate) * 100
        : 100;
    const authenticityScore = Number(profile.authenticityScore || calculateAuthenticityScore({
        followers,
        engagementRate,
        viewRate,
        growthRate,
        commentRate,
        engagementGrowthDelta,
    }));
    const scoreBundle = calculateFinalInfluencerScore({
        engagementRate,
        viewRate,
        authenticityScore,
        growthRate,
        costEfficiencyScore,
        consistencyScore,
    });
    const engagementScore = scoreBundle.engagementScore;
    const viewRateScore = scoreBundle.viewRateScore;
    const growthScore = scoreBundle.growthScore;
    const finalScore = profile.influencerScore != null ? Number(profile.influencerScore) : scoreBundle.finalScore;
    const ratingTier = getInfluencerRatingTier(finalScore);
    const estimatedMediaValue = calculateEstimatedMediaValue({
        averageViews,
        totalEngagements: mediaStats.totalEngagements,
        followers,
        finalScore,
    });
    const predictedROI = calculatePredictedROI({
        estimatedMediaValue,
        postRate: pricing.estimatedPostRate,
    });

    const snapshotTrend = buildTrendHistoryFromSnapshots(profile);
    const baseFollowerGrowth = Array.isArray(existingAnalytics?.charts?.followerGrowth) && existingAnalytics.charts.followerGrowth.length
        ? existingAnalytics.charts.followerGrowth
        : snapshotTrend.followerGrowth;
    const baseEngagementTrend = Array.isArray(existingAnalytics?.charts?.engagementTrend) && existingAnalytics.charts.engagementTrend.length
        ? existingAnalytics.charts.engagementTrend
        : snapshotTrend.engagementTrend;
    const nextTrendPoint = buildTrendPoint(new Date(), followers, engagementRate);
    const followerGrowth = appendTrendPoint
        ? upsertTrendPoint(baseFollowerGrowth, nextTrendPoint)
        : baseFollowerGrowth;
    const engagementTrend = (appendTrendPoint
        ? upsertTrendPoint(baseEngagementTrend, nextTrendPoint)
        : baseEngagementTrend)
        .map(({ date, label, engagementRate: value }) => ({ date, label, engagementRate: value }));

    const charts = {
        followerGrowth,
        engagementTrend,
        engagementBreakdown: [
            { name: 'Likes', value: mediaStats.likes },
            { name: 'Comments', value: mediaStats.comments },
            { name: 'Shares', value: mediaStats.shares },
            { name: 'Saves', value: mediaStats.saves },
        ],
        demographics: {
            gender: normalizeGenderDistribution(profile.demographics?.genderDistribution || profile.demographics?.gender),
            age: normalizeAgeDistribution(profile.demographics?.ageDistribution, profile.demographics?.genderAge),
            country: normalizeCountryDistribution(profile.demographics?.topCountries || profile.demographics?.countries),
        },
        radar: [
            { metric: 'Engagement', value: Math.round(engagementScore) },
            { metric: 'View Rate', value: Math.round(viewRateScore) },
            { metric: 'Authenticity', value: Math.round(authenticityScore) },
            { metric: 'Growth', value: Math.round(growthScore) },
            { metric: 'Cost Efficiency', value: Math.round(costEfficiencyScore) },
            { metric: 'Consistency', value: Math.round(consistencyScore) },
        ],
        roi: {
            predictedROI,
            estimatedMediaValue,
            finalScore,
            ratingTier,
        },
    };

    const metrics = {
        followers,
        previousFollowers,
        totalPosts: mediaStats.totalPosts,
        postsAnalyzed: Number(profile.postsAnalyzed || mediaStats.totalPosts),
        totalViews: mediaStats.totalViews,
        likes: mediaStats.likes,
        comments: mediaStats.comments,
        shares: mediaStats.shares,
        saves: mediaStats.saves,
        totalEngagements: mediaStats.totalEngagements,
        engagementRate: Number(engagementRate.toFixed(2)),
        averageViews: Number(averageViews.toFixed(2)),
        viewRate: Number(viewRate.toFixed(2)),
        commentRate: Number(commentRate.toFixed(4)),
        likeToViewRate: Number(likeToViewRate.toFixed(4)),
        growthRate: Number(growthRate.toFixed(2)),
        costPerView: costPerView == null ? null : Number(costPerView.toFixed(4)),
        costPerEngagement: costPerEngagement == null ? null : Number(costPerEngagement.toFixed(4)),
        authenticityScore: Math.round(authenticityScore),
        consistencyScore: Math.round(clamp(consistencyScore)),
        costEfficiencyScore: Math.round(clamp(costEfficiencyScore)),
        finalScore,
        ratingTier,
        estimatedMediaValue,
        predictedROI,
        estimatedCostPerPost: pricing.estimatedPostRate == null ? null : Number(pricing.estimatedPostRate.toFixed(2)),
        estimatedCostPerReel: pricing.estimatedReelRate == null ? null : Number(pricing.estimatedReelRate.toFixed(2)),
    };

    return {
        influencerId: profile._id,
        userId: profile.userId,
        platform: profile.platform || 'Instagram',
        period: 'lifetime',
        metrics,
        charts,
        metadata: {
            fullName: profile.fullName || profile.displayName || profile.instagramUsername || 'Influencer',
            username: profile.instagramUsername || profile.username || null,
            niche: profile.niche || null,
            profilePictureUrl: profile.profilePictureUrl || null,
            collectionSource: 'resolved-profile-collection',
        },
    };
}

async function persistAnalytics(profile, existingAnalytics = null, { appendTrendPoint = true } = {}) {
    const nextDocument = await buildAnalyticsDocument(profile, existingAnalytics, { appendTrendPoint });

    return Analytics.findOneAndUpdate(
        {
            influencerId: profile._id,
            platform: nextDocument.platform,
            period: nextDocument.period,
        },
        {
            $set: {
                userId: nextDocument.userId,
                metrics: nextDocument.metrics,
                charts: nextDocument.charts,
                metadata: nextDocument.metadata,
            },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();
}

async function ensureAnalyticsForProfile(profile, existingAnalytics = null, options = {}) {
    if (isAnalyticsFresh(profile, existingAnalytics, options)) {
        return existingAnalytics;
    }

    return persistAnalytics(profile, existingAnalytics, {
        appendTrendPoint: options.appendTrendPoint ?? !existingAnalytics,
    });
}

function buildSummary(profile, analytics) {
    return {
        influencerId: String(profile._id),
        userId: String(profile.userId),
        fullName: profile.fullName || profile.displayName || profile.instagramUsername || 'Influencer',
        username: profile.instagramUsername || profile.username || null,
        niche: profile.niche || null,
        country: profile.country || null,
        followers: Number(profile.followersCount || 0),
        profilePictureUrl: profile.profilePictureUrl || null,
        metrics: analytics.metrics,
        updatedAt: analytics.updatedAt,
    };
}

async function listInfluencerAnalytics({ user, search }) {
    const { profiles, collectionInfo } = await getAccessibleProfiles({ user, search });
    const analyticsDocs = await Analytics.find({
        influencerId: { $in: profiles.map((profile) => profile._id) },
        platform: 'Instagram',
        period: 'lifetime',
    }).lean();
    const analyticsByInfluencerId = new Map(analyticsDocs.map((doc) => [String(doc.influencerId), doc]));

    const resolvedAnalytics = await Promise.all(
        profiles.map((profile) => ensureAnalyticsForProfile(
            profile,
            analyticsByInfluencerId.get(String(profile._id)) || null,
            { appendTrendPoint: false }
        ))
    );

    return {
        influencers: profiles.map((profile, index) => buildSummary(profile, resolvedAnalytics[index])),
        collectionInfo,
    };
}

async function getInfluencerAnalyticsDetail({ user, id }) {
    const { profile, collectionInfo } = await getProfileById({ id, user });
    const existingAnalytics = await Analytics.findOne({
        influencerId: profile._id,
        platform: profile.platform || 'Instagram',
        period: 'lifetime',
    }).lean();
    const analytics = await ensureAnalyticsForProfile(profile, existingAnalytics, { appendTrendPoint: false });

    return {
        influencer: {
            influencerId: String(profile._id),
            userId: String(profile.userId),
            fullName: profile.fullName || profile.displayName || profile.instagramUsername || 'Influencer',
            username: profile.instagramUsername || profile.username || null,
            niche: profile.niche || null,
            country: profile.country || null,
            profilePictureUrl: profile.profilePictureUrl || null,
            followers: Number(profile.followersCount || 0),
            platform: profile.platform || 'Instagram',
        },
        analytics,
        collectionInfo,
    };
}

async function recalculateInfluencerAnalytics({ user, id }) {
    if (!['admin', 'brand'].includes(user.role)) {
        const error = new Error('Only admin and brand users can recalculate analytics');
        error.statusCode = 403;
        throw error;
    }

    const { profile, collectionInfo } = await getProfileById({ id, user });
    const existingAnalytics = await Analytics.findOne({
        influencerId: profile._id,
        platform: profile.platform || 'Instagram',
        period: 'lifetime',
    }).lean();
    const analytics = await ensureAnalyticsForProfile(profile, existingAnalytics, {
        forceRecalculate: true,
        appendTrendPoint: true,
    });

    return {
        influencerId: String(profile._id),
        analytics,
        collectionInfo,
    };
}

module.exports = {
    listInfluencerAnalytics,
    getInfluencerAnalyticsDetail,
    recalculateInfluencerAnalytics,
};
