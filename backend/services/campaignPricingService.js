function toNumber(value, fallback = 0) {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
}

function normalizeContentTypes(value) {
    const values = Array.isArray(value)
        ? value
        : typeof value === 'string'
            ? value.split(',').map((item) => item.trim()).filter(Boolean)
            : [];

    const mapped = values.map((item) => String(item).trim().toLowerCase());
    const normalized = new Set();

    mapped.forEach((item) => {
        if (['reel', 'reels', 'video', 'videos'].includes(item)) normalized.add('reel');
        if (['post', 'posts', 'feed post', 'feed', 'carousel', 'carousels'].includes(item)) normalized.add('post');
    });

    return Array.from(normalized);
}

function resolveRate(profile, primaryKey, legacyKeys = []) {
    const rate = profile?.rates?.[primaryKey];
    if (rate != null && Number.isFinite(Number(rate))) return toNumber(rate, 0);
    for (const key of legacyKeys) {
        const value = profile?.[key];
        if (value != null && Number.isFinite(Number(value))) return toNumber(value, 0);
    }
    return 0;
}

function computeFixedCampaignPricing(influencerProfile, requestedContentTypes = [], fallbackPrice = 0) {
    const selectedTypes = normalizeContentTypes(requestedContentTypes);
    const reelPrice = resolveRate(influencerProfile, 'reelPrice', ['avgReelPrice', 'avgReelCostUSD', 'avgReelCost', 'avgReel']);
    const postPrice = resolveRate(influencerProfile, 'postPrice', ['avgPostPrice', 'avgPostCostUSD', 'avgPostCost', 'avgPost']);

    const hasReel = selectedTypes.includes('reel');
    const hasPost = selectedTypes.includes('post');

    let totalPrice = 0;
    if (hasReel) totalPrice += reelPrice;
    if (hasPost) totalPrice += postPrice;

    if (!selectedTypes.length) {
        totalPrice = toNumber(fallbackPrice, 0);
    }

    return {
        selectedTypes,
        reelPrice,
        postPrice,
        totalPrice: Number(totalPrice) || 0,
    };
}

module.exports = {
    computeFixedCampaignPricing,
    normalizeContentTypes,
    resolveRate,
    toNumber,
};
