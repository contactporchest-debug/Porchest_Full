const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const asString = (value) => (typeof value === 'string' ? value.trim() : '');

const isStrongPassword = (value) => {
    if (typeof value !== 'string') return false;
    if (value.length < 8) return false;
    if (!/[a-z]/.test(value)) return false;
    if (!/[A-Z]/.test(value)) return false;
    if (!/[0-9]/.test(value)) return false;
    return true;
};

const createValidationError = (errors) => ({
    success: false,
    message: 'Validation failed',
    errors,
});

const validateAuthRequest = (type) => {
    return (req, res, next) => {
        const errors = [];
        const body = req.body || {};

        if (type === 'register') {
            const email = asString(body.email).toLowerCase();
            const password = typeof body.password === 'string' ? body.password : '';
            const role = asString(body.role).toLowerCase().replace(/[\s_]+/g, '-');

            if (!email || !EMAIL_REGEX.test(email)) {
                errors.push({ field: 'email', message: 'A valid email address is required' });
            }

            if (!role) {
                errors.push({ field: 'role', message: 'Role is required' });
            }

            if (!password) {
                errors.push({ field: 'password', message: 'Password is required' });
            } else if (!isStrongPassword(password)) {
                errors.push({
                    field: 'password',
                    message: 'Password must be at least 8 characters and include uppercase, lowercase, and a number',
                });
            }

            if (body.termsAccepted !== undefined && typeof body.termsAccepted !== 'boolean') {
                errors.push({ field: 'termsAccepted', message: 'termsAccepted must be true or false' });
            }
        }

        if (type === 'login') {
            const email = asString(body.email).toLowerCase();
            const password = typeof body.password === 'string' ? body.password : '';

            if (!email || !EMAIL_REGEX.test(email)) {
                errors.push({ field: 'email', message: 'A valid email address is required' });
            }

            if (!password) {
                errors.push({ field: 'password', message: 'Password is required' });
            }
        }

        if (type === 'verify-otp' || type === 'resend-otp') {
            const email = asString(body.email).toLowerCase();

            if (!email || !EMAIL_REGEX.test(email)) {
                errors.push({ field: 'email', message: 'A valid email address is required' });
            }
        }

        if (type === 'verify-otp') {
            const otp = asString(body.otp);
            if (!otp || !/^\d{6}$/.test(otp)) {
                errors.push({ field: 'otp', message: 'OTP must be a 6-digit code' });
            }
        }

        if (type === 'google') {
            const idToken = asString(body.idToken);
            if (!idToken) {
                errors.push({ field: 'idToken', message: 'Google ID token is required' });
            }
        }

        if (errors.length > 0) {
            return res.status(400).json(createValidationError(errors));
        }

        next();
    };
};

module.exports = {
    validateAuthRequest,
};
