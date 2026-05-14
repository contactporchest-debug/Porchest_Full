const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { normalizeOrigin } = require('../utils/urlBases');

const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || '2024-10';

function normalizeString(value) {
    return value == null ? '' : String(value).trim();
}

function normalizeShopDomain(shop) {
    const normalized = normalizeString(shop).toLowerCase();
    if (!normalized) {
        throw new Error('Shop domain is required');
    }

    if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(normalized)) {
        throw new Error('Shop domain must be a valid *.myshopify.com domain');
    }

    return normalized;
}

function getShopifyApiKey() {
    return normalizeString(process.env.SHOPIFY_API_KEY);
}

function getShopifyApiSecret() {
    return normalizeString(process.env.SHOPIFY_API_SECRET);
}

function getShopifyScopes() {
    return normalizeString(process.env.SHOPIFY_SCOPES) || 'read_orders,read_customers';
}

function getShopifyAppUrl() {
    return normalizeOrigin(process.env.SHOPIFY_APP_URL || process.env.PORCHEST_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:5000');
}

function getShopifyRedirectUri() {
    return normalizeString(process.env.SHOPIFY_REDIRECT_URI) || `${getShopifyAppUrl()}/api/integrations/shopify/callback`;
}

function getStateSecret() {
    return normalizeString(process.env.SHOPIFY_STATE_SECRET || process.env.JWT_SECRET || process.env.PORCHEST_ATTRIBUTION_SECRET || process.env.SHOPIFY_API_SECRET);
}

function signShopifyStateToken(payload = {}) {
    const secret = getStateSecret();
    if (!secret) {
        throw new Error('Shopify state secret is not configured');
    }

    return jwt.sign(
        {
            brandId: payload.brandId || null,
            nonce: payload.nonce || crypto.randomBytes(12).toString('hex'),
        },
        secret,
        { expiresIn: payload.expiresIn || '10m' }
    );
}

function verifyShopifyStateToken(token) {
    const secret = getStateSecret();
    if (!secret || !token) return null;

    try {
        return jwt.verify(token, secret);
    } catch (error) {
        return null;
    }
}

function buildShopifyInstallUrl({ shop, state }) {
    const apiKey = getShopifyApiKey();
    if (!apiKey) {
        throw new Error('SHOPIFY_API_KEY is not configured');
    }

    const normalizedShop = normalizeShopDomain(shop);
    const redirectUri = getShopifyRedirectUri();
    const scopes = getShopifyScopes();
    const url = new URL(`https://${normalizedShop}/admin/oauth/authorize`);
    url.searchParams.set('client_id', apiKey);
    url.searchParams.set('scope', scopes);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('state', state || signShopifyStateToken());
    return url.toString();
}

async function exchangeCodeForAccessToken({ shop, code }) {
    const normalizedShop = normalizeShopDomain(shop);
    const apiKey = getShopifyApiKey();
    const apiSecret = getShopifyApiSecret();

    if (!apiKey || !apiSecret) {
        throw new Error('Shopify app credentials are not configured');
    }

    const response = await fetch(`https://${normalizedShop}/admin/oauth/access_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            client_id: apiKey,
            client_secret: apiSecret,
            code,
        }),
    });

    const text = await response.text();
    if (!response.ok) {
        throw new Error(`Shopify token exchange failed: ${text || response.statusText}`);
    }

    try {
        return JSON.parse(text);
    } catch (error) {
        throw new Error('Shopify token exchange returned invalid JSON');
    }
}

function buildOAuthMessage(query = {}) {
    return Object.keys(query)
        .filter((key) => key !== 'hmac' && key !== 'signature' && key !== '__rawQuery')
        .sort()
        .map((key) => {
            const value = query[key];
            if (Array.isArray(value)) {
                return `${key}=${value.join(',')}`;
            }
            return `${key}=${String(value)}`;
        })
        .join('&');
}

function compareHmac(expected, actual) {
    const expectedBuffer = Buffer.from(expected || '', 'utf8');
    const actualBuffer = Buffer.from(actual || '', 'utf8');
    if (expectedBuffer.length !== actualBuffer.length) return false;
    return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

function verifyShopifyOAuthCallback(query = {}) {
    const apiSecret = getShopifyApiSecret();
    if (!apiSecret) {
        throw new Error('SHOPIFY_API_SECRET is not configured');
    }

    const shop = normalizeShopDomain(query.shop);
    const code = normalizeString(query.code);
    const state = normalizeString(query.state);
    const hmac = normalizeString(query.hmac);
    const rawQuery = normalizeString(query.__rawQuery);

    if (!shop || !code || !state || !hmac) {
        throw new Error('Missing Shopify OAuth callback parameters');
    }

    const message = rawQuery
        ? rawQuery
            .split('&')
            .filter((part) => !part.startsWith('hmac=') && !part.startsWith('signature='))
            .sort()
            .join('&')
        : buildOAuthMessage(query);

    const digest = crypto.createHmac('sha256', apiSecret).update(message).digest('hex');
    if (!compareHmac(digest, hmac)) {
        throw new Error('Invalid Shopify OAuth callback HMAC');
    }

    return {
        shop,
        code,
        state,
        hmac,
        message,
    };
}

function verifyShopifyWebhookHmac({ rawBody, hmacHeader }) {
    const apiSecret = getShopifyApiSecret();
    if (!apiSecret || !rawBody || !hmacHeader) return false;

    const payload = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(String(rawBody));
    const digest = crypto.createHmac('sha256', apiSecret).update(payload).digest('base64');
    return compareHmac(digest, normalizeString(hmacHeader));
}

function extractDiscountCodes(order = {}) {
    const collected = [];
    const push = (value) => {
        const normalized = normalizeString(value);
        if (!normalized) return;
        if (!collected.some((item) => item.toLowerCase() === normalized.toLowerCase())) {
            collected.push(normalized);
        }
    };

    if (Array.isArray(order.discount_codes)) {
        order.discount_codes.forEach((entry) => {
            if (typeof entry === 'string') return push(entry);
            push(entry?.code);
            push(entry?.title);
        });
    }

    if (Array.isArray(order.discount_applications)) {
        order.discount_applications.forEach((entry) => {
            push(entry?.code);
            push(entry?.title);
        });
    }

    if (Array.isArray(order.discountCodes)) {
        order.discountCodes.forEach(push);
    }

    return collected;
}

function readMoneyValue(order = {}) {
    const candidates = [
        order.current_total_price,
        order.total_price,
        order.current_subtotal_price,
        order.subtotal_price,
        order.current_total_price_set?.shop_money?.amount,
        order.total_price_set?.shop_money?.amount,
        order.current_total_price_set?.presentment_money?.amount,
        order.total_price_set?.presentment_money?.amount,
    ];

    for (const candidate of candidates) {
        const parsed = Number(candidate);
        if (Number.isFinite(parsed)) return parsed;
    }

    return 0;
}

function readCurrency(order = {}) {
    return normalizeString(
        order.currency ||
        order.current_total_price_set?.shop_money?.currency_code ||
        order.total_price_set?.shop_money?.currency_code ||
        order.current_total_price_set?.presentment_money?.currency_code ||
        order.total_price_set?.presentment_money?.currency_code
    ) || 'USD';
}

function normalizeShopifyOrderPayload({ shop, order }) {
    const shopDomain = normalizeShopDomain(shop || order?.shop_domain || order?.shopDomain);
    const discountCodes = extractDiscountCodes(order);
    const email = normalizeString(order?.email || order?.customer?.email || order?.billing_address?.email);
    const customerEmailHash = email
        ? crypto.createHash('sha256').update(email.toLowerCase()).digest('hex')
        : null;

    return {
        platform: 'shopify',
        shopDomain,
        orderId: normalizeString(order?.id || order?.order_number || order?.name || order?.admin_graphql_api_id),
        orderValue: readMoneyValue(order),
        currency: readCurrency(order),
        promoCode: discountCodes[0] || null,
        discountCodes,
        customerEmailHash,
        processedAt: normalizeString(order?.processed_at || order?.created_at || new Date().toISOString()),
        raw: order,
    };
}

async function registerShopifyOrderWebhook({ shop, accessToken }) {
    const normalizedShop = normalizeShopDomain(shop);
    const token = normalizeString(accessToken);
    if (!token) {
        throw new Error('Shopify access token is required');
    }

    const endpoint = `${getShopifyAppUrl()}/api/webhooks/shopify`;
    const attempts = ['orders/paid', 'orders/create'];

    for (const topic of attempts) {
        const response = await fetch(`https://${normalizedShop}/admin/api/${SHOPIFY_API_VERSION}/webhooks.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': token,
            },
            body: JSON.stringify({
                webhook: {
                    topic,
                    address: endpoint,
                    format: 'json',
                },
            }),
        });

        const text = await response.text();
        if (response.ok) {
            try {
                const parsed = JSON.parse(text);
                return {
                    topic,
                    webhook: parsed?.webhook || null,
                };
            } catch (error) {
                return {
                    topic,
                    webhook: null,
                };
            }
        }
    }

    throw new Error('Shopify webhook registration failed');
}

module.exports = {
    buildShopifyInstallUrl,
    exchangeCodeForAccessToken,
    verifyShopifyOAuthCallback,
    registerShopifyOrderWebhook,
    verifyShopifyWebhookHmac,
    normalizeShopifyOrderPayload,
    extractDiscountCodes,
    signShopifyStateToken,
    verifyShopifyStateToken,
};
