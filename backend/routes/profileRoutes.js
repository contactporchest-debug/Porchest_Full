const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const BrandProfile = require('../models/BrandProfile');
const InfluencerProfile = require('../models/InfluencerProfile');
const User = require('../models/User');

function hasOwn(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj || {}, key);
}

function toNumber(value) {
    if (value === '' || value === null || value === undefined) return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
}

function toBoolean(value) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    return Boolean(value);
}

function toStringArray(value) {
    if (!Array.isArray(value)) return undefined;
    return value.map((item) => String(item).trim()).filter(Boolean);
}

function toNumberArray(value) {
    if (!Array.isArray(value)) return undefined;
    return value
        .map((item) => toNumber(item))
        .filter((item) => item !== undefined);
}

function stripSecrets(profile) {
    if (!profile) return profile;
    const plain = typeof profile.toObject === 'function' ? profile.toObject({ depopulate: true }) : { ...profile };

    if (plain.sync) {
        delete plain.sync.accessToken;
        delete plain.sync.longLivedToken;
    }

    return plain;
}

function applyIfPresent(target, source, key, transform = (value) => value) {
    if (!hasOwn(source, key)) return;
    const value = transform(source[key]);
    if (value !== undefined) target[key] = value;
}

function buildBrandUpdates(body) {
    const updates = {};

    applyIfPresent(updates, body, 'businessName', (value) => value ?? '');
    applyIfPresent(updates, body, 'brandName', (value) => value ?? '');
    applyIfPresent(updates, body, 'representerName', (value) => value ?? '');
    applyIfPresent(updates, body, 'industry', (value) => value ?? '');
    applyIfPresent(updates, body, 'website', (value) => value ?? '');
    applyIfPresent(updates, body, 'instagramLink', (value) => value ?? '');
    applyIfPresent(updates, body, 'linkedinLink', (value) => value ?? '');
    applyIfPresent(updates, body, 'googleMapLink', (value) => value ?? '');
    applyIfPresent(updates, body, 'description', (value) => value ?? '');
    applyIfPresent(updates, body, 'bio', (value) => value ?? '');
    applyIfPresent(updates, body, 'contactEmail', (value) => value ?? '');
    applyIfPresent(updates, body, 'marketingGoals', (value) => value ?? '');

    if (hasOwn(body, 'preferredNiches')) {
        const list = toStringArray(body.preferredNiches);
        if (list !== undefined) updates.preferredNiches = list;
    }

    if (hasOwn(body, 'targetAudience')) {
        const input = body.targetAudience || {};
        const targetAudience = {};

        if (hasOwn(input, 'ageRange')) {
            const ageRange = toNumberArray(input.ageRange);
            if (ageRange !== undefined) targetAudience.ageRange = ageRange.slice(0, 2);
        }
        if (hasOwn(input, 'genders')) {
            const genders = toStringArray(input.genders)?.filter((gender) => ['male', 'female', 'both'].includes(gender));
            if (genders !== undefined) targetAudience.genders = genders;
        }
        if (hasOwn(input, 'countries')) {
            const countries = toStringArray(input.countries);
            if (countries !== undefined) targetAudience.countries = countries.slice(0, 3);
        }

        if (Object.keys(targetAudience).length > 0) {
            updates.targetAudience = targetAudience;
        }
    }

    if (hasOwn(body, 'budgetRange')) {
        const input = body.budgetRange || {};
        const budgetRange = {
            min: hasOwn(input, 'min') ? toNumber(input.min) : undefined,
            max: hasOwn(input, 'max') ? toNumber(input.max) : undefined,
        };
        if (Object.values(budgetRange).some((value) => value !== undefined)) {
            updates.budgetRange = budgetRange;
        }
    }

    return updates;
}

function buildInfluencerUpdates(body) {
    const updates = {};

    applyIfPresent(updates, body, 'fullName', (value) => value ?? '');
    applyIfPresent(updates, body, 'bio', (value) => value ?? '');
    applyIfPresent(updates, body, 'country', (value) => value ?? '');
    applyIfPresent(updates, body, 'city', (value) => value ?? '');
    applyIfPresent(updates, body, 'contactEmail', (value) => value ?? '');

    if (hasOwn(body, 'niche')) {
        const niche = toStringArray(body.niche);
        if (niche !== undefined) updates.niche = niche;
    }

    if (hasOwn(body, 'languages')) {
        const languages = toStringArray(body.languages);
        if (languages !== undefined) updates.languages = languages.slice(0, 2);
    }

    if (hasOwn(body, 'contentStyleTags')) {
        const contentStyleTags = toStringArray(body.contentStyleTags);
        if (contentStyleTags !== undefined) updates.contentStyleTags = contentStyleTags;
    }

    if (hasOwn(body, 'rates')) {
        const input = body.rates || {};
        const rates = {
            reelPrice: hasOwn(input, 'reelPrice') ? toNumber(input.reelPrice) : undefined,
            postPrice: hasOwn(input, 'postPrice') ? toNumber(input.postPrice) : undefined,
        };
        if (Object.values(rates).some((value) => value !== undefined)) {
            updates.rates = rates;
        }
    }

    return updates;
}

