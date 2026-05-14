const BrandTrackingConnection = require('../models/BrandTrackingConnection');
const ClickEvent = require('../models/ClickEvent');
const PurchaseEvent = require('../models/PurchaseEvent');

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function startOfWindow(days = 7) {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function normalizeError(lastError) {
    if (!lastError) return null;
    return typeof lastError === 'string' ? lastError : String(lastError);
}

async function getBrandTrackingHealth(brandId) {
    if (!brandId) {
        return {
            overallStatus: 'inactive',
            clicksLast7d: 0,
            purchasesLast7d: 0,
            unmatchedPurchasesLast7d: 0,
            latestEventAt: null,
        };
    }

    const since = startOfWindow(7);
    const [connection, clickCount, purchaseCount, unmatchedPurchaseCount, latestClick, latestPurchase] = await Promise.all([
        BrandTrackingConnection.findOne({ brandId }).lean(),
        ClickEvent.countDocuments({ brandId, timestamp: { $gte: since } }),
        PurchaseEvent.countDocuments({ brandId, timestamp: { $gte: since } }),
        PurchaseEvent.countDocuments({ brandId, timestamp: { $gte: since }, withinWindow: false }),
        ClickEvent.findOne({ brandId }).sort({ timestamp: -1 }).select('timestamp').lean(),
        PurchaseEvent.findOne({ brandId }).sort({ timestamp: -1 }).select('timestamp').lean(),
    ]);

    const latestEventAt = [connection?.lastEventReceivedAt, latestClick?.timestamp, latestPurchase?.timestamp]
        .filter(Boolean)
        .map((value) => new Date(value).getTime())
        .filter((value) => Number.isFinite(value))
        .sort((a, b) => b - a)[0] || null;

    const lastError = normalizeError(connection?.lastError);
    let overallStatus = 'inactive';

    if (lastError) {
        overallStatus = 'issue_detected';
    } else if (clickCount > 0 && purchaseCount > 0) {
        overallStatus = 'healthy';
    } else if (clickCount > 0 && purchaseCount === 0) {
        overallStatus = 'waiting';
    } else if (clickCount === 0 && purchaseCount === 0) {
        overallStatus = connection ? 'waiting' : 'inactive';
    } else {
        overallStatus = 'waiting';
    }

    if (unmatchedPurchaseCount > 0) {
        overallStatus = 'issue_detected';
    }

    return {
        overallStatus,
        clicksLast7d: clickCount,
        purchasesLast7d: purchaseCount,
        unmatchedPurchasesLast7d: unmatchedPurchaseCount,
        latestEventAt: latestEventAt ? new Date(latestEventAt) : null,
    };
}

module.exports = {
    SEVEN_DAYS_MS,
    getBrandTrackingHealth,
};
