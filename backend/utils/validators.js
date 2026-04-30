/**
 * Reusable validation helpers — used by both influencer and brand controllers
 */

const INFLUENCER_NICHES = [
    'Fashion', 'Food', 'Fitness', 'Tech', 'Travel', 'Beauty',
    'Gaming', 'Lifestyle', 'Parenting', 'Education', 'Business',
    'Health', 'Entertainment', 'Finance', 'Other'
];

const BRAND_NICHES = [
    'Fashion', 'Food', 'Fitness', 'Tech', 'Travel', 'Beauty',
    'Gaming', 'Lifestyle', 'Education', 'Entertainment', 'Finance',
    'Health', 'Business', 'Other'
];

/**
 * Validate influencer profile update fields
 * Returns { valid: boolean, errors: string[] }
 */
exports.validateInfluencerProfile = (body) => {
    const errors = [];
    const { fullName, displayName, contactEmail, age, countryOfResidence, country, niche, avgPostCostUSD, avgReelCostUSD, shortBio, bio } = body;

    if (fullName !== undefined || displayName !== undefined) {
        const value = fullName || displayName;
        if (!value || typeof value !== 'string' || value.trim().length < 2) {
            errors.push('Full name must be at least 2 characters');
        }
    }

    if (contactEmail !== undefined) {
        if (!contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
            errors.push('Contact email must be a valid email address');
        }
    }

    if (age !== undefined && age !== null && age !== '') {
        const ageNum = Number(age);
        if (isNaN(ageNum) || ageNum < 13 || ageNum > 100) {
            errors.push('Age must be a number between 13 and 100');
        }
    }

    if (niche !== undefined) {
        const nicheValue = Array.isArray(niche) ? niche[0] : niche;
        if (!INFLUENCER_NICHES.includes(nicheValue)) {
            errors.push(`Niche must be one of: ${INFLUENCER_NICHES.join(', ')}`);
        }
    }

    if (avgPostCostUSD !== undefined && avgPostCostUSD !== null && avgPostCostUSD !== '') {
        const cost = Number(avgPostCostUSD);
        if (isNaN(cost) || cost < 0) {
            errors.push('Average post cost must be a non-negative number');
        }
    }

    if (avgReelCostUSD !== undefined && avgReelCostUSD !== null && avgReelCostUSD !== '') {
        const cost = Number(avgReelCostUSD);
        if (isNaN(cost) || cost < 0) {
            errors.push('Average reel cost must be a non-negative number');
        }
    }

    const bioValue = shortBio ?? bio;
    if (bioValue !== undefined && bioValue !== null) {
        const wordCount = String(bioValue).trim().split(/\s+/).filter(Boolean).length;
        if (wordCount > 100) {
            errors.push('Bio must not exceed 100 words');
        }
    }

    return { valid: errors.length === 0, errors };
};

/**
 * Validate brand profile update fields
 * Returns { valid: boolean, errors: string[] }
 */
exports.validateBrandProfile = (body) => {
    const errors = [];
    const { brandName, businessName, officialEmail, contactPersonName, brandGoal, brandNiche, approxBudgetUSD, companyCountry, country, companyWebsite, website } = body;

    if (brandName !== undefined || businessName !== undefined) {
        const value = brandName || businessName;
        if (!value || typeof value !== 'string' || value.trim().length < 2) {
            errors.push('Brand name must be at least 2 characters');
        }
    }

    if (officialEmail !== undefined) {
        if (!officialEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(officialEmail)) {
            errors.push('Official email must be a valid email address');
        }
    }

    if (contactPersonName !== undefined) {
        if (!contactPersonName || typeof contactPersonName !== 'string' || contactPersonName.trim().length < 2) {
            errors.push('Contact person name must be at least 2 characters');
        }
    }

    if (brandGoal !== undefined && brandGoal !== null) {
        const wordCount = brandGoal.trim().split(/\s+/).filter(Boolean).length;
        if (wordCount > 150) {
            errors.push('Brand goal must not exceed 150 words');
        }
    }

    if (brandNiche !== undefined) {
        if (!BRAND_NICHES.includes(brandNiche)) {
            errors.push(`Brand niche must be one of: ${BRAND_NICHES.join(', ')}`);
        }
    }

    if (approxBudgetUSD !== undefined && approxBudgetUSD !== null && approxBudgetUSD !== '') {
        const budget = Number(approxBudgetUSD);
        if (isNaN(budget) || budget < 0) {
            errors.push('Budget must be a non-negative number');
        }
    }

    const websiteValue = companyWebsite || website;
    if (websiteValue !== undefined && websiteValue !== null && websiteValue !== '') {
        try { new URL(websiteValue); } catch {
            errors.push('Company website must be a valid URL (include https://)');
        }
    }

    if (body.trackingWebsiteURL !== undefined && body.trackingWebsiteURL !== null && body.trackingWebsiteURL !== '') {
        try { new URL(body.trackingWebsiteURL); } catch {
            errors.push('Tracking website URL must be a valid URL (include https://)');
        }
    }

    if (body.landingPageURL !== undefined && body.landingPageURL !== null && body.landingPageURL !== '') {
        try { new URL(body.landingPageURL); } catch {
            errors.push('Landing page URL must be a valid URL (include https://)');
        }
    }

    return { valid: errors.length === 0, errors };
};

exports.INFLUENCER_NICHES = INFLUENCER_NICHES;
exports.BRAND_NICHES = BRAND_NICHES;

/**
 * Sanitize a MongoDB ObjectId — returns false if invalid
 */
exports.isValidObjectId = (id) => {
    return /^[a-fA-F0-9]{24}$/.test(id);
};
