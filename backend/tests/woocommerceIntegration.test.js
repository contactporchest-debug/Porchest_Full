const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');

process.env.WOOCOMMERCE_WEBHOOK_SECRET = 'woo-webhook-secret';
process.env.WOOCOMMERCE_APP_NAME = 'Porchest';
process.env.PORCHEST_PUBLIC_API_URL = 'https://api.porchest.test';
process.env.APP_URL = 'https://api.porchest.test';

const {
    validateWooCommerceCredentials,
    createWooCommerceWebhook,
    verifyWooCommerceWebhook,
    normalizeWooCommerceOrder,
    extractWooCommerceCouponCodes,
} = require('../services/woocommerceIntegrationService');

function createResponse() {
    const state = {
        statusCode: 200,
        payload: null,
    };

    return {
        state,
        status(code) {
            state.statusCode = code;
            return this;
        },
        json(payload) {
            state.payload = payload;
            return this;
        },
    };
}

function getRouteHandler(router, path) {
    const layer = router.stack.find((entry) => entry.route && entry.route.path === path && entry.route.methods.post);
    if (!layer) {
        throw new Error(`Route not found: ${path}`);
    }

    return layer.route.stack[layer.route.stack.length - 1].handle;
}

test('validateWooCommerceCredentials normalizes the store response', async (t) => {
    const originalFetch = global.fetch;

    global.fetch = async (url) => {
        assert.match(String(url), /\/wp-json\/wc\/v3\/system_status$/);
        return {
            ok: true,
            text: async () => JSON.stringify({
                settings: { store_name: { value: 'Demo Store' } },
                environment: { woocommerce_version: '8.5.1' },
            }),
        };
    };

    t.after(() => {
        global.fetch = originalFetch;
    });

    const result = await validateWooCommerceCredentials({
        storeUrl: 'demo-store.myshopify.com',
        consumerKey: 'ck_test',
        consumerSecret: 'cs_test',
    });

    assert.equal(result.valid, true);
    assert.equal(result.storeName, 'Demo Store');
    assert.equal(result.storeUrl, 'https://demo-store.myshopify.com');
    assert.equal(result.wooVersion, '8.5.1');
});

test('extractWooCommerceCouponCodes normalizes and deduplicates coupon values', () => {
    assert.deepEqual(
        extractWooCommerceCouponCodes({
            coupon_lines: [{ code: 'save10' }, { code: ' SAVE10 ' }],
            couponCodes: ['promo-1'],
            coupons: ['Promo-1', '  '],
        }),
        ['SAVE10', 'PROMO-1']
    );
});

