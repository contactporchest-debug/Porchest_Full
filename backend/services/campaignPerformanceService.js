const CampaignRequest = require('../models/CampaignRequest');
const ClickEvent = require('../models/ClickEvent');
const PurchaseEvent = require('../models/PurchaseEvent');
const InfluencerProfile = require('../models/InfluencerProfile');
const MediaRaw = require('../models/MediaRaw');

const DAY_MS = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = [1, 10, 20, 30];

const ONGOING_STATUSES = new Set([
    'accepted',
    'active',
    'brand_paid_work_can_start',
    'campaign_active',
    'content_submitted',
    'content_approved',
    'posted',
    'brand_approved',
    'live_post_submitted',
]);

function toNumber(value) {
    const next = Number(value);
    return Number.isFinite(next) ? next : 0;
}

function toDate(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeString(value) {
    return value == null ? '' : String(value).trim();
}

function normalizeLink(value) {
    const input = normalizeString(value);
    if (!input) return '';
    try {
        const url = new URL(input);
        return `${url.hostname}${url.pathname}`.replace(/\/+$/, '').toLowerCase();
    } catch {
        return input.split('?')[0].split('#')[0].replace(/\/+$/, '').toLowerCase();
    }
}

function linkMatches(left, right) {
    const a = normalizeLink(left);
    const b = normalizeLink(right);
    if (!a || !b) return false;
    return a === b || a.includes(b) || b.includes(a);
}

function resolveCampaignName(campaign) {
    return campaign?.campaignTitle || campaign?.brief?.campaignObjective || campaign?.name || 'Campaign';
}

function resolveInfluencerName(campaign, profile) {
    return profile?.fullName
        || profile?.displayName
        || profile?.instagramUsername
        || profile?.username
        || campaign?.influencerName
        || campaign?.influencerUsername
        || 'Influencer';
}

function resolveInfluencerUsername(campaign, profile) {
    return profile?.instagramUsername || profile?.username || campaign?.influencerUsername || null;
}

function resolveDeadline(campaign) {
    return campaign?.campaignEndAt
        || campaign?.campaignEndDate
        || campaign?.timeline?.campaignEndDate
        || campaign?.postingDeadline
        || campaign?.brief?.postingDeadline
        || null;
}

function resolveStartDate(campaign) {
    return campaign?.campaignStartAt
        || campaign?.campaignActiveAt
        || campaign?.acceptedAt
        || campaign?.campaignStartDate
        || campaign?.timeline?.campaignStartDate
        || campaign?.createdAt
        || campaign?.sentAt
        || null;
}

function resolvePrice(campaign) {
    return toNumber(
        campaign?.pricing?.agreedFee
        ?? campaign?.agreedPrice
        ?? campaign?.agreedFee
        ?? campaign?.pricing?.brandOffer
        ?? campaign?.brandOfferedFee
        ?? 0
    );
}

function normalizeLifecycleStatus(status) {
    const value = String(status || '').toLowerCase();
    if (['accepted', 'brand_approved'].includes(value)) return 'accepted';
    if (['active', 'brand_paid_work_can_start', 'campaign_active', 'content_submitted', 'content_approved', 'posted', 'live_post_submitted'].includes(value)) {
        return 'active';
    }
    return 'requested';
}

function getFollowerSnapshotAt(profile, timestamp) {
    const snapshots = Array.isArray(profile?.historicalSnapshots) ? profile.historicalSnapshots : [];
    const target = toDate(timestamp);
    if (!snapshots.length || !target) return toNumber(profile?.followersCount || profile?.igFollowersCount || 0);

    const eligible = snapshots
        .filter((snapshot) => snapshot?.capturedAt && toDate(snapshot.capturedAt) && toDate(snapshot.capturedAt).getTime() <= target.getTime())
        .sort((a, b) => toDate(a.capturedAt).getTime() - toDate(b.capturedAt).getTime());

    if (!eligible.length) {
        return toNumber(profile?.followersCount || profile?.igFollowersCount || 0);
    }

    return toNumber(eligible[eligible.length - 1]?.followersCount || profile?.followersCount || profile?.igFollowersCount || 0);
}

function extractMediaMetrics(mediaDoc) {
    const payload = mediaDoc?.payload || {};
    return {
        postId: normalizeString(payload.id || payload.media_id || mediaDoc?.mediaId || mediaDoc?._id || ''),
        timestamp: payload.timestamp || payload.created_time || mediaDoc?.fetchedAt || payload.taken_at || payload.media_timestamp || payload.date_created || null,
        likes: toNumber(payload.like_count ?? payload.likes ?? payload.likeCount ?? mediaDoc?.likeCount),
        comments: toNumber(payload.comments_count ?? payload.comments ?? payload.commentsCount ?? mediaDoc?.commentsCount),
        shares: toNumber(payload.share_count ?? payload.shares ?? payload.shareCount ?? 0),
        saves: toNumber(payload.save_count ?? payload.saves ?? payload.saveCount ?? 0),
        views: toNumber(payload.view_count ?? payload.views ?? payload.play_count ?? payload.playCount ?? payload.video_views ?? payload.reach ?? 0),
        impressions: toNumber(payload.impression_count ?? payload.impressions ?? payload.impressionCount ?? 0),
        reach: toNumber(payload.reach_count ?? payload.reach ?? payload.reachCount ?? 0),
        permalink: normalizeString(payload.permalink || payload.link || mediaDoc?.permalink || ''),
    };
}

function pickMatchedMedia(campaign, influencerProfile, mediaDocs) {
    const postLink = campaign?.content?.postLink || campaign?.postLink || null;
    if (!postLink || !Array.isArray(mediaDocs) || !mediaDocs.length) return null;

    const directMatch = mediaDocs.find((doc) => {
        const link = doc?.payload?.permalink || doc?.payload?.link || doc?.permalink || '';
        return linkMatches(postLink, link);
    });

    if (directMatch) return directMatch;

    const shortcode = normalizeLink(postLink).split('/p/').pop() || '';
    if (shortcode) {
        const shortcodeMatch = mediaDocs.find((doc) => {
            const link = normalizeLink(doc?.payload?.permalink || doc?.payload?.link || doc?.permalink || '');
            return link.includes(shortcode);
        });
        if (shortcodeMatch) return shortcodeMatch;
    }

    return null;
}

function buildTimeframeSummary({ campaign, influencerProfile, matchedMedia, clicks, purchases, days, now }) {
    const cutoff = new Date(now.getTime() - (days * DAY_MS));
    const withinWindow = (item) => toDate(item.timestamp) && toDate(item.timestamp).getTime() >= cutoff.getTime();

    const timeframeClicks = clicks.filter(withinWindow);
    const timeframePurchases = purchases.filter(withinWindow);
    const campaignCost = resolvePrice(campaign);
    const matchedMediaMetrics = matchedMedia ? extractMediaMetrics(matchedMedia) : null;
    const matchedMediaTimestamp = matchedMediaMetrics?.timestamp || matchedMedia?.timestamp || null;
    const post = matchedMediaMetrics && matchedMediaTimestamp && toDate(matchedMediaTimestamp) && toDate(matchedMediaTimestamp).getTime() >= cutoff.getTime()
        ? matchedMediaMetrics
        : null;
    const followersAtPostTime = post?.timestamp ? getFollowerSnapshotAt(influencerProfile, post.timestamp) : toNumber(influencerProfile?.followersCount || influencerProfile?.igFollowersCount || 0);
    const likes = toNumber(post?.likes || 0);
    const comments = toNumber(post?.comments || 0);
    const shares = toNumber(post?.shares || 0);
    const saves = toNumber(post?.saves || 0);
    const views = toNumber(post?.views || post?.reach || post?.impressions || 0);
    const impressions = toNumber(post?.impressions || post?.views || 0);
    const postsAnalyzed = post ? 1 : 0;
    const engagementRate = followersAtPostTime > 0
        ? Number((((likes + comments + shares) / followersAtPostTime) * 100).toFixed(2))
        : 0;
    const viewRate = followersAtPostTime > 0
        ? Number(((views / followersAtPostTime) * 100).toFixed(2))
        : 0;
    const postsPerWeek = Number((postsAnalyzed / Math.max(days / 7, 1)).toFixed(2));
    const revenue = timeframePurchases.reduce((sum, item) => sum + toNumber(item.orderValue), 0);
    const conversions = timeframePurchases.length;
    const roas = campaignCost > 0 ? Number((revenue / campaignCost).toFixed(2)) : null;
    const cpa = campaignCost > 0 && conversions > 0 ? Number((campaignCost / conversions).toFixed(2)) : null;

    return {
        days,
        label: days === 1 ? 'Today' : `${days} Days`,
        windowLabel: days === 1 ? 'Last 24 hours' : `Last ${days} days`,
        likes,
        comments,
        shares,
        saves,
        engagementRate,
        views,
        impressions,
        viewRate,
        postsAnalyzed,
        postsPerWeek,
        totalClicks: timeframeClicks.length,
        uniqueVisitors: timeframeClicks.filter((item) => item.isUnique || item.sessionId).length,
        conversions,
        revenue,
        roas,
        cpa,
        campaignCost,
        followersAtPostTime,
        hasMatchedMedia: Boolean(post),
        postTimestamp: post?.timestamp || null,
        mediaLink: post?.permalink || campaign?.content?.postLink || campaign?.postLink || null,
    };
}

async function buildCampaignPerformanceReport({ brandProfileId }) {
    const now = new Date();
    const maxWindowCutoff = new Date(now.getTime() - (30 * DAY_MS));

    const collaborations = await CampaignRequest.find({
        brandId: brandProfileId,
        status: { $in: [...ONGOING_STATUSES] },
    }).sort({ createdAt: -1 }).lean();

    if (!collaborations.length) {
        return {
            campaigns: [],
            summary: {
                campaignCount: 0,
                activeCampaignCount: 0,
                acceptedCampaignCount: 0,
                totalSpend: 0,
                totalRevenue: 0,
                totalClicks: 0,
                totalConversions: 0,
                averageROAS: 0,
                averageCPA: 0,
            },
        };
    }

    const influencerProfileIds = [...new Set(collaborations.map((item) => item.influencerId || item.influencerProfileId).filter(Boolean).map((value) => String(value)))];
    const influencerUserIds = [...new Set(collaborations.map((item) => item.influencerUserId).filter(Boolean).map((value) => String(value)))];

    const profileQuery = { _id: null };
    const profileOr = [];
    if (influencerProfileIds.length) profileOr.push({ _id: { $in: influencerProfileIds } });
    if (influencerUserIds.length) profileOr.push({ userId: { $in: influencerUserIds } });
    if (profileOr.length) {
        delete profileQuery._id;
        profileQuery.$or = profileOr;
    }

    const mediaQuery = { fetchedAt: { $gte: maxWindowCutoff }, userId: null };
    const mediaOr = [];
    if (influencerProfileIds.length) mediaOr.push({ influencerProfileId: { $in: influencerProfileIds } });
    if (influencerUserIds.length) mediaOr.push({ userId: { $in: influencerUserIds } });
    if (mediaOr.length) {
        delete mediaQuery.userId;
        mediaQuery.$or = mediaOr;
    }

    const [profiles, clickEvents, purchaseEvents, mediaDocs] = await Promise.all([
        InfluencerProfile.find(profileQuery).lean(),
        ClickEvent.find({
            collaborationId: { $in: collaborations.map((item) => item._id) },
            timestamp: { $gte: maxWindowCutoff },
        }).sort({ timestamp: -1 }).lean(),
        PurchaseEvent.find({
            collaborationId: { $in: collaborations.map((item) => item._id) },
            timestamp: { $gte: maxWindowCutoff },
        }).sort({ timestamp: -1 }).lean(),
        MediaRaw.find(mediaQuery).sort({ fetchedAt: -1 }).lean(),
    ]);

    const profileMap = new Map();
    profiles.forEach((profile) => {
        profileMap.set(String(profile._id), profile);
        if (profile.userId) profileMap.set(String(profile.userId), profile);
        if (profile.influencerProfileId) profileMap.set(String(profile.influencerProfileId), profile);
        if (profile.instagramUsername) profileMap.set(String(profile.instagramUsername).toLowerCase(), profile);
    });

    const mediaByInfluencer = new Map();
    mediaDocs.forEach((doc) => {
        const keyA = doc.influencerProfileId ? String(doc.influencerProfileId) : null;
        const keyB = doc.userId ? String(doc.userId) : null;
        if (keyA && !mediaByInfluencer.has(keyA)) mediaByInfluencer.set(keyA, []);
        if (keyB && !mediaByInfluencer.has(keyB)) mediaByInfluencer.set(keyB, []);
        if (keyA) mediaByInfluencer.get(keyA).push(doc);
        if (keyB) mediaByInfluencer.get(keyB).push(doc);
    });

    const clickMap = new Map();
    const purchaseMap = new Map();
    const groupByCollab = (map, item) => {
        const key = String(item.collaborationId);
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(item);
    };

    clickEvents.forEach((item) => groupByCollab(clickMap, item));
    purchaseEvents.forEach((item) => groupByCollab(purchaseMap, item));

    const campaigns = collaborations.map((campaign) => {
        const campaignId = String(campaign._id);
        const profileKey = campaign.influencerId ? String(campaign.influencerId) : campaign.influencerProfileId ? String(campaign.influencerProfileId) : campaign.influencerUserId ? String(campaign.influencerUserId) : null;
        const influencerProfile = profileKey ? profileMap.get(profileKey) || null : null;
        const relevantMediaDocs = profileKey ? (mediaByInfluencer.get(profileKey) || []) : [];
        const matchedMedia = pickMatchedMedia(campaign, influencerProfile, relevantMediaDocs);
        const campaignClicks = clickMap.get(campaignId) || [];
        const campaignPurchases = purchaseMap.get(campaignId) || [];
        const timeframeMetrics = {};
        WINDOW_DAYS.forEach((days) => {
            const key = days === 1 ? 'today' : `${days}days`;
            timeframeMetrics[key] = buildTimeframeSummary({
                campaign,
                influencerProfile,
                matchedMedia,
                clicks: campaignClicks,
                purchases: campaignPurchases,
                days,
                now,
            });
        });

        const dayDelta = Math.max(0, Math.ceil((now.getTime() - new Date(resolveStartDate(campaign) || campaign.createdAt || campaign.sentAt || now).getTime()) / DAY_MS));
        const daysRan = Math.min(30, dayDelta);
        const cost = resolvePrice(campaign);
        const baseline = timeframeMetrics['30days'];

        return {
            campaignId,
            name: resolveCampaignName(campaign),
            influencer: resolveInfluencerName(campaign, influencerProfile),
            username: resolveInfluencerUsername(campaign, influencerProfile),
            price: cost,
            status: campaign.status,
            lifecycleStatus: normalizeLifecycleStatus(campaign.status),
            uploadedMediaLink: campaign?.content?.postLink || campaign?.postLink || null,
            trackingLink: campaign?.brief?.trackingLink || null,
            promoCode: campaign?.brief?.promoCode || null,
            daysRan,
            progressPercent: Math.min(100, Math.round((daysRan / 30) * 100)),
            mediaMetrics: baseline,
            timeframes: timeframeMetrics,
            clicksAndSales: {
                totalClicks: baseline.totalClicks,
                uniqueVisitors: baseline.uniqueVisitors,
                conversions: baseline.conversions,
                revenue: baseline.revenue,
            },
            roiMetrics: {
                revenue: baseline.revenue,
                conversions: baseline.conversions,
                roas: baseline.roas,
                cpa: baseline.cpa,
            },
        };
    });

    const summary = campaigns.reduce((acc, campaign) => {
        acc.campaignCount += 1;
        acc.totalSpend += toNumber(campaign.price);
        acc.totalRevenue += toNumber(campaign.roiMetrics.revenue);
        acc.totalClicks += toNumber(campaign.clicksAndSales.totalClicks);
        acc.totalConversions += toNumber(campaign.roiMetrics.conversions);
        acc.totalROAS += campaign.roiMetrics.roas != null ? toNumber(campaign.roiMetrics.roas) : 0;
        acc.roasCount += campaign.roiMetrics.roas != null ? 1 : 0;
        acc.totalCPA += campaign.roiMetrics.cpa != null ? toNumber(campaign.roiMetrics.cpa) : 0;
        acc.cpaCount += campaign.roiMetrics.cpa != null ? 1 : 0;
        acc.activeCampaignCount += campaign.lifecycleStatus === 'active' ? 1 : 0;
        acc.acceptedCampaignCount += campaign.lifecycleStatus === 'accepted' ? 1 : 0;
        return acc;
    }, {
        campaignCount: 0,
        activeCampaignCount: 0,
        acceptedCampaignCount: 0,
        totalSpend: 0,
        totalRevenue: 0,
        totalClicks: 0,
        totalConversions: 0,
        totalROAS: 0,
        roasCount: 0,
        totalCPA: 0,
        cpaCount: 0,
    });

    return {
        campaigns,
        summary: {
            campaignCount: summary.campaignCount,
            activeCampaignCount: summary.activeCampaignCount,
            acceptedCampaignCount: summary.acceptedCampaignCount,
            totalSpend: Number(summary.totalSpend.toFixed(2)),
            totalRevenue: Number(summary.totalRevenue.toFixed(2)),
            totalClicks: summary.totalClicks,
            totalConversions: summary.totalConversions,
            averageROAS: summary.roasCount ? Number((summary.totalROAS / summary.roasCount).toFixed(2)) : 0,
            averageCPA: summary.cpaCount ? Number((summary.totalCPA / summary.cpaCount).toFixed(2)) : 0,
        },
    };
}

module.exports = {
    buildCampaignPerformanceReport,
};
