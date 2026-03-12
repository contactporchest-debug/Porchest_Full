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
            default: 'pending',
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        otp: {
            type: String,
        },
        otpExpires: {
            type: Date,
        },
        profileImageURL: { type: String, default: '' },

        // ── Brand-specific fields ──
        companyName: { type: String },          // brand display name
        brandName: { type: String },            // formal brand/company name
        officialEmail: { type: String },        // brand contact email
        contactPersonName: { type: String },    // person managing the account
        industry: { type: String },
        website: { type: String },              // legacy
        companyWebsite: { type: String },       // formal website URL
        companyCountry: { type: String },       // country of company
        budgetRange: { type: String },          // legacy
        brandGoal: { type: String },            // brand campaign goal (max 150 words)
        brandNiche: { type: String },
        approxBudgetUSD: { type: Number },
        brandInstagramHandle: { type: String }, // optional brand IG handle

        // ── Influencer basic fields ──
        fullName: { type: String },
        age: { type: Number },
        country: { type: String },              // country of residence
        city: { type: String },                 // city (optional)
        contactEmail: { type: String },
        niche: {
            type: String,
            enum: [
                'Fashion', 'Food', 'Fitness', 'Tech', 'Travel', 'Beauty',
                'Gaming', 'Lifestyle', 'Parenting', 'Education', 'Business',
                'Health', 'Entertainment', 'Finance', 'Other'
            ],
        },
        bio: { type: String },                  // legacy
        shortBio: { type: String },             // canonical short bio (max 100 words)

        // ── Influencer Instagram fields ──
        instagramUsername: { type: String },
        instagramProfileURL: { type: String },
        instagramDPURL: { type: String },
        instagramUserId: { type: String },      // Meta user ID
        accountType: { type: String, enum: ['Creator', 'Business', 'PERSONAL', 'CREATOR', 'BUSINESS'] },
        followers: { type: Number, default: 0 },
        followsCount: { type: Number, default: 0 },
        mediaCount: { type: Number, default: 0 },
        engagementRate: { type: Number, default: 0 },
        avgLikes: { type: Number, default: 0 },
        avgComments: { type: Number, default: 0 },
        instagramConnected: { type: Boolean, default: false },
        lastSyncedAt: { type: Date },           // last successful Instagram sync

        // ── Influencer pricing ──
        avgPostCostUSD: { type: Number, default: 0 },
        avgReelCostUSD: { type: Number, default: 0 },

        // ── Profile completion ──
        profileCompletionStatus: { type: Boolean, default: false },

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
