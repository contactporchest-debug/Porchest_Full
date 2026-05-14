const jwt = require('jsonwebtoken');

const DEFAULT_TTL = '30d';

function getSecret() {
    return process.env.PORCHEST_ATTRIBUTION_SECRET || process.env.JWT_SECRET;
}

function toMillis(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.getTime();
}

function signAttributionToken(payload = {}) {
    const secret = getSecret();
    if (!secret) {
        throw new Error('Attribution secret is not configured');
    }

    const issuedAt = payload.issuedAt ? new Date(payload.issuedAt) : new Date();
    const expiresAt = payload.expiresAt ? new Date(payload.expiresAt) : new Date(issuedAt.getTime() + 30 * 24 * 60 * 60 * 1000);

    return jwt.sign(
        {
            brandId: payload.brandId || null,
            collaborationId: payload.collaborationId || null,
            influencerId: payload.influencerId || null,
            clickId: payload.clickId || null,
            issuedAt: issuedAt.toISOString(),
            expiresAt: expiresAt.toISOString(),
        },
        secret,
        {
            expiresIn: payload.expiresIn || DEFAULT_TTL,
        }
    );
}

function verifyAttributionToken(token) {
    const secret = getSecret();
    if (!secret || !token) return null;

    try {
        const decoded = jwt.verify(token, secret);
        const expiresAtMs = toMillis(decoded.expiresAt) || (decoded.exp ? decoded.exp * 1000 : null);
        if (expiresAtMs && expiresAtMs < Date.now()) {
            return null;
        }

        return decoded;
    } catch (error) {
        return null;
    }
}

module.exports = {
    signAttributionToken,
    verifyAttributionToken,
};
