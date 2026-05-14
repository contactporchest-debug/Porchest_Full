const securityHeaders = (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
};

const enforceHttps = (req, res, next) => {
    if (process.env.NODE_ENV !== 'production') {
        return next();
    }

    const forwardedProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
    const isSecure = req.secure || forwardedProto === 'https';

    if (!isSecure) {
        const host = req.headers.host;
        if (!host) {
            return res.status(400).json({ success: false, message: 'HTTPS required' });
        }

        return res.redirect(301, `https://${host}${req.originalUrl}`);
    }

    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    next();
};

module.exports = {
    enforceHttps,
    securityHeaders,
};
