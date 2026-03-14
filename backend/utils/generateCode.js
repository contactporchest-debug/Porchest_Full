const User = require('../models/User');
const BrandProfile = require('../models/BrandProfile');
const InfluencerProfile = require('../models/InfluencerProfile');

/**
 * Generate a unique sequential code like USR-000001
 * @param {string} prefix - The 3 letter prefix (e.g., 'USR', 'BRD', 'INF')
 * @param {mongoose.Model} Model - The mongoose model to check against
 * @param {string} field - The field name storing the code
 */
exports.generateUniqueCode = async (prefix, Model, field) => {
    // Finding the document with the highest code value
    const lastDoc = await Model.findOne().sort({ _id: -1 }).select(field);
    
    let nextNum = 1;
    if (lastDoc && lastDoc[field]) {
        // Assume format is PREFIX-000001
        const parts = lastDoc[field].split('-');
        if (parts.length === 2 && !isNaN(parts[1])) {
            nextNum = parseInt(parts[1], 10) + 1;
        }
    }

    // Attempt to safely generate and ensure it doesn't collide
    while (true) {
        const paddedNum = String(nextNum).padStart(6, '0');
        const code = `${prefix}-${paddedNum}`;
        const exists = await Model.exists({ [field]: code });
        if (!exists) return code;
        nextNum++;
    }
};
