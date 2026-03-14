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
        fullName: { type: String }, // optional, extracted during signup
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: { type: String }, // optional if using social login later
        status: {
            type: String,
            enum: ['pending', 'active', 'suspended'],
            default: 'active', // default active for now
        },
        isVerified: { type: Boolean, default: false },
        loginProvider: { type: String, default: 'local' }, // local, google, etc.
        profileCompletionStatus: { type: Boolean, default: false },
        lastLoginAt: { type: Date },
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
