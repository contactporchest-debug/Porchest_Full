const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        role: {
            type: String,
            enum: ['admin', 'brand', 'influencer'],
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'active', 'suspended'],
            default: 'active',
        },
        profileImageURL: { type: String, default: '' },

        // ── Brand-specific fields ──
        companyName: { type: String },
        industry: { type: String },
        website: { type: String },
        budgetRange: { type: String },
        brandGoal: { type: String },
        brandNiche: { type: String },
        approxBudgetUSD: { type: Number },

        // ── Influencer basic fields ──
        fullName: { type: String },
        age: { type: Number },
        country: { type: String },
        contactEmail: { type: String },
        niche: {
            type: String,
            enum: ['Fashion', 'Food', 'Fitness', 'Tech', 'Travel', 'Beauty', 'Gaming', 'Lifestyle', 'Education', 'Entertainment', 'Finance', 'Other'],
        },
        bio: { type: String },

        // ── Influencer Instagram fields ──
        instagramUsername: { type: String },
        instagramProfileURL: { type: String },
        instagramDPURL: { type: String },
        accountType: { type: String, enum: ['Creator', 'Business'] },
        followers: { type: Number, default: 0 },
        engagementRate: { type: Number, default: 0 },
        instagramConnected: { type: Boolean, default: false },

        // ── Influencer pricing ──
        avgPostCostUSD: { type: Number, default: 0 },
        avgReelCostUSD: { type: Number, default: 0 },

        // ── Legacy fields ──
        socialLinks: {
            instagram: { type: String },
            youtube: { type: String },
            tiktok: { type: String },
            twitter: { type: String },
        },
        portfolio: [{ type: String }],
        avatar: { type: String, default: '' },
        earnings: { type: Number, default: 0 },

        // ── Terms & Conditions ──
        termsAccepted: { type: Boolean, default: false },
        termsAcceptedAt: { type: Date },
    },
    { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Hide password in JSON
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

module.exports = mongoose.model('User', userSchema);
