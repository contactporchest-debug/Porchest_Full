export const ADMIN_ROLES = [
    'admin-marketing',
    'admin-software',
    'employee-marketing',
    'employee-software',
    'owner',
] as const;

export const USER_ROLES = [
    ...ADMIN_ROLES,
    'brand',
    'influencer',
    'software-client',
] as const;

export type UserRole = typeof USER_ROLES[number];

export const isAdminRole = (role: string | null | undefined): boolean =>
    !!role && (role === 'admin' || (ADMIN_ROLES as readonly string[]).includes(role));

export const resolveDashboardRole = (role: string | null | undefined): string =>
    isAdminRole(role) ? 'admin' : (role || 'brand');