test('verifyWooCommerceWebhook accepts valid HMAC signatures', () => {
    const rawBody = Buffer.from(JSON.stringify({ id: 123, total: '20.00' }));
    const signature = crypto
        .createHmac('sha256', process.env.WOOCOMMERCE_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('base64');

    assert.equal(verifyWooCommerceWebhook({
        payload: rawBody,
        signature,
        webhookSecret: process.env.WOOCOMMERCE_WEBHOOK_SECRET,
    }), true);

    assert.equal(verifyWooCommerceWebhook({
        payload: rawBody,
        signature: 'invalid',
        webhookSecret: process.env.WOOCOMMERCE_WEBHOOK_SECRET,
    }), false);
});

test('normalizeWooCommerceOrder returns the canonical purchase payload', () => {
    const normalized = normalizeWooCommerceOrder({
        storeUrl: 'https://example-store.com',
        order: {
            id: 987,
            total: '149.99',
            currency: 'usd',
            billing: { email: 'Customer@Example.com' },
            coupon_lines: [{ code: 'spring-sale' }],
            date_paid_gmt: '2026-05-14T12:00:00.000Z',
        },
    });

    assert.equal(normalized.platform, 'woocommerce');
    assert.equal(normalized.storeUrl, 'https://example-store.com');
    assert.equal(normalized.orderId, '987');
    assert.equal(normalized.orderValue, 149.99);
    assert.equal(normalized.currency, 'usd');
    assert.equal(normalized.promoCode, 'SPRING-SALE');
    assert.equal(normalized.discountCodes[0], 'SPRING-SALE');
    assert.equal(normalized.customerEmailHash.length, 64);
    assert.equal(normalized.processedAt, '2026-05-14T12:00:00.000Z');
});

test('woocommerce webhook route calls the shared purchase processor', async (t) => {
    const servicePath = require.resolve('../services/purchaseTrackingService');
    const modelPath = require.resolve('../models/BrandTrackingConnection');
    const routePath = require.resolve('../routes/woocommerceIntegrationRoutes');

    const originalService = require(servicePath);
    const originalModel = require(modelPath);
    const originalRoute = require.cache[routePath];

    const processCalls = [];
    const statusCalls = [];

    require.cache[servicePath].exports = {
        ...originalService,
        processTrackedPurchase: async (payload) => {
            processCalls.push(payload);
            return {
                success: true,
                matched: true,
                duplicate: false,
                withinWindow: true,
                collaborationId: 'collab-123',
                purchaseEventId: 'purchase-123',
                message: 'ok',
            };
        },
        upsertTrackingConnectionStatus: async (payload) => {
            statusCalls.push(payload);
            return payload;
        },
    };

    require.cache[modelPath].exports = {
        ...originalModel,
        findOne: () => ({
            lean: async () => ({
                brandId: 'brand-123',
                platform: 'woocommerce',
                storeUrl: 'https://store.example.com',
                webhookSecret: process.env.WOOCOMMERCE_WEBHOOK_SECRET,
                metadata: {
                    woocommerce: {
                        storeUrl: 'https://store.example.com',
                        webhookSecret: process.env.WOOCOMMERCE_WEBHOOK_SECRET,
                    },
                },
            }),
        }),
    };

    delete require.cache[routePath];
    const router = require(routePath);
    const handler = getRouteHandler(router, '/webhooks/orders');

    t.after(() => {
        require.cache[servicePath].exports = originalService;
        require.cache[modelPath].exports = originalModel;
        delete require.cache[routePath];
        if (originalRoute) {
            require.cache[routePath] = originalRoute;
        }
    });

    const rawOrder = {
        id: 456,
        total: '200.00',
        currency: 'USD',
        coupon_lines: [{ code: 'PROMO-WOO' }],
        storeUrl: 'https://store.example.com',
    };
    const rawBody = Buffer.from(JSON.stringify(rawOrder));
    const signature = crypto.createHmac('sha256', process.env.WOOCOMMERCE_WEBHOOK_SECRET).update(rawBody).digest('base64');
    const req = {
        rawBody,
        body: rawOrder,
        headers: {
            'x-wc-webhook-signature': signature,
            'x-wc-webhook-source': 'https://store.example.com',
        },
    };
    const res = createResponse();

    await handler(req, res);

    assert.equal(res.state.statusCode, 200);
    assert.equal(processCalls.length, 1);
    assert.equal(processCalls[0].source, 'woocommerce');
    assert.equal(processCalls[0].promoCode, 'PROMO-WOO');
    assert.equal(statusCalls.length, 1);
    assert.equal(statusCalls[0].updates.status, 'active');
    assert.equal(statusCalls[0].updates.salesStatus, 'active');
});

test('woocommerce webhook route marks unmatched orders as issue_detected', async (t) => {
    const servicePath = require.resolve('../services/purchaseTrackingService');
    const modelPath = require.resolve('../models/BrandTrackingConnection');
    const routePath = require.resolve('../routes/woocommerceIntegrationRoutes');

    const originalService = require(servicePath);
    const originalModel = require(modelPath);
    const originalRoute = require.cache[routePath];

    const processCalls = [];
    const statusCalls = [];

    require.cache[servicePath].exports = {
        ...originalService,
        processTrackedPurchase: async (payload) => {
            processCalls.push(payload);
            return {
                success: false,
                matched: false,
                duplicate: false,
                withinWindow: false,
                collaborationId: null,
                purchaseEventId: null,
                message: 'no match',
            };
        },
        upsertTrackingConnectionStatus: async (payload) => {
            statusCalls.push(payload);
            return payload;
        },
    };

    require.cache[modelPath].exports = {
        ...originalModel,
        findOne: () => ({
            lean: async () => ({
                brandId: 'brand-999',
                platform: 'woocommerce',
                storeUrl: 'https://store.example.com',
                webhookSecret: process.env.WOOCOMMERCE_WEBHOOK_SECRET,
                metadata: {
                    woocommerce: {
                        storeUrl: 'https://store.example.com',
                        webhookSecret: process.env.WOOCOMMERCE_WEBHOOK_SECRET,
                    },
                },
            }),
        }),
    };

    delete require.cache[routePath];
    const router = require(routePath);
    const handler = getRouteHandler(router, '/webhooks/orders');

    t.after(() => {
        require.cache[servicePath].exports = originalService;
        require.cache[modelPath].exports = originalModel;
        delete require.cache[routePath];
        if (originalRoute) {
            require.cache[routePath] = originalRoute;
        }
    });

    const rawOrder = {
        id: 789,
        total: '75.00',
        currency: 'USD',
        coupon_lines: [],
        storeUrl: 'https://store.example.com',
    };
    const rawBody = Buffer.from(JSON.stringify(rawOrder));
    const signature = crypto.createHmac('sha256', process.env.WOOCOMMERCE_WEBHOOK_SECRET).update(rawBody).digest('base64');
    const req = {
        rawBody,
        body: rawOrder,
        headers: {
            'x-wc-webhook-signature': signature,
            'x-wc-webhook-source': 'https://store.example.com',
        },
    };
    const res = createResponse();

    await handler(req, res);

    assert.equal(res.state.statusCode, 200);
    assert.equal(processCalls.length, 1);
    assert.equal(statusCalls.length, 1);
    assert.equal(statusCalls[0].updates.status, 'issue_detected');
    assert.equal(statusCalls[0].updates.salesStatus, 'issue_detected');
});
