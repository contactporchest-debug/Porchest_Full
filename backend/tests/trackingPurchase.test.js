const test = require('node:test');
const assert = require('node:assert/strict');

const CampaignRequest = require('../models/CampaignRequest');
const PurchaseEvent = require('../models/PurchaseEvent');
const BrandTrackingConnection = require('../models/BrandTrackingConnection');
const {
    processTrackedPurchase,
    isWithinCampaignWindow,
    resolveAgreementFee,
} = require('../services/purchaseTrackingService');
const { signAttributionToken, verifyAttributionToken } = require('../services/attributionTokenService');

function makeQuery(value) {
    return {
        select() {
            return this;
        },
        lean: async () => value,
    };
}

test('attribution token signs and verifies payloads', () => {
    process.env.PORCHEST_ATTRIBUTION_SECRET = 'test-secret';
    const token = signAttributionToken({
        brandId: 'brand-1',
        collaborationId: 'collab-1',
        influencerId: 'inf-1',
        clickId: 'click-1',
    });

    const decoded = verifyAttributionToken(token);
    assert.equal(decoded.brandId, 'brand-1');
    assert.equal(decoded.collaborationId, 'collab-1');
    assert.equal(decoded.influencerId, 'inf-1');
    assert.equal(decoded.clickId, 'click-1');
});

test('campaign window and fee helpers use available fallback fields', () => {
    assert.equal(
        isWithinCampaignWindow({
            campaignStartAt: new Date(Date.now() - 1000),
            campaignEndAt: new Date(Date.now() + 1000),
        }),
        true
    );
    assert.equal(
        resolveAgreementFee({
            pricing: { agreedFee: 200 },
            financials: { agreedFee: 150 },
            agreedPrice: 100,
        }),
        200
    );
});

test('processTrackedPurchase matches attribution token and updates metrics', async (t) => {
    process.env.PORCHEST_ATTRIBUTION_SECRET = 'test-secret';

    const collab = {
        _id: 'collab-1',
        brandId: 'brand-1',
        influencerId: 'inf-1',
        brief: { promoCode: 'PROMO-1' },
        campaignStartDate: new Date(Date.now() - 1000),
        campaignEndDate: new Date(Date.now() + 1000),
        agreedFee: 200,
        metrics: { revenue: 100, conversions: 1 },
    };
    const updates = [];
    const connectionUpdates = [];

    const original = {
        findById: CampaignRequest.findById,
        findOne: CampaignRequest.findOne,
        findByIdAndUpdate: CampaignRequest.findByIdAndUpdate,
        purchaseFindOne: PurchaseEvent.findOne,
        purchaseCreate: PurchaseEvent.create,
        connectionFindOne: BrandTrackingConnection.findOne,
        connectionFindOneAndUpdate: BrandTrackingConnection.findOneAndUpdate,
    };

    t.after(() => {
        CampaignRequest.findById = original.findById;
        CampaignRequest.findOne = original.findOne;
        CampaignRequest.findByIdAndUpdate = original.findByIdAndUpdate;
        PurchaseEvent.findOne = original.purchaseFindOne;
        PurchaseEvent.create = original.purchaseCreate;
        BrandTrackingConnection.findOne = original.connectionFindOne;
        BrandTrackingConnection.findOneAndUpdate = original.connectionFindOneAndUpdate;
    });

    CampaignRequest.findById = () => makeQuery(collab);
    CampaignRequest.findOne = () => makeQuery(collab);
    CampaignRequest.findByIdAndUpdate = async (id, update) => {
        updates.push({ id, update });
        return { _id: id };
    };
    PurchaseEvent.findOne = () => ({ lean: async () => null });
    PurchaseEvent.create = async (doc) => ({ _id: 'purchase-1', ...doc });
    BrandTrackingConnection.findOne = () => ({ lean: async () => null });
    BrandTrackingConnection.findOneAndUpdate = async (query, update) => {
        connectionUpdates.push({ query, update });
        return { brandId: 'brand-1', platform: 'custom', salesStatus: 'active' };
    };

    const token = signAttributionToken({
        brandId: 'brand-1',
        collaborationId: 'collab-1',
        influencerId: 'inf-1',
        clickId: 'click-1',
    });

    const result = await processTrackedPurchase({
        attributionToken: token,
        orderId: 'ORDER-123',
        orderValue: 250,
        currency: 'USD',
        source: 'pixel',
        metadata: { foo: 'bar' },
    });

    assert.equal(result.success, true);
    assert.equal(result.matched, true);
    assert.equal(result.duplicate, false);
    assert.equal(result.withinWindow, true);
    assert.equal(result.collaborationId, 'collab-1');
    assert.equal(result.purchaseEventId, 'purchase-1');
    assert.equal(updates.length, 1);
    assert.equal(connectionUpdates.length > 0, true);
});

