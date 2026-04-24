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

function estimateStoryRate(postRate, reelRate) {
    if (Number.isFinite(postRate) && postRate > 0) return Number((postRate * 0.35).toFixed(2));
    if (Number.isFinite(reelRate) && reelRate > 0) return Number((reelRate * 0.25).toFixed(2));
    return null;
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

    const profiles = await collection.find(query).sort({ followersCount: -1, updatedAt: -1 }).toArray();
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
    const estimatedStoryRate = estimateStoryRate(estimatedPostRate, estimatedReelRate);

    return {
        estimatedPostRate,
        estimatedReelRate,
        estimatedStoryRate,
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

async function buildAnalyticsDocument(profile, existingAnalytics = null) {
    const followers = Number(profile.followersCount || 0);
    const previousFollowers = Number(existingAnalytics?.metrics?.followers || 0);
    const previousEngagementRate = Number(existingAnalytics?.metrics?.engagementRate || 0);
    const mediaStats = deriveMediaStats(profile);
    const pricing = await getCampaignPricingSummary(profile);

    const averageViews = calculateAverageViews({
        totalViews: mediaStats.totalViews,
        totalPosts: mediaStats.totalPosts,
    });
    const engagementRate = calculateEngagementRate({
        likes: mediaStats.likes,
        comments: mediaStats.comments,
        shares: mediaStats.shares,
        followers,
    });
    const viewRate = calculateViewRate({ averageViews, followers });
    const commentRate = calculateCommentRate({ comments: mediaStats.comments, views: mediaStats.totalViews });
    const likeToViewRate = calculateLikeToViewRate({ likes: mediaStats.likes, views: mediaStats.totalViews });
    const growthRate = calculateGrowthRate({ currentFollowers: followers, previousFollowers });
    const costPerView = calculateCostPerView({ postRate: pricing.estimatedPostRate, averageViews });
    const costPerEngagement = calculateCostPerEngagement({ postRate: pricing.estimatedPostRate, totalEngagements: mediaStats.totalEngagements });
    const consistencyScore = calculateConsistencyScore({ engagementRates: mediaStats.engagementRates });
    const costEfficiencyScore = calculateCostEfficiencyScore({ costPerView });
    const engagementGrowthDelta = previousEngagementRate > 0
        ? ((engagementRate - previousEngagementRate) / previousEngagementRate) * 100
        : 100;
    const authenticityScore = calculateAuthenticityScore({
        followers,
        engagementRate,
        viewRate,
        growthRate,
        commentRate,
        engagementGrowthDelta,
    });
    const { engagementScore, viewRateScore, growthScore, finalScore } = calculateFinalInfluencerScore({
        engagementRate,
        viewRate,
        authenticityScore,
        growthRate,
        costEfficiencyScore,
        consistencyScore,
    });
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

    const followerGrowth = upsertTrendPoint(existingAnalytics?.charts?.followerGrowth || [], buildTrendPoint(new Date(), followers, engagementRate));
    const engagementTrend = upsertTrendPoint(existingAnalytics?.charts?.engagementTrend || [], buildTrendPoint(new Date(), followers, engagementRate))
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
            gender: mapDemographicEntries(profile.demographics?.genderDistribution),
            age: mapDemographicEntries(profile.demographics?.ageDistribution),
            country: mapDemographicEntries(profile.demographics?.topCountries),
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
        postsAnalyzed: mediaStats.totalPosts,
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
        estimatedCostPerStory: pricing.estimatedStoryRate,
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

async function ensureAnalyticsForProfile(profile) {
    const existingAnalytics = await Analytics.findOne({
        influencerId: profile._id,
        platform: profile.platform || 'Instagram',
        period: 'lifetime',
    }).lean();

    const nextDocument = await buildAnalyticsDocument(profile, existingAnalytics);

    const analytics = await Analytics.findOneAndUpdate(
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

    return analytics;
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
    const analyticsDocs = await Promise.all(profiles.map((profile) => ensureAnalyticsForProfile(profile)));

    return {
        influencers: profiles.map((profile, index) => buildSummary(profile, analyticsDocs[index])),
        collectionInfo,
    };
}

async function getInfluencerAnalyticsDetail({ user, id }) {
    const { profile, collectionInfo } = await getProfileById({ id, user });
    const analytics = await ensureAnalyticsForProfile(profile);

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
    const analytics = await ensureAnalyticsForProfile(profile);

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
