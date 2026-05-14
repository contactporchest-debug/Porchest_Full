const express = require('express');
const crypto = require('crypto');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const BrandProfile = require('../models/BrandProfile');
const CampaignRequest = require('../models/CampaignRequest');
const PurchaseEvent = require('../models/PurchaseEvent');
const BrandTrackingConnection = require('../models/BrandTrackingConnection');
const ClickEvent = require('../models/ClickEvent');
const InfluencerProfile = require('../models/InfluencerProfile');
const { getBrandTrackingHealth } = require('../services/trackingHealthService');
const { normalizeApiBase, normalizeOrigin } = require('../utils/urlBases');

const router = express.Router();

router.use(authMiddleware, roleMiddleware('brand'));

function generateTrackingKey() {
    return `TRK-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
}

function generateWebhookSecret() {
    return crypto.randomBytes(24).toString('hex');
}

async function resolveBrandProfile(req) {
    if (req.user?.brandProfileId) {
        const profile = await BrandProfile.findById(req.user.brandProfileId).select('_id userId').lean();
        if (profile) return profile;
    }
    return BrandProfile.findOne({ userId: req.user._id }).select('_id userId').lean();
}

async function resolveTrackingConnection(brandId) {
    const connections = await BrandTrackingConnection.find({ brandId })
        .sort({ updatedAt: -1 })
        .lean();

    if (!connections.length) return null;

    const preferredOrder = ['woocommerce', 'shopify', 'gtm', 'custom', 'manual'];
    for (const platform of preferredOrder) {
        const match = connections.find((item) => item.platform === platform);
        if (match) return match;
    }

    return connections[0];
}

async function resolveShopifyConnection(brandId) {
    if (!brandId) return null;
    return BrandTrackingConnection.findOne({ brandId, platform: 'shopify' }).lean();
}

async function resolveWooCommerceConnection(brandId) {
    if (!brandId) return null;
    return BrandTrackingConnection.findOne({ brandId, platform: 'woocommerce' }).lean();
}

function setupInstructions() {
    const siteUrl = normalizeOrigin(process.env.PORCHEST_PUBLIC_SITE_URL || process.env.FRONTEND_URL || 'https://www.porchest.com');
    const apiBase = normalizeApiBase(process.env.PORCHEST_PUBLIC_API_URL || process.env.APP_URL || 'https://api.porchest.com');
    return {
        pixelScriptUrl: `${siteUrl}/pixel.js`,
        pixelPurchaseEndpoint: `${apiBase}/pixel/purchase`,
        webhookPurchaseEndpoint: `${apiBase}/webhook/purchase`,
    };
}

router.get('/api/tracking/status', async (req, res, next) => {
    try {
        const brandProfile = await resolveBrandProfile(req);
        if (!brandProfile) {
            return res.status(404).json({ success: false, error: 'Brand profile not found' });
        }

        const connection = await resolveTrackingConnection(brandProfile._id);
        const shopifyConnection = await resolveShopifyConnection(brandProfile._id);
        const wooCommerceConnection = await resolveWooCommerceConnection(brandProfile._id);
        const hasTrackingLinks = await CampaignRequest.exists({
            brandId: brandProfile._id,
            'brief.trackingLink': { $exists: true, $ne: '' },
        });
        const health = await getBrandTrackingHealth(brandProfile._id);
        const shopDomain = shopifyConnection?.metadata?.shopify?.shopDomain || shopifyConnection?.storeUrl || null;
        const connectedShopify = Boolean(shopifyConnection && shopifyConnection.status !== 'disconnected');
        const connectedWooCommerce = Boolean(wooCommerceConnection && wooCommerceConnection.status !== 'disconnected');

        const payload = {
            linksStatus: connection?.linksStatus || (hasTrackingLinks ? 'active' : 'not_ready'),
            salesStatus: connection?.salesStatus || (health.overallStatus === 'healthy' ? 'active' : health.overallStatus === 'issue_detected' ? 'issue_detected' : 'waiting_for_test'),
            platform: connection?.platform || 'custom',
            storeUrl: connection?.storeUrl || (connection?.platform === 'shopify' ? shopDomain : null) || (connection?.platform === 'woocommerce' ? wooCommerceConnection?.storeUrl || wooCommerceConnection?.metadata?.woocommerce?.storeUrl || null : null),
            shopDomain: connection?.platform === 'shopify' ? shopDomain : null,
            pixelStatus: connection?.pixelStatus || 'not_installed',
            webhookStatus: connection?.webhookStatus || 'not_configured',
            lastEventReceivedAt: connection?.lastEventReceivedAt || null,
            lastVerifiedAt: connection?.lastVerifiedAt || null,
            lastError: connection?.lastError || null,
            trackingKey: connection?.trackingKey || null,
            webhookSecret: connection?.webhookSecret || null,
            health,
            availableIntegrations: {
                shopify: {
                    enabled: true,
                    connected: connectedShopify,
                    shopDomain,
                },
                woocommerce: {
                    enabled: true,
                    connected: connectedWooCommerce,
                    storeUrl: wooCommerceConnection?.storeUrl || wooCommerceConnection?.metadata?.woocommerce?.storeUrl || null,
                },
                gtm: {
                    enabled: false,
                    comingSoon: true,
                },
            },
            setupInstructions: setupInstructions(),
        };

        return res.json({ success: true, ...payload });
    } catch (error) {
        next(error);
    }
});

router.post('/api/tracking/setup/start', async (req, res, next) => {
    try {
        const brandProfile = await resolveBrandProfile(req);
        if (!brandProfile) {
            return res.status(404).json({ success: false, error: 'Brand profile not found' });
        }

        const platform = ['custom', 'shopify', 'woocommerce', 'gtm', 'manual'].includes(req.body?.platform)
            ? req.body.platform
            : 'custom';
        const method = typeof req.body?.method === 'string' ? req.body.method.trim().toLowerCase() : 'manual';

        const existing = await BrandTrackingConnection.findOne({ brandId: brandProfile._id, platform });
        const trackingKey = existing?.trackingKey || generateTrackingKey();
        const webhookSecret = existing?.webhookSecret || generateWebhookSecret();

        const updates = {
            brandId: brandProfile._id,
            platform,
            trackingKey,
            webhookSecret,
            status: method === 'connected' ? 'connected' : 'waiting_for_test',
            salesStatus: 'waiting_for_test',
            linksStatus: 'active',
            pixelStatus: method === 'pixel' || platform === 'custom' ? 'installed' : (existing?.pixelStatus || 'not_installed'),
            webhookStatus: method === 'webhook' ? 'configured' : (existing?.webhookStatus || 'not_configured'),
            metadata: {
                ...(existing?.metadata || {}),
                startedAt: new Date(),
                method,
            },
        };

        const connection = await BrandTrackingConnection.findOneAndUpdate(
            { brandId: brandProfile._id, platform },
            { $set: updates, $setOnInsert: { brandId: brandProfile._id, platform } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        return res.json({
            success: true,
            message: 'Tracking setup initialized',
            trackingKey: connection.trackingKey,
            webhookSecret: connection.webhookSecret,
            platform: connection.platform,
            status: connection.status,
            linksStatus: connection.linksStatus,
            salesStatus: connection.salesStatus,
            pixelStatus: connection.pixelStatus,
            webhookStatus: connection.webhookStatus,
            setupInstructions: setupInstructions(),
        });
    } catch (error) {
        next(error);
    }
});

router.get('/api/tracking/test-campaign', async (req, res, next) => {
    try {
        const brandProfile = await resolveBrandProfile(req);
        if (!brandProfile) {
            return res.status(404).json({ success: false, error: 'Brand profile not found' });
        }

        const latestCampaign = await CampaignRequest.findOne({
            brandId: brandProfile._id,
            'brief.trackingLink': { $exists: true, $ne: '' },
            status: { $nin: ['rejected', 'declined', 'cancelled', 'expired'] },
        })
            .sort({ updatedAt: -1, createdAt: -1 })
            .select('_id brief campaignTitle influencerId influencerName influencerUsername brandId')
            .lean();

        if (!latestCampaign) {
            return res.json({
                success: true,
                collaborationId: null,
                trackingLink: null,
                influencerName: null,
                promoCode: null,
            });
        }

        const influencer = latestCampaign.influencerId
            ? await InfluencerProfile.findById(latestCampaign.influencerId).select('fullName username igUsername displayName').lean()
            : null;

        return res.json({
            success: true,
            collaborationId: String(latestCampaign._id),
            trackingLink: latestCampaign.brief?.trackingLink || null,
            influencerName: influencer?.fullName || latestCampaign.influencerName || latestCampaign.influencerUsername || influencer?.igUsername || influencer?.username || 'Influencer',
            promoCode: latestCampaign.brief?.promoCode || null,
        });
    } catch (error) {
        next(error);
    }
});

router.post('/api/tracking/test-status', async (req, res, next) => {
    try {
        const brandProfile = await resolveBrandProfile(req);
        if (!brandProfile) {
            return res.status(404).json({ success: false, error: 'Brand profile not found' });
        }

        const existingConnection = await resolveTrackingConnection(brandProfile._id);
        const recentEvent = await PurchaseEvent.findOne({
            brandId: brandProfile._id,
            timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        }).sort({ timestamp: -1 }).lean();
        const recentCampaign = recentEvent?.collaborationId
            ? await CampaignRequest.findById(recentEvent.collaborationId).select('_id brief campaignTitle influencerId influencerName influencerUsername').lean()
            : null;
        const recentInfluencer = recentCampaign?.influencerId
            ? await InfluencerProfile.findById(recentCampaign.influencerId).select('fullName username igUsername displayName').lean()
            : null;

        const matchedEvent = recentEvent && recentEvent.withinWindow !== false;
        const hasConnectionIssue = Boolean(existingConnection?.lastError) || existingConnection?.salesStatus === 'issue_detected' || existingConnection?.status === 'issue_detected';
        const salesStatus = recentEvent
            ? (matchedEvent ? 'active' : 'issue_detected')
            : (hasConnectionIssue ? 'issue_detected' : 'waiting_for_test');
        const status = salesStatus === 'active' ? 'active' : (salesStatus === 'issue_detected' ? 'issue_detected' : 'waiting_for_test');
        const now = new Date();
        const platform = existingConnection?.platform || 'custom';
        const update = {
            salesStatus,
            status,
            lastEventReceivedAt: recentEvent ? recentEvent.timestamp || now : null,
            lastError: recentEvent
                ? (matchedEvent ? null : 'Order received but campaign was not matched.')
                : 'Waiting for a successful test purchase.',
        };

        if (recentEvent && matchedEvent) {
            update.lastVerifiedAt = now;
        }

        const connection = await BrandTrackingConnection.findOneAndUpdate(
            { brandId: brandProfile._id, platform },
            {
                $set: update,
                $setOnInsert: { brandId: brandProfile._id, platform },
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        return res.json({
            success: true,
            salesStatus: connection.salesStatus,
            status: connection.status,
            latestPurchase: recentEvent || null,
            latestMatchedCampaign: recentCampaign ? {
                collaborationId: String(recentCampaign._id),
                campaignName: recentCampaign.campaignTitle || recentCampaign.brief?.campaignObjective || 'Campaign',
                promoCode: recentCampaign.brief?.promoCode || null,
            } : null,
            latestInfluencer: recentInfluencer ? {
                name: recentInfluencer.fullName || recentInfluencer.displayName || recentInfluencer.igUsername || recentInfluencer.username || 'Influencer',
                username: recentInfluencer.igUsername || recentInfluencer.username || null,
            } : null,
            latestTimestamp: recentEvent?.timestamp || null,
            message: recentEvent
                ? (matchedEvent ? 'Tracking Active' : 'Tracking Issue Detected')
                : (hasConnectionIssue ? 'Tracking Issue Detected' : 'Waiting For Test Order'),
            lastEventReceivedAt: connection.lastEventReceivedAt || null,
            lastVerifiedAt: connection.lastVerifiedAt || null,
            lastError: connection.lastError || null,
        });
    } catch (error) {
        next(error);
    }
});

router.get('/api/tracking/activity', async (req, res, next) => {
    try {
        const brandProfile = await resolveBrandProfile(req);
        if (!brandProfile) {
            return res.status(404).json({ success: false, error: 'Brand profile not found' });
        }

        const [clicks, purchases, issues] = await Promise.all([
            ClickEvent.find({ brandId: brandProfile._id }).sort({ timestamp: -1 }).limit(20).lean(),
            PurchaseEvent.find({ brandId: brandProfile._id }).sort({ timestamp: -1 }).limit(20).lean(),
            PurchaseEvent.find({ brandId: brandProfile._id, withinWindow: false }).sort({ timestamp: -1 }).limit(20).lean(),
        ]);

        const collabIds = [...new Set([
            ...clicks.map((item) => String(item.collaborationId || '')),
            ...purchases.map((item) => String(item.collaborationId || '')),
            ...issues.map((item) => String(item.collaborationId || '')),
        ].filter(Boolean))];

        const influencerIds = [...new Set([
            ...clicks.map((item) => String(item.influencerId || '')),
            ...purchases.map((item) => String(item.influencerId || '')),
            ...issues.map((item) => String(item.influencerId || '')),
        ].filter(Boolean))];

        const [campaignDocs, influencerDocs] = await Promise.all([
            collabIds.length ? CampaignRequest.find({ _id: { $in: collabIds } }).select('_id brief campaignTitle influencerId influencerName influencerUsername requestCode').lean() : Promise.resolve([]),
            influencerIds.length ? InfluencerProfile.find({ _id: { $in: influencerIds } }).select('_id fullName username igUsername displayName').lean() : Promise.resolve([]),
        ]);

        const campaignMap = new Map(campaignDocs.map((doc) => [String(doc._id), doc]));
        const influencerMap = new Map(influencerDocs.map((doc) => [String(doc._id), doc]));

        const resolveCampaignName = (campaign) => campaign?.campaignTitle || campaign?.brief?.campaignObjective || campaign?.requestCode || 'Campaign';
        const resolveInfluencerName = (influencerId, campaign) => {
            const influencer = influencerMap.get(String(influencerId || ''));
            return influencer?.fullName || influencer?.displayName || influencer?.igUsername || influencer?.username || campaign?.influencerName || campaign?.influencerUsername || 'Influencer';
        };

        const clickItems = clicks.map((item) => {
            const campaign = campaignMap.get(String(item.collaborationId || ''));
            return {
                timestamp: item.timestamp,
                influencerName: resolveInfluencerName(item.influencerId, campaign),
                campaignName: resolveCampaignName(campaign),
                campaignCode: campaign?.brief?.promoCode || campaign?.requestCode || null,
                referrer: item.referrer || '',
                isUnique: Boolean(item.isUnique),
            };
        });

        const purchaseItems = purchases.map((item) => {
            const campaign = campaignMap.get(String(item.collaborationId || ''));
            return {
                timestamp: item.timestamp,
                orderId: item.orderId,
                orderValue: item.orderValue,
                currency: item.currency || 'USD',
                source: item.source || 'pixel',
                collaborationId: String(item.collaborationId || ''),
                influencerName: resolveInfluencerName(item.influencerId, campaign),
                withinWindow: Boolean(item.withinWindow),
                campaignName: resolveCampaignName(campaign),
            };
        });

        const issueItems = issues.map((item) => {
            const campaign = campaignMap.get(String(item.collaborationId || ''));
            return {
                timestamp: item.timestamp,
                orderId: item.orderId,
                reason: item.withinWindow === false ? 'Purchase recorded outside campaign window' : 'Tracking issue detected',
                source: item.source || 'pixel',
                collaborationId: String(item.collaborationId || ''),
                campaignName: resolveCampaignName(campaign),
            };
        });

        const connection = await resolveTrackingConnection(brandProfile._id);
        const health = await getBrandTrackingHealth(brandProfile._id);

        return res.json({
            success: true,
            clicks: clickItems,
            purchases: purchaseItems,
            issues: [
                ...(connection?.lastError ? [{
                    timestamp: connection.lastEventReceivedAt || connection.updatedAt || new Date(),
                    orderId: null,
                    reason: connection.lastError,
                    source: connection.platform || 'custom',
                    collaborationId: null,
                }] : []),
                ...issueItems,
            ].slice(0, 20),
            health,
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
