const ADMIN_ROLES = [
    'admin-marketing',
    'admin-software',
    'employee-marketing',
    'employee-software',
    'owner',
];

const USER_ROLES = [
    ...ADMIN_ROLES,
    'brand',
    'influencer',
    'software-client',
];

const PUBLIC_SIGNUP_ROLES = ['brand', 'influencer', 'software-client'];

function isAdminRole(role) {
    return ADMIN_ROLES.includes(role);
}

module.exports = {
    ADMIN_ROLES,
    USER_ROLES,
    PUBLIC_SIGNUP_ROLES,
    isAdminRole,
};