function isInfluencerProfileComplete(profile) {
    const languages = Array.isArray(profile.languages) ? profile.languages : [];
    const niches = Array.isArray(profile.niche) ? profile.niche : [];
    const contentStyles = Array.isArray(profile.contentStyleTags) ? profile.contentStyleTags : [];
    const hasRates = !!(
        profile.rates &&
        typeof profile.rates.reelPrice === 'number' &&
        typeof profile.rates.postPrice === 'number'
    );

    return !!(
        profile.fullName &&
        profile.contactEmail &&
        profile.country &&
        profile.city &&
        niches.length > 0 &&
        contentStyles.length > 0 &&
        languages.length > 0 &&
        languages.length <= 2 &&
        hasRates
    );
}

async function finalizeUserProfile(userId, role, profileId, profileComplete) {
    const update = { profileCompletionStatus: profileComplete };

    if (role === 'brand') update.brandProfileId = profileId;
    if (role === 'influencer') update.influencerProfileId = profileId;

    await User.findByIdAndUpdate(userId, update, { new: true });
}

async function upsertProfile(Model, userId, updates) {
    return Model.findOneAndUpdate(
        { userId },
        {
            $set: {
                ...updates,
            },
            $setOnInsert: {
                userId,
            },
        },
        {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true,
        }
    );
}

router.get('/influencer/me', authMiddleware, roleMiddleware('influencer'), async (req, res) => {
    try {
        const profile = await InfluencerProfile.findOne({ userId: req.user._id }).select('-sync.accessToken -sync.longLivedToken');
        if (!profile) {
            return res.json({ userId: String(req.user._id), profileComplete: false });
        }
        return res.json(stripSecrets(profile));
    } catch (error) {
        return res.status(500).json({ message: 'Failed to load influencer profile' });
    }
});

router.put('/influencer', authMiddleware, roleMiddleware('influencer'), async (req, res) => {
    try {
        const updates = buildInfluencerUpdates(req.body || {});
        const profile = await upsertProfile(InfluencerProfile, req.user._id, updates);
        const complete = isInfluencerProfileComplete(profile);

        await InfluencerProfile.updateOne(
            { _id: profile._id },
            {
                $set: {
                    profileComplete: complete,
                    profileCompletionStatus: complete,
                },
            }
        );

        await finalizeUserProfile(req.user._id, 'influencer', profile._id, complete);

        const freshProfile = await InfluencerProfile.findById(profile._id).select('-sync.accessToken -sync.longLivedToken');

        return res.json(stripSecrets(freshProfile || profile));
    } catch (error) {
        console.error('[profileRoutes] Failed to save influencer profile:', error?.stack || error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message || 'Failed to save influencer profile' });
        }
        return res.status(500).json({ message: 'Failed to save influencer profile' });
    }
});

router.get('/brand/me', authMiddleware, roleMiddleware('brand'), async (req, res) => {
    try {
        const profile = await BrandProfile.findOne({ userId: req.user._id }).select('-sync.accessToken -sync.longLivedToken');
        if (!profile) {
            return res.json({ userId: String(req.user._id), profileComplete: false });
        }
        return res.json(stripSecrets(profile));
    } catch (error) {
        return res.status(500).json({ message: 'Failed to load brand profile' });
    }
});

router.put('/brand', authMiddleware, roleMiddleware('brand'), async (req, res) => {
    try {
        const updates = buildBrandUpdates(req.body || {});
        const profile = await upsertProfile(BrandProfile, req.user._id, updates);
        const targetAudience = profile.targetAudience || {};
        const hasAgeRange = Array.isArray(targetAudience.ageRange) && targetAudience.ageRange.length === 2 && targetAudience.ageRange.every((value) => typeof value === 'number');
        const complete = !!(
            profile.businessName &&
            profile.representerName &&
            profile.industry &&
            profile.contactEmail &&
            hasAgeRange &&
            Array.isArray(targetAudience.genders) && targetAudience.genders.length > 0 &&
            Array.isArray(targetAudience.countries) && targetAudience.countries.length > 0 && targetAudience.countries.length <= 3 &&
            Array.isArray(profile.preferredNiches) && profile.preferredNiches.length > 0 &&
            profile.budgetRange &&
            typeof profile.budgetRange.min === 'number' &&
            typeof profile.budgetRange.max === 'number' &&
            profile.marketingGoals
        );

        profile.profileComplete = complete;
        profile.profileCompletionStatus = complete;
        await profile.save();

        await finalizeUserProfile(req.user._id, 'brand', profile._id, complete);

        return res.json(stripSecrets(profile));
    } catch (error) {
        return res.status(500).json({ message: 'Failed to save brand profile' });
    }
});

module.exports = router;
