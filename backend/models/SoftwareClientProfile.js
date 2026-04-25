const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
    title: { type: String, required: true },
    status: { type: String, enum: ['completed', 'in_progress', 'up_next'], default: 'up_next' },
    dueDate: { type: Date },
    summary: { type: String },
}, { _id: false });

const projectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    status: { type: String, required: true },
    phase: { type: String, required: true },
    description: { type: String, required: true },
    startDate: { type: Date },
    deadline: { type: Date },
    progress: { type: Number, default: 0 },
    budgetUsd: { type: Number },
    requirements: [{ type: String }],
    deliverables: [{ type: String }],
    notes: { type: String },
    milestones: [milestoneSchema],
}, { _id: false });

const softwareClientProfileSchema = new mongoose.Schema({
    softwareClientProfileId: { type: String, unique: true, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
    fullName: { type: String, required: true },
    companyName: { type: String, required: true },
    roleTitle: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    country: { type: String, required: true },
    city: { type: String, required: true },
    avatarUrl: { type: String, required: true },
    clientSince: { type: Date, required: true },
    preferredContact: { type: String, required: true },
    workingHours: { type: String, required: true },
    companyWebsite: { type: String, required: true },
    companyStage: { type: String, required: true },
    industry: { type: String, required: true },
    teamSize: { type: String, required: true },
    overview: {
        projectName: { type: String, required: true },
        currentStatus: { type: String, required: true },
        simpleDescription: { type: String, required: true },
        deadline: { type: Date, required: true },
        nextProjectProposal: { type: String, required: true },
        currentPhase: { type: String, required: true },
        completionPercent: { type: Number, default: 0 },
    },
    currentRequirements: [{ type: String }],
    productGoals: [{ type: String }],
    technologyScope: [{ type: String }],
    deliverablesSummary: [{ type: String }],
    activeProject: projectSchema,
    projects: [projectSchema],
}, { timestamps: true });

softwareClientProfileSchema.index({ userId: 1 });

module.exports = mongoose.model('SoftwareClientProfile', softwareClientProfileSchema);
