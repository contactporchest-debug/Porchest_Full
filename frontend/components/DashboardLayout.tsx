'use client';

import { ReactNode } from 'react';
import DashboardShell from './layout/DashboardShell';
import { useAuth } from '@/context/AuthContext';
import { resolveDashboardRole } from '@/lib/accessRoles';

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    if (!user) return null;
    const role = resolveDashboardRole(user.role) as 'influencer' | 'brand' | 'admin' | 'software-client';
    return <DashboardShell role={role}>{children}</DashboardShell>;
}
