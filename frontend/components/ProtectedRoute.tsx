'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: ('admin' | 'brand' | 'influencer' | 'software-client')[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.replace('/login');
                return;
            }
            if (allowedRoles && !allowedRoles.includes(user.role)) {
                router.replace(`/dashboard/${user.role}`);
            }
        }
    }, [user, loading, router, allowedRoles]);

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
    if (allowedRoles && !allowedRoles.includes(user.role)) return null;

    return <>{children}</>;
}
