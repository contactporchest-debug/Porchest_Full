const mongoose = require('mongoose');

const verificationSubmissionSchema = new mongoose.Schema(
    {
        campaignRequestId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CampaignRequest',
            required: true,
        },
        influencerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        brandId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

        postUrl: { type: String, required: true, trim: true },

        status: {
            type: String,
            enum: ['pending', 'verified', 'rejected'],
            default: 'pending',
        },
        adminNote: { type: String },
        verifiedAt: { type: Date },

        // Populated after verification (placeholder until Meta API)
        performance: {
            views: { type: Number, default: 0 },
            likes: { type: Number, default: 0 },
            comments: { type: Number, default: 0 },
            shares: { type: Number, default: 0 },
            saves: { type: Number, default: 0 },
            engagementRate: { type: Number, default: 0 },
            reach: { type: Number, default: 0 },
            impressions: { type: Number, default: 0 },
        },
    },
    { timestamps: true }
);

verificationSubmissionSchema.index({ campaignRequestId: 1 });
verificationSubmissionSchema.index({ influencerId: 1, status: 1 });
verificationSubmissionSchema.index({ brandId: 1, status: 1 });

module.exports = mongoose.model('VerificationSubmission', verificationSubmissionSchema);
