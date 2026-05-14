const CampaignRequest = require('../models/CampaignRequest');
const PurchaseEvent = require('../models/PurchaseEvent');
const BrandTrackingConnection = require('../models/BrandTrackingConnection');
const BrandProfile = require('../models/BrandProfile');
const User = require('../models/User');
const { verifyAttributionToken } = require('./attributionTokenService');
const { sendCampaignEmailNotification } = require('./notificationDeliveryService');

const DEFAULT_SOURCE = 'pixel';

function toNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function normalizeString(value) {
    if (value == null) return '';
    return String(value).trim();
}

function escapeRegex(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function firstDefined(...values) {
    for (const value of values) {
        if (value !== undefined && value !== null && value !== '') return value;
    }
    return null;
}

function resolveCampaignWindow(collab) {
    const start = firstDefined(
        collab?.campaignStartDate,
        collab?.timeline?.campaignStartDate,
        collab?.campaignStartAt
    );
    const end = firstDefined(
        collab?.campaignEndDate,
        collab?.timeline?.campaignEndDate,
        collab?.campaignEndAt
    );

    return {
        start: start ? new Date(start) : null,
        end: end ? new Date(end) : null,
    };
}

function isWithinCampaignWindow(collab, now = new Date()) {
    const { start, end } = resolveCampaignWindow(collab);
    if (start && now < start) return false;
    if (end && now > end) return false;
    return Boolean(start || end || collab);
}

function resolveAgreementFee(collab) {
    const fee = firstDefined(
        collab?.agreedFee,
        collab?.pricing?.agreedFee,
        collab?.financials?.agreedFee,
        collab?.agreedPrice,
        collab?.pricing?.brandOffer,
        collab?.financials?.brandOfferedFee
    );
    const parsed = toNumber(fee);
    return parsed == null ? 0 : parsed;
}

async function readCampaignById(collaborationId) {
    if (!collaborationId) return null;
    const query = CampaignRequest.findById(collaborationId);
    if (!query?.select) return query;
    return query.select(
        'brandId influencerId campaignStartDate campaignEndDate campaignStartAt campaignEndAt timeline agreedFee pricing financials metrics status brief gracePeriodDays'
    ).lean();
}

async function readCampaignByPromoCode(promoCode) {
    if (!promoCode) return null;
    const query = CampaignRequest.findOne({
        'brief.promoCode': new RegExp(`^${escapeRegex(promoCode)}$`, 'i'),
    });
    if (!query?.select) return query;
    return query.select(
        'brandId influencerId campaignStartDate campaignEndDate campaignStartAt campaignEndAt timeline agreedFee pricing financials metrics status brief gracePeriodDays'
    ).lean();
}

async function loadBrandContact(brandId) {
    if (!brandId) return null;

    const brandProfile = await BrandProfile.findById(brandId).select('userId businessName brandName companyName').lean();
    if (!brandProfile?.userId) return { brandProfile, user: null };

    const user = await User.findById(brandProfile.userId).select('email fullName').lean();
    return { brandProfile, user };
}

async function sendSaleNotificationEmail({ collab, orderId, orderValue, currency, source, withinWindow }) {
    const { brandProfile, user } = await loadBrandContact(collab?.brandId);
    if (!user?.email) return;

    const campaignName = collab?.campaignTitle || collab?.brief?.keyMessage || 'Campaign';
    const brandName = brandProfile?.businessName || brandProfile?.brandName || brandProfile?.companyName || 'Porchest brand';
    const trackingMessage = withinWindow
        ? `A new ${source} sale was matched for "${campaignName}".`
        : `A new ${source} sale was recorded for "${campaignName}", but it fell outside the campaign window.`;

    await sendCampaignEmailNotification({
        email: user.email,
        subject: `New sale tracked for ${campaignName}`,
        title: 'Sale tracked',
        message: `${trackingMessage} Brand: ${brandName}. Order ID: ${orderId}. Order value: ${Number(orderValue).toFixed(2)} ${currency}.`,
        actionText: 'View tracking activity',
        actionHref: `/dashboard/brand/tracking?campaign=${collab?._id || ''}`,
    });
}

async function getTrackingConnection(brandId, platform = 'custom') {
    if (!brandId) return null;
    return BrandTrackingConnection.findOne({ brandId, platform });
}

async function upsertTrackingConnectionStatus({ brandId, platform, updates = {} }) {
    if (!brandId) return null;

    const cleanUpdates = {};
    for (const [key, value] of Object.entries(updates || {})) {
        if (value !== undefined) cleanUpdates[key] = value;
    }

    const query = { brandId, platform: platform || 'custom' };
    const update = {
        $set: {
            ...cleanUpdates,
        },
        $setOnInsert: {
            brandId,
            platform: platform || 'custom',
        },
    };

    return BrandTrackingConnection.findOneAndUpdate(query, update, {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
    });
}

async function processTrackedPurchase(payload = {}) {
    const now = new Date();
    const source = normalizeString(payload.source) || DEFAULT_SOURCE;
    const orderId = normalizeString(payload.orderId);
    const orderValue = toNumber(payload.orderValue);
    const currency = normalizeString(payload.currency) || 'USD';
    const promoCode = normalizeString(payload.promoCode);
    const attributionToken = normalizeString(payload.attributionToken);
    const directBrandId = normalizeString(payload.brandId);
    const directCollaborationId = normalizeString(payload.collaborationId);
    const directInfluencerId = normalizeString(payload.influencerId);

    if (!orderId) {
        return {
            success: false,
            matched: false,
            duplicate: false,
            withinWindow: false,
            collaborationId: null,
            purchaseEventId: null,
            message: 'orderId is required',
        };
    }

    if (orderValue == null || orderValue <= 0) {
        return {
            success: false,
            matched: false,
            duplicate: false,
            withinWindow: false,
            collaborationId: null,
            purchaseEventId: null,
            message: 'orderValue must be a positive number',
        };
    }

    let attribution = null;
    if (attributionToken) {
        attribution = verifyAttributionToken(attributionToken);
        if (!attribution) {
            return {
                success: false,
                matched: false,
                duplicate: false,
                withinWindow: false,
                collaborationId: null,
                purchaseEventId: null,
                message: 'Invalid attribution token',
            };
        }
    }

    const collaborationId = normalizeString(
        attribution?.collaborationId || directCollaborationId || null
    );
    const influencerId = normalizeString(
        attribution?.influencerId || directInfluencerId || null
    );
    const tokenBrandId = normalizeString(attribution?.brandId || null);
    const resolvedBrandId = normalizeString(directBrandId || tokenBrandId || null);
    const connectionPlatform = source === 'shopify'
        ? 'shopify'
        : source === 'woocommerce'
            ? 'woocommerce'
            : source === 'webhook'
                ? 'manual'
                : 'custom';
    const existingConnection = resolvedBrandId
        ? await BrandTrackingConnection.findOne({ brandId: resolvedBrandId, platform: connectionPlatform }).lean()
        : null;

    let collab = null;
    if (collaborationId) {
        collab = await readCampaignById(collaborationId);
    }
    if (!collab && promoCode) {
        collab = await readCampaignByPromoCode(promoCode);
    }

    if (!collab) {
        if (resolvedBrandId) {
            await upsertTrackingConnectionStatus({
                brandId: resolvedBrandId,
                platform: connectionPlatform,
                updates: {
                    status: 'issue_detected',
                    salesStatus: 'issue_detected',
                    lastEventReceivedAt: now,
                    lastError: 'Order received but no matching campaign was found.',
                },
            });
        }

        return {
            success: false,
            matched: false,
            duplicate: false,
            withinWindow: false,
            collaborationId: null,
            purchaseEventId: null,
            message: 'Order received but no matching campaign was found.',
        };
    }

    if (resolvedBrandId && String(collab.brandId) !== String(resolvedBrandId)) {
        await upsertTrackingConnectionStatus({
            brandId: resolvedBrandId,
            platform: source === 'webhook' ? 'manual' : 'custom',
            updates: {
                status: 'issue_detected',
                salesStatus: 'issue_detected',
                lastEventReceivedAt: now,
                lastError: 'Order brand mismatch.',
            },
        });

        return {
            success: false,
            matched: false,
            duplicate: false,
            withinWindow: false,
            collaborationId: String(collab._id),
            purchaseEventId: null,
            message: 'Matched collaboration does not belong to the supplied brand.',
        };
    }

    if (attribution?.brandId && String(collab.brandId) !== String(attribution.brandId)) {
        return {
            success: false,
            matched: false,
            duplicate: false,
            withinWindow: false,
            collaborationId: String(collab._id),
            purchaseEventId: null,
            message: 'Attribution token brand mismatch.',
        };
    }

    const existingEvent = await PurchaseEvent.findOne({
        orderId,
        source,
        collaborationId: collab._id,
    }).lean();

    if (existingEvent) {
        await upsertTrackingConnectionStatus({
            brandId: String(collab.brandId),
            platform: connectionPlatform,
            updates: {
                status: 'active',
                linksStatus: 'active',
                salesStatus: 'active',
                pixelStatus: source === 'pixel' ? 'active' : undefined,
                webhookStatus: source === 'webhook' ? 'active' : undefined,
                lastEventReceivedAt: now,
                lastVerifiedAt: now,
                lastError: null,
            },
        });

        return {
            success: true,
            matched: true,
            duplicate: true,
            withinWindow: existingEvent.withinWindow ?? isWithinCampaignWindow(collab, now),
            collaborationId: String(collab._id),
            purchaseEventId: String(existingEvent._id),
            message: 'Duplicate purchase ignored',
        };
    }

    const withinWindow = isWithinCampaignWindow(collab, now);

    let purchaseEvent;
    try {
        purchaseEvent = await PurchaseEvent.create({
            collaborationId: collab._id,
            influencerId: collab.influencerId || influencerId || attribution?.influencerId || null,
            brandId: collab.brandId,
            promoCode: promoCode || String(collab.brief?.promoCode || ''),
            orderId,
            orderValue,
            currency,
            source,
            timestamp: now,
            withinWindow,
            ...(payload.metadata ? { metadata: payload.metadata } : {}),
        });
    } catch (error) {
        if (error.code === 11000) {
            const duplicate = await PurchaseEvent.findOne({
                orderId,
                source,
                collaborationId: collab._id,
            }).lean();
            return {
                success: true,
                matched: true,
                duplicate: true,
                withinWindow: duplicate?.withinWindow ?? withinWindow,
                collaborationId: String(collab._id),
                purchaseEventId: duplicate ? String(duplicate._id) : null,
                message: 'Duplicate purchase ignored',
            };
        }

        throw error;
    }

    if (withinWindow) {
        const currentRevenue = Number(collab.metrics?.revenue || 0) + orderValue;
        const currentConversions = Number(collab.metrics?.conversions || 0) + 1;
        const agreedFee = resolveAgreementFee(collab);
        const roas = agreedFee > 0 ? Number((currentRevenue / agreedFee).toFixed(2)) : Number((collab.metrics?.roas || 0));
        const cpa = agreedFee > 0 && currentConversions > 0
            ? Number((agreedFee / currentConversions).toFixed(2))
            : Number(collab.metrics?.cpa || 0);

        await CampaignRequest.findByIdAndUpdate(
            collab._id,
            {
                $inc: {
                    'metrics.conversions': 1,
                    'metrics.revenue': orderValue,
                },
                $set: {
                    'metrics.roas': roas,
                    'metrics.cpa': cpa,
                    'metrics.lastUpdatedAt': now,
                },
            },
            { strict: false, new: true }
        );
    }

    await sendSaleNotificationEmail({
        collab,
        orderId,
        orderValue,
        currency,
        source,
        withinWindow,
    });

    await upsertTrackingConnectionStatus({
        brandId: String(collab.brandId),
        platform: connectionPlatform,
        updates: {
            status: 'active',
            linksStatus: 'active',
            salesStatus: 'active',
            pixelStatus: source === 'pixel' ? 'active' : undefined,
            webhookStatus: source === 'webhook' ? 'active' : undefined,
            lastEventReceivedAt: now,
            lastVerifiedAt: now,
            lastError: null,
        },
    });

    return {
        success: true,
        matched: true,
        duplicate: false,
        withinWindow,
        collaborationId: String(collab._id),
        purchaseEventId: String(purchaseEvent._id),
        message: withinWindow
            ? 'Purchase tracked successfully'
            : 'Purchase recorded but outside campaign window',
    };
}

module.exports = {
    processTrackedPurchase,
    resolveCampaignWindow,
    isWithinCampaignWindow,
    resolveAgreementFee,
    upsertTrackingConnectionStatus,
};
