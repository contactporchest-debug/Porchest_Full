const instagramService = require('./instagramService');

const DAY_MS = 24 * 60 * 60 * 1000;
const NINETY_DAYS_MS = 90 * DAY_MS;

function toNumber(value, fallback = 0) {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
}

function isRecentPost(post) {
    const timestamp = new Date(post?.timestamp || 0).getTime();
    return timestamp >= (Date.now() - NINETY_DAYS_MS);
}

function normalizeRoleString(value) {
    return String(value || '').trim().toLowerCase();
}

function rangesOverlap(aMin, aMax, bMin, bMax) {
    return Math.max(aMin, bMin) <= Math.min(aMax, bMax);
}

function areAdjacent(aMin, aMax, bMin, bMax) {
    return Math.abs(aMin - bMax) <= 5 || Math.abs(bMin - aMax) <= 5;
}

function parseAgeBucket(label) {
    const match = String(label || '').match(/(\d{2})\s*-\s*(\d{2})/);
    if (!match) return null;
    return { min: Number(match[1]), max: Number(match[2]) };
}

function getDominantAgeGender(ageGender = {}) {
    const entries = Object.entries(ageGender);
    if (!entries.length) return null;
    return entries.reduce((best, current) => {
        if (!best || Number(current[1]) > Number(best[1])) return current;
        return best;
    }, null);
}

function aggregateGender(ageGender = {}) {
    let male = 0;
    let female = 0;

    for (const [key, rawValue] of Object.entries(ageGender)) {
        const value = Number(rawValue || 0);
        const gender = normalizeRoleString(key).split('.')[0];
        if (gender === 'm' || gender === 'male' || gender === 'men') male += value;
        if (gender === 'f' || gender === 'female' || gender === 'women') female += value;
    }

    return male >= female ? 'M' : 'F';
}

/**
 * Compute average engagement rate across valid posts.
 * @param {Array<object>} posts
 * @returns {number}
 */
function computeEngagementRate(posts = []) {
    try {
        const recentPosts = posts.filter(isRecentPost);
        if (!recentPosts.length) return 0;

        const validRates = recentPosts
            .map((post) => {
                const reach = toNumber(post.reach ?? post.reachCount);
                if (!reach) return null;
                const likes = toNumber(post.likeCount);
                const comments = toNumber(post.commentsCount);
                const saves = toNumber(post.saves ?? post.saveCount);
                const shares = toNumber(post.shares ?? post.shareCount);
                return ((likes + comments + saves + shares) / reach) * 100;
            })
            .filter((value) => value != null && Number.isFinite(value));

        if (!validRates.length) return 0;
        const average = validRates.reduce((sum, value) => sum + value, 0) / validRates.length;
        return Number(average.toFixed(2));
    } catch (error) {
        console.error('[Metrics] computeEngagementRate failed:', error);
        return 0;
    }
}

/**
 * Convert followers count into a tier.
 * @param {number} followersCount
 * @returns {'nano'|'micro'|'macro'|'mega'}
 */
function computeFollowerTier(followersCount = 0) {
    try {
        const count = toNumber(followersCount);
        if (count >= 1_000_000) return 'mega';
        if (count >= 100_000) return 'macro';
        if (count >= 10_000) return 'micro';
        return 'nano';
    } catch (error) {
        console.error('[Metrics] computeFollowerTier failed:', error);
        return 'nano';
    }
}

/**
 * Compute average posts per week over the last 90 days.
 * @param {Array<object>} posts
 * @returns {number}
 */
function computePostingFrequency(posts = []) {
    try {
        const recentPosts = posts.filter(isRecentPost);
        if (!recentPosts.length) return 0;
        const value = (recentPosts.length / 90) * 7;
        return Number(value.toFixed(1));
    } catch (error) {
        console.error('[Metrics] computePostingFrequency failed:', error);
        return 0;
    }
}

/**
 * Compute Porchest's AI influencer score.
 * @param {number} engagementRate
 * @param {number} followersCount
 * @param {number} nicheMatchScore
 * @returns {number}
 */
