const mongoose = require('mongoose');

function mergeFieldPair(target, source, left, right) {
    const hasLeft = Object.prototype.hasOwnProperty.call(source, left);
    const hasRight = Object.prototype.hasOwnProperty.call(source, right);

    if (hasLeft && !hasRight) target[right] = source[left];
    if (!hasLeft && hasRight) target[left] = source[right];
}

function normalizeUpdate(update, pairs) {
    if (!update || typeof update !== 'object') return update;

    const buckets = [update, update.$set, update.$setOnInsert];
    for (const bucket of buckets) {
        if (!bucket || typeof bucket !== 'object') continue;
        for (const [left, right] of pairs) {
            mergeFieldPair(bucket, bucket, left, right);
        }
    }

    return update;
}

const brandProfileSchema = new mongoose.Schema(
    {
        // Identity
        brandProfileId: { type: String, unique: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        businessName: {
            type: String,
            required: function requiredBusinessName() {
                return !this.brandName && !this.companyName;
            },
        },
        representerName: { type: String },
        logo: { type: String },
        industry: { type: String },
        website: { type: String },
        instagramLink: { type: String },
        linkedinLink: { type: String },
        googleMapLink: { type: String },
        contactEmail: { type: String },
        country: { type: String },
        bio: { type: String },
        marketingGoals: { type: String, maxlength: 1500 },

        // Target audience
        targetAudience: {
            ageRange: [{ type: Number }],
            genders: [{ type: String }],
            countries: [{ type: String }],
            cities: [{ type: String }],
        },

        // Campaign preferences
        preferredNiches: [{ type: String }],
        budgetRange: {
            min: { type: Number },
            max: { type: Number },
        },
        typicalBudget: { type: Number },

        // Porchest internal
        assignedEmployee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        assignedEmployeeFK: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        profileComplete: { type: Boolean, default: false },
        verified: { type: Boolean, default: false },

        // Legacy compatibility fields
        brandName: { type: String },
        companyName: { type: String },
        category: { type: String },
        description: { type: String },
        logoUrl: { type: String },
        contactDetails: {
            officialEmail: { type: String },
            contactPersonName: { type: String },
        },
        profileCompletionStatus: { type: Boolean, default: false },
        verificationStatus: {
            type: String,
            enum: ['unverified', 'pending', 'verified', 'rejected'],
            default: 'unverified',
        },
        isActive: { type: Boolean, default: true },
        approxBudgetUSD: { type: Number },
    },
    {
        timestamps: true,
        collection: 'brand_profiles',
    }
);

const MIRROR_PAIRS = [
    ['businessName', 'brandName'],
    ['logo', 'logoUrl'],
    ['industry', 'category'],
    ['bio', 'description'],
    ['profileComplete', 'profileCompletionStatus'],
];

function syncDerivedBrandState(doc) {
    if (!doc) return;

    if (!doc.businessName && doc.brandName) doc.businessName = doc.brandName;
    if (!doc.brandName && doc.businessName) doc.brandName = doc.businessName;

    if (!doc.logo && doc.logoUrl) doc.logo = doc.logoUrl;
    if (!doc.logoUrl && doc.logo) doc.logoUrl = doc.logo;

    if (!doc.industry && doc.category) doc.industry = doc.category;
    if (!doc.category && doc.industry) doc.category = doc.industry;

    if (doc.profileComplete == null && doc.profileCompletionStatus != null) {
        doc.profileComplete = doc.profileCompletionStatus;
    }
    if (doc.profileCompletionStatus == null && doc.profileComplete != null) {
        doc.profileCompletionStatus = doc.profileComplete;
    }

    if (doc.verified === true) {
        doc.verificationStatus = 'verified';
    } else if (doc.verificationStatus === 'verified') {
        doc.verified = true;
    }
}

brandProfileSchema.pre('save', function syncBrandBeforeSave(next) {
    syncDerivedBrandState(this);
    next();
});

brandProfileSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function syncBrandOnUpdate(next) {
    const update = this.getUpdate() || {};
    normalizeUpdate(update, MIRROR_PAIRS);

    if (update.$set) syncDerivedBrandState(update.$set);
    else syncDerivedBrandState(update);

    this.setUpdate(update);
    next();
});

module.exports = mongoose.model('BrandProfile', brandProfileSchema, 'brand_profiles');
