const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        userCode: { type: String, unique: true, required: true },
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
        password: { type: String },
        status: {
            type: String,
            enum: ['pending', 'active', 'suspended'],
            default: 'active',
        },
        isVerified: { type: Boolean, default: false },
        loginProvider: { type: String, default: 'local' },
        profileCompletionStatus: { type: Boolean, default: false },
        instagramConnected: { type: Boolean, default: false },
        lastLoginAt: { type: Date },
        
        // Linkage fields for the profile-centric architecture
        influencerProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'InfluencerProfile' },
        brandProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'BrandProfile' },
        
        // Allowed auth/recovery
        otp: { type: String },
        otpExpires: { type: Date }
    },
    { timestamps: true }
);

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    if (!this.password || this.password.trim() === '') return next();
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    delete obj.otp;
    delete obj.otpExpires;
    return obj;
};

module.exports = mongoose.model('User', userSchema);
