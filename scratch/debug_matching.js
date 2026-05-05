const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const BrandProfile = require('../backend/models/BrandProfile');
const InfluencerProfile = require('../backend/models/InfluencerProfile');

async function debug() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const influencers = await InfluencerProfile.find({
            profileCompletionStatus: true,
            $or: [
                { instagramConnectionStatus: 'connected' },
                { instagramConnected: true }
            ]
        }).limit(5);

        console.log('--- Sample Influencers ---');
        influencers.forEach(inf => {
            console.log(`Name: ${inf.fullName}, Niche: ${inf.niche}, Country: ${inf.country}, Followers: ${inf.followersCount}, ER: ${inf.engagementRate}, Post Price: ${inf.avgPostPrice}`);
        });

        const brand = await BrandProfile.findOne().sort({ updatedAt: -1 });
        if (brand) {
            console.log('\n--- Latest Brand Profile ---');
            console.log(`Name: ${brand.businessName}, Industry: ${brand.industry}, Niches: ${brand.preferredNiches}, Countries: ${brand.targetAudience?.countries}`);
            console.log(`Budget: ${brand.budgetRange?.min} - ${brand.budgetRange?.max}`);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debug();
