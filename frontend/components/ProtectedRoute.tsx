'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { isAdminRole } from '@/lib/accessRoles';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const allowed = useMemo(
        () => allowedRoles
            ? allowedRoles.flatMap((role) => (role === 'admin' ? ['admin', 'admin-marketing', 'admin-software', 'employee-marketing', 'employee-software', 'owner'] : role))
            : null,
        [allowedRoles]
    );

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.replace('/login');
                return;
            }
            if (allowed && !allowed.includes(user.role)) {
                router.replace(isAdminRole(user.role) ? '/dashboard/admin' : `/dashboard/${user.role}`);
            }
        }
    }, [user, loading, router, allowed]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #fcfaf4 0%, #f4efe4 100%)' }}>
                <div className="flex flex-col items-center gap-4">
                    <div className="spinner" />
                    <p style={{ color: '#667085', fontSize: '14px' }}>Loading Porchest...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;
    if (allowed && !allowed.includes(user.role)) return null;

    return <>{children}</>;
}
