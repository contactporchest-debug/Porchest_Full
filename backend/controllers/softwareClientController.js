const SoftwareClientProfile = require('../models/SoftwareClientProfile');

async function getProfileForUser(userId) {
    return SoftwareClientProfile.findOne({ userId }).lean();
}

exports.getDashboard = async (req, res, next) => {
    try {
        const profile = await getProfileForUser(req.user._id);
        if (!profile) {
            return res.status(404).json({ success: false, message: 'Software client profile not found' });
        }

        const activeProject = profile.activeProject || profile.projects?.[0] || null;

        res.json({
            success: true,
            dashboard: {
                profile: req.user,
                clientProfile: {
                    fullName: profile.fullName,
                    companyName: profile.companyName,
                    roleTitle: profile.roleTitle,
                    avatarUrl: profile.avatarUrl,
                    industry: profile.industry,
                    teamSize: profile.teamSize,
                    companyStage: profile.companyStage,
                },
                overview: profile.overview,
                activeProject,
                totals: {
                    totalProjects: profile.projects?.length || 0,
                    completedMilestones: activeProject?.milestones?.filter((item) => item.status === 'completed').length || 0,
                    remainingMilestones: activeProject?.milestones?.filter((item) => item.status !== 'completed').length || 0,
                    totalRequirements: activeProject?.requirements?.length || profile.currentRequirements?.length || 0,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

exports.getProfile = async (req, res, next) => {
    try {
        const profile = await getProfileForUser(req.user._id);
        if (!profile) {
            return res.status(404).json({ success: false, message: 'Software client profile not found' });
        }

        res.json({ success: true, profile });
    } catch (error) {
        next(error);
    }
};

exports.getProjects = async (req, res, next) => {
    try {
        const profile = await getProfileForUser(req.user._id);
        if (!profile) {
            return res.status(404).json({ success: false, message: 'Software client profile not found' });
        }

        res.json({
            success: true,
            projects: profile.projects || [],
            activeProject: profile.activeProject || profile.projects?.[0] || null,
            requirements: profile.currentRequirements || [],
        });
    } catch (error) {
        next(error);
    }
};
