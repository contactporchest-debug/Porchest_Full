const {
    getInfluencerAnalyticsDetail,
    listInfluencerAnalytics,
    recalculateInfluencerAnalytics,
} = require('../services/influencerAnalyticsService');

exports.listInfluencers = async (req, res, next) => {
    try {
        const result = await listInfluencerAnalytics({
            user: req.user,
            search: typeof req.query.search === 'string' ? req.query.search.trim() : '',
        });

        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

exports.getInfluencerById = async (req, res, next) => {
    try {
        const result = await getInfluencerAnalyticsDetail({
            user: req.user,
            id: req.params.id,
        });

        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

exports.recalculateInfluencer = async (req, res, next) => {
    try {
        const result = await recalculateInfluencerAnalytics({
            user: req.user,
            id: req.params.id,
        });

        res.json({ success: true, message: 'Analytics recalculated successfully', ...result });
    } catch (error) {
        next(error);
    }
};
