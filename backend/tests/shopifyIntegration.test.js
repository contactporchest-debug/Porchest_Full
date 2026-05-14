const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');

process.env.SHOPIFY_API_KEY = 'shopify-api-key';
process.env.SHOPIFY_API_SECRET = 'shopify-api-secret';
process.env.SHOPIFY_SCOPES = 'read_orders,read_customers';
process.env.SHOPIFY_APP_URL = 'https://api.porchest.test';
process.env.SHOPIFY_REDIRECT_URI = 'https://api.porchest.test/api/integrations/shopify/callback';
process.env.JWT_SECRET = 'shopify-jwt-secret';

const {
    buildShopifyInstallUrl,
    verifyShopifyOAuthCallback,
    verifyShopifyWebhookHmac,
    normalizeShopifyOrderPayload,
    extractDiscountCodes,
    signShopifyStateToken,
    verifyShopifyStateToken,
    registerShopifyOrderWebhook,
} = require('../services/shopifyIntegrationService');

test('buildShopifyInstallUrl constructs a valid oauth url', () => {
    const state = signShopifyStateToken({ brandId: 'brand-123' });
    const url = new URL(buildShopifyInstallUrl({ shop: 'demo-store.myshopify.com', state }));

    assert.equal(url.host, 'demo-store.myshopify.com');
    assert.equal(url.pathname, '/admin/oauth/authorize');
    assert.equal(url.searchParams.get('client_id'), 'shopify-api-key');
    assert.equal(url.searchParams.get('redirect_uri'), 'https://api.porchest.test/api/integrations/shopify/callback');
    assert.equal(url.searchParams.get('scope'), 'read_orders,read_customers');
    assert.equal(url.searchParams.get('state'), state);

    const decoded = verifyShopifyStateToken(state);
    assert.equal(decoded.brandId, 'brand-123');
});

test('verifyShopifyOAuthCallback validates the HMAC payload', () => {
    const rawQuery = 'code=abc123&shop=demo-store.myshopify.com&state=state-token&timestamp=1710000000';
    const hmac = crypto.createHmac('sha256', process.env.SHOPIFY_API_SECRET)
        .update(rawQuery.split('&').sort().join('&'))
        .digest('hex');

    const result = verifyShopifyOAuthCallback({
        code: 'abc123',
        shop: 'demo-store.myshopify.com',
        state: 'state-token',
        timestamp: '1710000000',
        hmac,
        __rawQuery: rawQuery,
    });

    assert.equal(result.shop, 'demo-store.myshopify.com');
    assert.equal(result.code, 'abc123');
    assert.equal(result.state, 'state-token');
});

test('verifyShopifyWebhookHmac accepts valid raw bodies', () => {
    const rawBody = Buffer.from(JSON.stringify({ id: 1, name: '#1001' }));
    const hmac = crypto.createHmac('sha256', process.env.SHOPIFY_API_SECRET).update(rawBody).digest('base64');

    assert.equal(verifyShopifyWebhookHmac({ rawBody, hmacHeader: hmac }), true);
    assert.equal(verifyShopifyWebhookHmac({ rawBody, hmacHeader: 'invalid' }), false);
});

test('extractDiscountCodes and normalizeShopifyOrderPayload preserve order data', () => {
    const order = {
        id: 999,
        email: 'customer@example.com',
        total_price: '250.00',
        currency: 'USD',
        processed_at: '2026-05-01T10:00:00.000Z',
        discount_codes: [{ code: 'PROMO-1' }],
        discount_applications: [{ title: 'SPRINGSALE' }],
    };

    assert.deepEqual(extractDiscountCodes(order), ['PROMO-1', 'SPRINGSALE']);

    const normalized = normalizeShopifyOrderPayload({
        shop: 'demo-store.myshopify.com',
        order,
    });

    assert.equal(normalized.platform, 'shopify');
    assert.equal(normalized.shopDomain, 'demo-store.myshopify.com');
    assert.equal(normalized.orderId, '999');
    assert.equal(normalized.orderValue, 250);
    assert.equal(normalized.currency, 'USD');
    assert.equal(normalized.promoCode, 'PROMO-1');
    assert.equal(normalized.discountCodes.length, 2);
    assert.equal(normalized.customerEmailHash.length, 64);
});

test('registerShopifyOrderWebhook registers the orders paid webhook', async (t) => {
    const originalFetch = global.fetch;
    const requests = [];

    global.fetch = async (url, options = {}) => {
        requests.push({ url, options });
        return {
            ok: true,
            text: async () => JSON.stringify({ webhook: { id: 12345 } }),
        };
    };

    t.after(() => {
        global.fetch = originalFetch;
    });

    const result = await registerShopifyOrderWebhook({
        shop: 'demo-store.myshopify.com',
        accessToken: 'access-token',
    });

    assert.equal(result.topic, 'orders/paid');
    assert.equal(result.webhook.id, 12345);
    assert.equal(requests.length, 1);
    assert.match(requests[0].url, /\/admin\/api\/2024-10\/webhooks\.json$/);
    assert.equal(JSON.parse(requests[0].options.body).webhook.topic, 'orders/paid');
});
