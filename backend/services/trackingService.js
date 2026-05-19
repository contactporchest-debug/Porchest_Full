const CampaignRequest = require('../models/CampaignRequest');
const BrandProfile = require('../models/BrandProfile');
const InfluencerProfile = require('../models/InfluencerProfile');
const BrandTrackingConnection = require('../models/BrandTrackingConnection');
const { fetchIgProfile } = require('./instagramService');

const DEFAULT_BASE_URL = 'https://porchest.com';
const FOLLOWER_POLL_DELAY_MS = 500;
const GRACE_PERIOD_DAYS = 7;

function getTrackingBaseUrl() {
    return String(process.env.TRACKING_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
}

function normalizeUsername(username) {
    return String(username || 'PRCH')
        .slice(0, 4)
        .toUpperCase()
        .replace(/[^A-Z]/g, 'X');
}

function getCollaborationSuffix(collaborationId) {
    return String(collaborationId || '')
        .slice(-4)
        .toUpperCase()
        .padStart(4, 'X');
}

function getTokenFromProfile(profile) {
    return profile?.sync?.longLivedToken || profile?.sync?.accessToken || null;
}

function normalizeTrackingDestination(value) {
    const raw = String(value || '').trim();
    if (!raw) return null;
    if (/^https?:\/\//i.test(raw)) return raw.replace(/\/$/, '');
    return `https://${raw.replace(/\/$/, '')}`;
}

async function resolveTrackingDestination(brandId, fallbackWebsite) {
    const shopifyConnection = await BrandTrackingConnection.findOne({
        brandId,
        platform: 'shopify',
        status: { $nin: ['disconnected', 'not_started'] },
    }).select('storeUrl metadata status').lean();

    const shopifyStoreUrl = normalizeTrackingDestination(
        shopifyConnection?.storeUrl
        || shopifyConnection?.metadata?.shopify?.shopDomain
    );

    const destination = shopifyStoreUrl || normalizeTrackingDestination(fallbackWebsite) || 'https://porchest.com';

    return {
        destination,
        shopifyConnected: Boolean(shopifyStoreUrl),
        shopifyStoreUrl,
        shopifyConnection,
    };
}

/**
 * Generates a unique Porchest redirect URL for a collaboration.
 * @param {string} collaborationId
 * @param {string} influencerId
 * @param {string} brandWebsiteUrl
 * @returns {string}
 */
function generateTrackingLink(collaborationId, influencerId, brandWebsiteUrl) {
    const base = getTrackingBaseUrl();
    const dest = encodeURIComponent(brandWebsiteUrl || 'https://porchest.com');
    return `${base}/r?cid=${collaborationId}&iid=${influencerId}&dest=${dest}`;
}

/**
 * Generates a readable promo code from influencer username and collaboration id.
 * @param {string} influencerUsername
 * @param {string} collaborationId
 * @returns {string}
 */
function generatePromoCode(influencerUsername, collaborationId) {
    const prefix = normalizeUsername(influencerUsername);
    const suffix = getCollaborationSuffix(collaborationId);
    return `${prefix}-${suffix}`;
}

async function persistFollowerSnapshot(collaborationId, count) {
    const now = new Date();
    await CampaignRequest.findByIdAndUpdate(
        collaborationId,
        {
            $set: {
                'followerSnapshot.baseline.count': Number(count) || 0,
                'followerSnapshot.baseline.timestamp': now,
                'followerSnapshot.currentCount': Number(count) || 0,
                'followerSnapshot.netNewFollowers': 0,
                'followerSnapshot.growthRate': 0,
                'followerSnapshot.lastPolledAt': now,
            },
            $push: {
                'followerSnapshot.dailyReadings': {
                    count: Number(count) || 0,
                    timestamp: now,
                },
            },
        },
        { strict: false, new: true }
    );
}

/**
 * Takes a baseline follower snapshot when a collaboration is accepted.
 * @param {string} collaborationId
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
async function takeFollowerBaseline(collaborationId) {
    try {
        const collab = await CampaignRequest.findById(collaborationId).select('brandId').lean();
        if (!collab) {
            return { success: false, error: 'Collaboration not found' };
        }

        const brandProfile = await BrandProfile.findById(collab.brandId).select('igUserId sync').lean();
        if (!brandProfile?.igUserId) {
            return { success: false, error: 'Brand Instagram account not connected' };
        }

        const accessToken = getTokenFromProfile(brandProfile);
        if (!accessToken) {
            return { success: false, error: 'Brand Instagram token not connected' };
        }

        const profile = await fetchIgProfile(accessToken, brandProfile.igUserId);
        const count = Number(profile?.followers_count || 0);

        await persistFollowerSnapshot(collaborationId, count);
        console.log(`[FollowerSnapshot] Baseline set for collab ${collaborationId}: ${count}`);
        return { success: true };
    } catch (error) {
        console.error('[FollowerSnapshot] Baseline error:', error);
        return { success: false, error: error.message || 'Failed to take follower baseline' };
    }
}

/**
 * Polls follower growth for active collaborations.
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
async function pollFollowerGrowthForActiveCampaigns() {
    try {
        const activeCollabs = await CampaignRequest.find({
            status: { $in: ['brand_paid_work_can_start', 'campaign_active', 'content_submitted', 'content_approved', 'posted'] },
            'followerSnapshot.baseline.count': { $exists: true },
            $or: [
                { campaignEndAt: { $exists: true, $ne: null } },
                { campaignEndDate: { $exists: true, $ne: null } },
            ],
        }).select('brandId followerSnapshot campaignEndDate gracePeriodDays').lean();

        console.log(`[FollowerSnapshot] Polling ${activeCollabs.length} active campaigns`);

        for (const collab of activeCollabs) {
            try {
                const endDate = collab.campaignEndAt ? new Date(collab.campaignEndAt) : (collab.campaignEndDate ? new Date(collab.campaignEndDate) : null);
                if (!endDate) continue;

                const graceDays = Number(collab.gracePeriodDays || 3);
                const windowEnd = new Date(endDate.getTime() + (graceDays * 24 * 60 * 60 * 1000));
                if (Date.now() > windowEnd.getTime()) continue;

                const brandProfile = await BrandProfile.findById(collab.brandId).select('igUserId sync').lean();
                if (!brandProfile?.igUserId) continue;

                const accessToken = getTokenFromProfile(brandProfile);
                if (!accessToken) continue;

                const profile = await fetchIgProfile(accessToken, brandProfile.igUserId);
                const currentCount = Number(profile?.followers_count || 0);
                const baseline = Number(collab.followerSnapshot?.baseline?.count || 0);
                const netNew = currentCount - baseline;
                const growthRate = baseline > 0 ? Number(((netNew / baseline) * 100).toFixed(2)) : 0;
                const now = new Date();

                await CampaignRequest.findByIdAndUpdate(
                    collab._id,
                    {
                        $push: {
                            'followerSnapshot.dailyReadings': {
                                count: currentCount,
                                timestamp: now,
                            },
                        },
                        $set: {
                            'followerSnapshot.currentCount': currentCount,
                            'followerSnapshot.netNewFollowers': netNew,
                            'followerSnapshot.growthRate': growthRate,
                            'followerSnapshot.lastPolledAt': now,
                        },
                    },
                    { strict: false, new: true }
                );

                await new Promise((resolve) => setTimeout(resolve, FOLLOWER_POLL_DELAY_MS));
            } catch (error) {
                console.error(`[FollowerSnapshot] Error for collab ${collab._id}:`, error.message);
            }
        }

        return { success: true };
    } catch (error) {
        console.error('[FollowerSnapshot] Poll error:', error);
        return { success: false, error: error.message || 'Failed to poll follower growth' };
    }
}

async function releaseDueSecondPayouts() {
    try {
        const now = new Date();
        const dueCollabs = await CampaignRequest.find({
            status: 'campaign_active',
            campaignEndAt: { $exists: true, $ne: null, $lte: now },
            secondPayoutReleasedAt: { $exists: false },
        }).select('secondPayoutAmount payment campaignEndAt').lean();

        for (const collab of dueCollabs) {
            const payout = Number(collab.secondPayoutAmount || collab.payment?.portion2?.amount || collab.payment?.tranche2?.amount || 0);
            await CampaignRequest.findByIdAndUpdate(
                collab._id,
                {
                    $set: {
                        status: 'completed',
                        secondPayoutReleasedAt: now,
                        campaignCompletedAt: now,
                        'payment.status': 'released',
                        'payment.portion2.amount': payout,
                        'payment.portion2.releasedAt': now,
                        'payment.portion2.status': 'released',
                        'payment.tranche2.amount': payout,
                        'payment.tranche2.releasedAt': now,
                        'payment.tranche2.status': 'released',
                    },
                },
                { strict: false, new: true }
            );
        }

        return { success: true, released: dueCollabs.length };
    } catch (error) {
        console.error('[Payouts] Second payout release error:', error);
        return { success: false, error: error.message || 'Failed to release second payouts' };
    }
}

async function ensureTrackingAssets(collaborationId) {
    try {
        const collab = await CampaignRequest.findById(collaborationId)
            .select('brandId influencerId brief campaignStartDate campaignEndDate status followerSnapshot')
            .lean();
        if (!collab) {
            return { success: false, error: 'Collaboration not found' };
        }

        const existingPromoCode = collab.brief?.promoCode;
        const hasBaseline = Boolean(collab.followerSnapshot?.baseline?.count);

        const brandProfile = await BrandProfile.findById(collab.brandId).select('website businessName brandName sync').lean();
        const influencerProfile = await InfluencerProfile.findById(collab.influencerId).select('igUsername instagramUsername sync').lean();
        if (!brandProfile || !influencerProfile) {
            return { success: false, error: 'Brand or influencer profile not found' };
        }

        const { destination: trackingDestination, shopifyConnected, shopifyStoreUrl } = await resolveTrackingDestination(
            collab.brandId,
            brandProfile.website
        );

        const trackingLink = generateTrackingLink(
            collab._id.toString(),
            collab.influencerId.toString(),
            trackingDestination
        );

        const promoCode = existingPromoCode || generatePromoCode(
            influencerProfile.igUsername || influencerProfile.instagramUsername || 'PRCH',
            collab._id.toString()
        );

        const campaignStartDate = collab.campaignStartDate || new Date();
        const campaignEndDate = collab.campaignEndDate || new Date(Date.now() + (30 * 24 * 60 * 60 * 1000));

        await CampaignRequest.findByIdAndUpdate(
            collaborationId,
            {
                $set: {
                    'brief.trackingLink': trackingLink,
                    'brief.promoCode': promoCode,
                    'trackingDetails.enabled': true,
                    'trackingDetails.accepted': Boolean(collab.status === 'accepted' || collab.trackingAcceptedByInfluencer),
                    'trackingDetails.platform': shopifyConnected ? 'shopify' : 'porchest',
                    'trackingDetails.shopifyConnected': shopifyConnected,
                    'trackingDetails.shopifyStoreUrl': shopifyStoreUrl,
                    'trackingDetails.trackingDestination': trackingDestination,
                    campaignStartDate,
                    campaignEndDate,
                    status: collab.status === 'accepted' ? 'accepted' : collab.status,
                },
            },
            { strict: false, new: true }
        );

        if (!hasBaseline) {
            await takeFollowerBaseline(collaborationId);
        }

        return { success: true, trackingLink, promoCode, campaignStartDate, campaignEndDate };
    } catch (error) {
        console.error('[Tracking] ensureTrackingAssets failed:', error);
        return { success: false, error: error.message || 'Failed to generate tracking assets' };
    }
}

module.exports = {
    generateTrackingLink,
    generatePromoCode,
    resolveTrackingDestination,
    takeFollowerBaseline,
    pollFollowerGrowthForActiveCampaigns,
    releaseDueSecondPayouts,
    ensureTrackingAssets,
};
