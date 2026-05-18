const DAYS = 24 * 60 * 60 * 1000;

function toNumber(value, fallback = 0) {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
}

function normalizeString(value) {
    return String(value || '').trim();
}

function getProfilePicture(profile = {}) {
    return Boolean(
        profile.igProfileUrl
        || profile.instagramDPURL
        || profile.avatar
        || profile.profilePictureUrl
    );
}

function getFollowers(profile = {}) {
    return toNumber(profile.igFollowersCount ?? profile.followersCount ?? 0);
}

function getFollowing(profile = {}) {
    return toNumber(profile.igFollowingCount ?? profile.followingCount ?? 0);
}

function getMediaCount(profile = {}) {
    return toNumber(profile.igMediaCount ?? profile.mediaCount ?? profile.postsCount ?? 0);
}

function getEngagementPerPost(profile = {}) {
    const explicit = profile.avgEngagementPerPost
        ?? profile.averageEngagement
        ?? profile.totalEngagements;
    if (Number.isFinite(Number(explicit))) {
        return toNumber(explicit, 0);
    }
    return toNumber(profile.avgLikesPerPost ?? profile.avgLikes ?? 0)
        + toNumber(profile.avgCommentsPerPost ?? profile.avgComments ?? 0)
        + toNumber(profile.avgSharesPerPost ?? profile.avgShares ?? 0);
}

function getFirstPostAt(profile = {}) {
    const recent = Array.isArray(profile.recentMediaSummary) ? profile.recentMediaSummary : [];
    const timestamps = recent
        .map((item) => (item?.timestamp ? new Date(item.timestamp) : null))
        .filter((date) => date instanceof Date && !Number.isNaN(date.getTime()))
        .sort((a, b) => a.getTime() - b.getTime());
    return timestamps[0] || null;
}

function getAccountAgeDays(profile = {}, user = {}) {
    const firstPostAt = getFirstPostAt(profile);
    const baseDate = firstPostAt || (user?.createdAt ? new Date(user.createdAt) : null) || (profile?.createdAt ? new Date(profile.createdAt) : null);
    if (!baseDate || Number.isNaN(baseDate.getTime())) return null;
    return Math.max(0, Math.floor((Date.now() - baseDate.getTime()) / DAYS));
}

function isSuspiciousUsername(username = '') {
    const value = normalizeString(username).toLowerCase();
    if (!value) return true;
    const digitCount = (value.match(/\d/g) || []).length;
    const symbolCount = (value.match(/[._-]/g) || []).length;
    if (value.length >= 18 && digitCount >= 4) return true;
    if (digitCount >= 5) return true;
    if (symbolCount >= 4) return true;
    if (/^(?:[a-z]{1,3}\d{4,}|[a-z0-9]{14,})$/i.test(value)) return true;
    return false;
}

function deriveFraudLevel(score) {
    if (score >= 75) return 'high_risk';
    if (score >= 50) return 'suspicious';
    if (score >= 25) return 'review';
    return 'clean';
}

function scoreInfluencer(profile = {}, user = {}) {
    const flags = [];
    let score = 0;

    const followers = getFollowers(profile);
    const following = getFollowing(profile);
    const mediaCount = getMediaCount(profile);
    const profilePictureExists = getProfilePicture(profile);
    const engagementPerPost = getEngagementPerPost(profile);
    const engagementRatio = followers > 0 ? engagementPerPost / followers : 0;
    const ratio = following > 0 ? followers / following : followers > 0 ? 999 : 0;
    const accountAgeDays = getAccountAgeDays(profile, user);
    const username = profile.igUsername || profile.instagramUsername || user?.username || user?.email?.split('@')[0] || profile.username || '';

    if (!profilePictureExists) {
        score += 12;
        flags.push('No profile picture');
    }

    if (mediaCount < 3) {
        score += 15;
        flags.push('Very low post count');
    } else if (mediaCount < 10) {
        score += 8;
        flags.push('Low post count');
    }

    if (followers === 0 && following > 0) {
        score += 15;
        flags.push('No followers but following accounts');
    }

    if (following >= 200 && ratio < 0.2) {
        score += 18;
        flags.push('Weak follower/following ratio');
    } else if (following >= 500 && ratio < 0.1) {
        score += 24;
        flags.push('Very weak follower/following ratio');
    }

    if (typeof accountAgeDays === 'number') {
        if (accountAgeDays < 30) {
            score += 20;
            flags.push('Very new account');
        } else if (accountAgeDays < 90) {
            score += 12;
            flags.push('Recently created account');
        }
    }

    if (followers >= 500) {
        if (engagementRatio < 0.005) {
            score += 22;
            flags.push('Very low engagement');
        } else if (engagementRatio < 0.01) {
            score += 12;
            flags.push('Low engagement');
        }
    }

    if (isSuspiciousUsername(username)) {
        score += 10;
        flags.push('Suspicious username pattern');
    }

    if (followers >= 1000 && engagementPerPost <= 1) {
        score += 10;
        flags.push('Minimal engagement despite followers');
    }

    const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));
    const level = deriveFraudLevel(normalizedScore);

    return {
        score: normalizedScore,
        level,
        flags,
        details: {
            followers,
            following,
            followerFollowingRatio: following > 0 ? Number((followers / following).toFixed(4)) : null,
            mediaCount,
            profilePictureExists,
            engagementPerPost: Number(engagementPerPost.toFixed ? engagementPerPost.toFixed(2) : engagementPerPost),
            engagementRatio: Number(engagementRatio.toFixed(4)),
            accountAgeDays,
            username,
        },
    };
}

function mergeFraudRecord(user = {}, profile = {}) {
    const fraudDetection = profile.fraudDetection || {};
    const analysis = scoreInfluencer(profile, user);
    return {
        userId: String(user._id || ''),
        profileId: profile._id ? String(profile._id) : null,
        email: user.email || '',
        role: user.role || 'influencer',
        status: user.status || 'active',
        fullName: profile.displayName || profile.fullName || user.fullName || '',
        username: profile.igUsername || profile.instagramUsername || user.username || '',
        profilePictureUrl: profile.igProfileUrl || profile.avatar || profile.profilePictureUrl || '',
        followersCount: getFollowers(profile),
        followingCount: getFollowing(profile),
        mediaCount: getMediaCount(profile),
        createdAt: user.createdAt || profile.createdAt || null,
        profileComplete: Boolean(profile.profileComplete || profile.profileCompletionStatus),
        verified: Boolean(profile.verified || profile.isVerified),
        fraudDetection: {
            score: fraudDetection.score ?? analysis.score,
            level: fraudDetection.level ?? analysis.level,
            status: fraudDetection.status || 'clean',
            flags: Array.isArray(fraudDetection.flags) ? fraudDetection.flags : [],
            details: fraudDetection.details || null,
            analyzedAt: fraudDetection.analyzedAt || null,
            verificationRequestedAt: fraudDetection.verificationRequestedAt || null,
            flaggedAt: fraudDetection.flaggedAt || null,
            flagReason: fraudDetection.flagReason || '',
        },
        analysis,
    };
}

function getRiskLabel(score) {
    if (score >= 75) return 'high risk';
    if (score >= 50) return 'suspicious';
    if (score >= 25) return 'review';
    return 'clean';
}

module.exports = {
    getRiskLabel,
    mergeFraudRecord,
    scoreInfluencer,
};
