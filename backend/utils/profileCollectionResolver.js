const mongoose = require('mongoose');

const CANDIDATE_COLLECTIONS = {
    influencer: ['influencerprofiles', 'influencer_profiles'],
    brand: ['brandprofiles', 'brand_profiles'],
};

async function detectCollections() {
    const collections = await mongoose.connection.db.listCollections({}, { nameOnly: true }).toArray();
    const names = collections.map((entry) => entry.name);

    return {
        influencer: CANDIDATE_COLLECTIONS.influencer.filter((name) => names.includes(name)),
        brand: CANDIDATE_COLLECTIONS.brand.filter((name) => names.includes(name)),
    };
}

async function getProfileCollectionInfo() {
    const detected = await detectCollections();

    const influencerAvailable = detected.influencer;
    const brandAvailable = detected.brand;

    return {
        influencerCollection: influencerAvailable[0] || CANDIDATE_COLLECTIONS.influencer[0],
        brandCollection: brandAvailable[0] || CANDIDATE_COLLECTIONS.brand[0],
        influencerCollectionMismatch: influencerAvailable.length > 1 || influencerAvailable[0] === 'influencer_profiles',
        brandCollectionMismatch: brandAvailable.length > 1 || brandAvailable[0] === 'brand_profiles',
        availableCollections: {
            influencer: influencerAvailable,
            brand: brandAvailable,
        },
    };
}

module.exports = {
    getProfileCollectionInfo,
};
