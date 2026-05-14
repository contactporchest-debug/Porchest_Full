const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED_LOGIN_ATTEMPTS = 5;

const getWindowStart = (date = new Date()) => {
    return new Date(date.getTime() - LOGIN_WINDOW_MS);
};

const isLoginLocked = (user, now = new Date()) => {
    if (!user?.lockUntil) return false;
    return new Date(user.lockUntil).getTime() > now.getTime();
};

const getRemainingLockMs = (user, now = new Date()) => {
    if (!user?.lockUntil) return 0;
    return Math.max(0, new Date(user.lockUntil).getTime() - now.getTime());
};

const registerFailedLoginAttempt = (user, now = new Date()) => {
    const firstFailedLoginAt = user.firstFailedLoginAt ? new Date(user.firstFailedLoginAt) : null;
    const windowExpired = !firstFailedLoginAt || firstFailedLoginAt.getTime() < getWindowStart(now).getTime();

    if (windowExpired) {
        user.failedLoginAttempts = 1;
        user.firstFailedLoginAt = now;
        user.lockUntil = undefined;
        return { locked: false, attempts: user.failedLoginAttempts };
    }

    user.failedLoginAttempts = (Number(user.failedLoginAttempts) || 0) + 1;

    if (user.failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
        user.lockUntil = new Date(now.getTime() + LOGIN_WINDOW_MS);
        user.failedLoginAttempts = MAX_FAILED_LOGIN_ATTEMPTS;
        return { locked: true, attempts: user.failedLoginAttempts };
    }

    return { locked: false, attempts: user.failedLoginAttempts };
};

const resetLoginProtection = (user) => {
    user.failedLoginAttempts = 0;
    user.firstFailedLoginAt = undefined;
    user.lockUntil = undefined;
};

module.exports = {
    LOGIN_WINDOW_MS,
    MAX_FAILED_LOGIN_ATTEMPTS,
    getRemainingLockMs,
    isLoginLocked,
    registerFailedLoginAttempt,
    resetLoginProtection,
};
