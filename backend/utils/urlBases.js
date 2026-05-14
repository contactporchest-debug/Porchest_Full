function normalizeString(value) {
    return value == null ? '' : String(value).trim();
}

function normalizeOrigin(value, fallback) {
    const raw = normalizeString(value || fallback);
    if (!raw) return '';

    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const url = new URL(withProtocol);
    return url.origin.replace(/\/$/, '');
}

function normalizeApiBase(value, fallback) {
    const origin = normalizeOrigin(value, fallback);
    if (!origin) return '';
    return `${origin}/api`;
}

module.exports = {
    normalizeString,
    normalizeOrigin,
    normalizeApiBase,
};
