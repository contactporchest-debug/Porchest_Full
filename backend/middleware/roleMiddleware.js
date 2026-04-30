const { ADMIN_ROLES } = require('../utils/accessRoles');

const roleMiddleware = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }
        const allowedRoles = roles.flatMap((role) => (role === 'admin' ? ADMIN_ROLES : role));
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role(s): ${roles.join(', ')}`,
            });
        }
        next();
    };
};

module.exports = roleMiddleware;
