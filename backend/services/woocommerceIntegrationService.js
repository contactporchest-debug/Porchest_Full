const crypto = require('crypto');
const { normalizeOrigin } = require('../utils/urlBases');

function normalizeString(value) {
    return value == null ? '' : String(value).trim();
}

function normalizeStoreUrl(storeUrl) {
    const raw = normalizeString(storeUrl);
    if (!raw) {
        throw new Error('Store URL is required');
    }

    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const url = new URL(withProtocol);

    if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Store URL must use http or https');
    }

    return url.origin.replace(/\/$/, '');
}

function getWooCommerceAppName() {
    return normalizeString(process.env.WOOCOMMERCE_APP_NAME) || 'Porchest';
}

function getWooCommerceWebhookSecret() {
    return normalizeString(process.env.WOOCOMMERCE_WEBHOOK_SECRET) || crypto.randomBytes(24).toString('hex');
}

function getBackendBaseUrl() {
    return normalizeOrigin(process.env.PORCHEST_PUBLIC_API_URL || process.env.APP_URL || 'http://localhost:5000');
}

function buildWooAuthHeader(consumerKey, consumerSecret) {
    const key = normalizeString(consumerKey);
    const secret = normalizeString(consumerSecret);
    if (!key || !secret) {
        throw new Error('WooCommerce credentials are required');
    }

    return `Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}`;
}

function timingSafeCompare(a, b) {
    const left = Buffer.from(normalizeString(a));
    const right = Buffer.from(normalizeString(b));
    if (left.length !== right.length) return false;
    return crypto.timingSafeEqual(left, right);
}

function hashCustomerEmail(email) {
    const normalized = normalizeString(email).toLowerCase();
    if (!normalized) return null;
    return crypto.createHash('sha256').update(normalized).digest('hex');
}

function extractWooCommerceCouponCodes(order = {}) {
    const collected = [];
    const push = (value) => {
        const normalized = normalizeString(value).toUpperCase();
        if (!normalized) return;
        if (!collected.includes(normalized)) {
            collected.push(normalized);
        }
    };

    if (Array.isArray(order.coupon_lines)) {
        order.coupon_lines.forEach((line) => {
            push(line?.code);
        });
    }

    if (Array.isArray(order.couponCodes)) {
        order.couponCodes.forEach(push);
    }

    if (Array.isArray(order.coupons)) {
        order.coupons.forEach(push);
    }

    return collected;
}

function readWooOrderValue(order = {}) {
    const candidates = [
        order.total,
        order.total_price,
        order.total_amount,
        order.amount_total,
        order.total_tax,
        order.meta?.total,
    ];

    for (const candidate of candidates) {
        const parsed = Number(candidate);
        if (Number.isFinite(parsed)) return parsed;
    }

    return 0;
}

function readWooCurrency(order = {}) {
    return normalizeString(
        order.currency ||
        order.currency_code ||
        order.meta?.currency ||
        order.total_set?.currency_code
    ) || 'USD';
}

async function fetchWooJson(storeUrl, path, { method = 'GET', consumerKey, consumerSecret, body } = {}) {
    const url = `${normalizeStoreUrl(storeUrl)}${path.startsWith('/') ? path : `/${path}`}`;
    const headers = {
        Authorization: buildWooAuthHeader(consumerKey, consumerSecret),
        'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();
    let json = null;
    try {
        json = text ? JSON.parse(text) : null;
    } catch (error) {
        json = null;
    }

    return {
        response,
        json,
        text,
    };
}

async function validateWooCommerceCredentials({ storeUrl, consumerKey, consumerSecret }) {
    const normalizedStoreUrl = normalizeStoreUrl(storeUrl);
    const { response, json } = await fetchWooJson(normalizedStoreUrl, '/wp-json/wc/v3/system_status', {
        consumerKey,
        consumerSecret,
    });

    if (!response.ok) {
        return {
            valid: false,
            storeName: null,
            storeUrl: normalizedStoreUrl,
            wooVersion: null,
        };
    }

    return {
        valid: true,
        storeName: json?.settings?.store_name?.value || json?.store_name || json?.environment?.home_url || normalizedStoreUrl,
        storeUrl: normalizedStoreUrl,
        wooVersion: json?.environment?.woocommerce_version || json?.woocommerce_version || json?.version || null,
    };
}

async function createWooCommerceWebhook({ storeUrl, consumerKey, consumerSecret, webhookSecret }) {
    const normalizedStoreUrl = normalizeStoreUrl(storeUrl);
    const payload = {
        name: `${getWooCommerceAppName()} order tracking`,
        topic: 'order.created',
        delivery_url: `${getBackendBaseUrl()}/api/integrations/woocommerce/webhooks/orders`,
        secret: normalizeString(webhookSecret) || getWooCommerceWebhookSecret(),
        status: 'active',
    };

    const { response, json, text } = await fetchWooJson(normalizedStoreUrl, '/wp-json/wc/v3/webhooks', {
        method: 'POST',
        consumerKey,
        consumerSecret,
        body: payload,
    });

    if (!response.ok) {
        throw new Error(`WooCommerce webhook creation failed: ${text || response.statusText}`);
    }

    return {
        webhook: json || null,
        webhookId: json?.id || json?.webhook_id || null,
        webhookSecret: payload.secret,
        deliveryUrl: payload.delivery_url,
        topic: payload.topic,
    };
}

function verifyWooCommerceWebhook({ payload, signature, webhookSecret }) {
    const secret = normalizeString(webhookSecret);
    if (!secret || !signature || payload == null) return false;

    const raw = Buffer.isBuffer(payload) ? payload : Buffer.from(String(payload));
    const expected = crypto.createHmac('sha256', secret).update(raw).digest('base64');
    return timingSafeCompare(expected, signature);
}

function normalizeWooCommerceOrder({ storeUrl, order }) {
    const normalizedStoreUrl = normalizeStoreUrl(storeUrl || order?.storeUrl || order?.site_url || order?.permalink);
    const couponCodes = extractWooCommerceCouponCodes(order);
    const email = normalizeString(order?.billing?.email || order?.email || order?.customer?.email);

    return {
        platform: 'woocommerce',
        storeUrl: normalizedStoreUrl,
        orderId: normalizeString(order?.id || order?.number || order?.order_key || order?.transaction_id || order?.code),
        orderValue: readWooOrderValue(order),
        currency: readWooCurrency(order),
        promoCode: couponCodes[0] || null,
        discountCodes: couponCodes,
        customerEmailHash: hashCustomerEmail(email),
        processedAt: normalizeString(order?.date_paid_gmt || order?.date_created_gmt || order?.date_created || new Date().toISOString()),
        raw: order,
    };
}

module.exports = {
    validateWooCommerceCredentials,
    createWooCommerceWebhook,
    verifyWooCommerceWebhook,
    normalizeWooCommerceOrder,
    extractWooCommerceCouponCodes,
    hashCustomerEmail,
    normalizeStoreUrl,
    getWooCommerceWebhookSecret,
};