test('duplicate order is ignored for the same collaboration and source', async (t) => {
    process.env.PORCHEST_ATTRIBUTION_SECRET = 'test-secret';

    const collab = {
        _id: 'collab-2',
        brandId: 'brand-2',
        influencerId: 'inf-2',
        brief: { promoCode: 'PROMO-2' },
        campaignStartDate: new Date(Date.now() - 1000),
        campaignEndDate: new Date(Date.now() + 1000),
        agreedFee: 300,
        metrics: { revenue: 0, conversions: 0 },
    };

    const original = {
        findById: CampaignRequest.findById,
        findOne: CampaignRequest.findOne,
        findByIdAndUpdate: CampaignRequest.findByIdAndUpdate,
        purchaseFindOne: PurchaseEvent.findOne,
        purchaseCreate: PurchaseEvent.create,
        connectionFindOne: BrandTrackingConnection.findOne,
        connectionFindOneAndUpdate: BrandTrackingConnection.findOneAndUpdate,
    };

    t.after(() => {
        CampaignRequest.findById = original.findById;
        CampaignRequest.findOne = original.findOne;
        CampaignRequest.findByIdAndUpdate = original.findByIdAndUpdate;
        PurchaseEvent.findOne = original.purchaseFindOne;
        PurchaseEvent.create = original.purchaseCreate;
        BrandTrackingConnection.findOne = original.connectionFindOne;
        BrandTrackingConnection.findOneAndUpdate = original.connectionFindOneAndUpdate;
    });

    CampaignRequest.findById = () => makeQuery(collab);
    CampaignRequest.findOne = () => makeQuery(collab);
    CampaignRequest.findByIdAndUpdate = async () => ({});
    PurchaseEvent.findOne = () => ({ lean: async () => ({ _id: 'existing-1', withinWindow: true }) });
    PurchaseEvent.create = async () => { throw new Error('should not create duplicate'); };
    BrandTrackingConnection.findOne = () => ({ lean: async () => null });
    BrandTrackingConnection.findOneAndUpdate = async () => ({});

    const token = signAttributionToken({
        brandId: 'brand-2',
        collaborationId: 'collab-2',
        influencerId: 'inf-2',
    });

    const result = await processTrackedPurchase({
        attributionToken: token,
        orderId: 'ORDER-123',
        orderValue: 250,
        currency: 'USD',
        source: 'pixel',
    });

    assert.equal(result.success, true);
    assert.equal(result.duplicate, true);
    assert.equal(result.purchaseEventId, 'existing-1');
});