function computePorchestScore(engagementRate = 0, followersCount = 0, nicheMatchScore = 50) {
    try {
        const safeFollowers = Math.max(1, toNumber(followersCount));
        const engagementScore = Math.min((toNumber(engagementRate) / 6) * 100, 100);
        const reachScore = Math.min((Math.log10(safeFollowers) / 7) * 100, 100);
        const nicheScore = toNumber(nicheMatchScore, 50);
        const porchestScore = (engagementScore * 0.4) + (reachScore * 0.2) + (nicheScore * 0.4);
        return Math.round(porchestScore);
    } catch (error) {
        console.error('[Metrics] computePorchestScore failed:', error);
        return 0;
    }
}

/**
 * Estimate authenticity score from followers, engagement, and posting frequency.
 * @param {number} followersCount
 * @param {number} avgEngagementRate
 * @param {number} postingFrequency
 * @returns {number}
 */
function computeAuthenticityScore(followersCount = 0, avgEngagementRate = 0, postingFrequency = 0) {
    try {
        let baseScore = 100;

        if (avgEngagementRate < 0.5 && followersCount > 50000) baseScore -= 40;
        if (postingFrequency < 0.3 && followersCount > 100000) baseScore -= 20;
        if (avgEngagementRate > 15 && followersCount > 100000) baseScore -= 25;

        return Math.max(0, Math.min(100, Math.round(baseScore)));
    } catch (error) {
        console.error('[Metrics] computeAuthenticityScore failed:', error);
        return 0;
    }
}

/**
 * Compute brand fit score from audience demographics and target audience settings.
 * @param {object} audienceDemographics
 * @param {object} brandTargetAudience
 * @returns {number}
 */
function computeAudienceBrandFitScore(audienceDemographics = {}, brandTargetAudience = {}) {
    try {
        if (!brandTargetAudience) return 0;

        let score = 0;
        const countries = Array.isArray(brandTargetAudience.countries) ? brandTargetAudience.countries.map(normalizeRoleString) : [];
        const genders = Array.isArray(brandTargetAudience.genders) ? brandTargetAudience.genders.map(normalizeRoleString) : [];
        const ageRange = Array.isArray(brandTargetAudience.ageRange) && brandTargetAudience.ageRange.length >= 2
            ? [toNumber(brandTargetAudience.ageRange[0]), toNumber(brandTargetAudience.ageRange[1])]
            : null;

        const topCountries = Array.isArray(audienceDemographics.topCountries) ? audienceDemographics.topCountries : [];
        const topCountryNames = topCountries.slice(0, 3).map((item) => normalizeRoleString(item.country));
        const leadingCountry = normalizeRoleString(topCountries[0]?.country);

        if (countries.length) {
            if (countries.includes(leadingCountry)) score += 40;
            else if (topCountryNames.some((country) => countries.includes(country))) score += 20;
        }

        const ageGender = audienceDemographics.ageGender || {};
        const dominantAgeEntry = getDominantAgeGender(ageGender);
        if (dominantAgeEntry && ageRange) {
            const bucket = parseAgeBucket(dominantAgeEntry[0]);
            if (bucket) {
                if (rangesOverlap(bucket.min, bucket.max, ageRange[0], ageRange[1])) score += 40;
                else if (areAdjacent(bucket.min, bucket.max, ageRange[0], ageRange[1])) score += 20;
            }
        }

        if (genders.length) {
            const dominantGender = aggregateGender(ageGender);
            const normalisedGenders = genders.map((gender) => {
                if (gender === 'male' || gender === 'm' || gender === 'men') return 'm';
                if (gender === 'female' || gender === 'f' || gender === 'women') return 'f';
                return gender;
            });
            if (normalisedGenders.includes(dominantGender.toLowerCase())) {
                score += 20;
            }
        }

        return Math.max(0, Math.min(100, Math.round(score)));
    } catch (error) {
        console.error('[Metrics] computeAudienceBrandFitScore failed:', error);
        return 0;
    }
}

module.exports = {
    instagramService,
    computeEngagementRate,
    computeFollowerTier,
    computePostingFrequency,
    computePorchestScore,
    computeAuthenticityScore,
    computeAudienceBrandFitScore,
};
