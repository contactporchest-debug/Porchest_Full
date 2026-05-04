require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
if (!process.env.MONGODB_URI) {
    require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
}
if (!process.env.MONGODB_URI) {
    require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
}

const mongoose = require('mongoose');
const InfluencerProfile = require('../models/InfluencerProfile');
const CampaignRequest = require('../models/CampaignRequest');

function stripStoryTypes(value) {
    if (Array.isArray(value)) {
        return value
            .map((item) => String(item).trim())
            .filter((item) => item && item.toLowerCase() !== 'story');
    }
    if (typeof value === 'string') {
        return value
            .split(',')
            .map((item) => item.trim())
            .filter((item) => item && item.toLowerCase() !== 'story');
    }
    return [];
}

async function run() {
    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI is undefined');
    }

    await mongoose.connect(process.env.MONGODB_URI);

    const influencerResult = await InfluencerProfile.updateMany(
        {},
        {
            $unset: {
                'rates.storyPrice': '',
                avgStoryPrice: '',
            },
        }
    );

    const requests = await CampaignRequest.find({
        $or: [
            { 'brief.contentType.0': { $exists: true } },
            { 'brief.contentTypes.0': { $exists: true } },
        ],
    }).select('brief contentType contentTypes deliverables').lean();

    let requestUpdates = 0;
    for (const request of requests) {
        const nextContentType = stripStoryTypes(request.brief?.contentType || request.brief?.contentTypes);
        const nextDeliverables = stripStoryTypes(request.deliverables);

        await CampaignRequest.updateOne(
            { _id: request._id },
            {
                $set: {
                    'brief.contentType': nextContentType,
                    'brief.contentTypes': nextContentType,
                    deliverables: nextDeliverables,
                },
            }
        );
        requestUpdates += 1;
    }

    console.log(JSON.stringify({
        influencerProfilesTouched: influencerResult.modifiedCount || 0,
        collaborationRequestsTouched: requestUpdates,
    }, null, 2));

    await mongoose.disconnect();
}

run().catch(async (err) => {
    console.error(err);
    try {
        await mongoose.disconnect();
    } catch {}
    process.exit(1);
});