test('promo code matching works when no attribution token is present', async (t) => {
    const collab = {
        _id: 'collab-3',
        brandId: 'brand-3',
        influencerId: 'inf-3',
        brief: { promoCode: 'PROMO-3' },
        campaignStartDate: new Date(Date.now() - 1000),
        campaignEndDate: new Date(Date.now() + 1000),
        pricing: { agreedFee: 100 },
        metrics: { revenue: 0, conversions: 0 },
    };

    const original = {
        findById: CampaignRequest.findById,
        findOne: CampaignRequest.findOne,
        findByIdAndUpdate: CampaignRequest.findByIdAndUpdate,
        purchaseFindOne: PurchaseEvent.findOne,
        purchaseCreate: PurchaseEvent.create,
        connectionFindOne: BrandTrackingConnection.findOne,
        connectionFindOneAndUpdate: BrandTrackingConnection.findOneAndUpdate,
    };

    t.after(() => {
        CampaignRequest.findById = original.findById;
        CampaignRequest.findOne = original.findOne;
        CampaignRequest.findByIdAndUpdate = original.findByIdAndUpdate;
        PurchaseEvent.findOne = original.purchaseFindOne;
        PurchaseEvent.create = original.purchaseCreate;
        BrandTrackingConnection.findOne = original.connectionFindOne;
        BrandTrackingConnection.findOneAndUpdate = original.connectionFindOneAndUpdate;
    });

    CampaignRequest.findById = () => makeQuery(null);
    CampaignRequest.findOne = () => makeQuery(collab);
    CampaignRequest.findByIdAndUpdate = async () => ({});
    PurchaseEvent.findOne = () => ({ lean: async () => null });
    PurchaseEvent.create = async (doc) => ({ _id: 'purchase-3', ...doc });
    BrandTrackingConnection.findOne = () => ({ lean: async () => null });
    BrandTrackingConnection.findOneAndUpdate = async () => ({});

    const result = await processTrackedPurchase({
        promoCode: 'PROMO-3',
        orderId: 'ORDER-555',
        orderValue: 50,
        currency: 'USD',
        source: 'webhook',
    });

    assert.equal(result.success, true);
    assert.equal(result.matched, true);
    assert.equal(result.collaborationId, 'collab-3');
    assert.equal(result.withinWindow, true);
});

test('out of window purchases do not update collaboration metrics', async (t) => {
    const collab = {
        _id: 'collab-4',
        brandId: 'brand-4',
        influencerId: 'inf-4',
        brief: { promoCode: 'PROMO-4' },
        campaignStartDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        campaignEndDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        agreedFee: 100,
        metrics: { revenue: 10, conversions: 1 },
    };

    const original = {
        findById: CampaignRequest.findById,
        findOne: CampaignRequest.findOne,
        findByIdAndUpdate: CampaignRequest.findByIdAndUpdate,
        purchaseFindOne: PurchaseEvent.findOne,
        purchaseCreate: PurchaseEvent.create,
        connectionFindOne: BrandTrackingConnection.findOne,
        connectionFindOneAndUpdate: BrandTrackingConnection.findOneAndUpdate,
    };

    t.after(() => {
        CampaignRequest.findById = original.findById;
        CampaignRequest.findOne = original.findOne;
        CampaignRequest.findByIdAndUpdate = original.findByIdAndUpdate;
        PurchaseEvent.findOne = original.purchaseFindOne;
        PurchaseEvent.create = original.purchaseCreate;
        BrandTrackingConnection.findOne = original.connectionFindOne;
        BrandTrackingConnection.findOneAndUpdate = original.connectionFindOneAndUpdate;
    });

    CampaignRequest.findById = () => makeQuery(collab);
    CampaignRequest.findOne = () => makeQuery(collab);
    let updated = false;
    CampaignRequest.findByIdAndUpdate = async () => {
        updated = true;
        return {};
    };
    PurchaseEvent.findOne = () => ({ lean: async () => null });
    PurchaseEvent.create = async (doc) => ({ _id: 'purchase-4', ...doc });
    BrandTrackingConnection.findOne = () => ({ lean: async () => null });
    BrandTrackingConnection.findOneAndUpdate = async () => ({});

    const result = await processTrackedPurchase({
        promoCode: 'PROMO-4',
        orderId: 'ORDER-999',
        orderValue: 70,
        currency: 'USD',
        source: 'webhook',
    });

    assert.equal(result.success, true);
    assert.equal(result.withinWindow, false);
    assert.equal(updated, false);
});
