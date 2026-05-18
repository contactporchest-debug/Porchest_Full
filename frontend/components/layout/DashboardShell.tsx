'use client';

import { ReactNode, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { Menu, X } from 'lucide-react';
import { useApi } from '@/hooks/useApi';

type BrandProfileResponse = {
    logo?: string;
    logoUrl?: string;
    businessName?: string;
    brandName?: string;
};

export default function DashboardShell({
    children,
    role,
}: {
    children: ReactNode;
    role: 'influencer' | 'brand' | 'admin' | 'software-client';
}) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const { data: brandProfile, refetch: refetchBrandProfile } = useApi<BrandProfileResponse>('/profile/brand/me', { immediate: role === 'brand' });
    const brandProfileData = brandProfile;
    const brandLogo = role === 'brand' ? (brandProfileData?.logo || brandProfileData?.logoUrl || '') : '';
    const brandName = role === 'brand' ? (brandProfileData?.businessName || brandProfileData?.brandName || '') : '';

    useEffect(() => {
        if (role !== 'brand') return;

        const handleBrandProfileUpdated = () => {
            void refetchBrandProfile();
        };

        window.addEventListener('porchest-brand-profile-updated', handleBrandProfileUpdated as EventListener);
        return () => window.removeEventListener('porchest-brand-profile-updated', handleBrandProfileUpdated as EventListener);
    }, [refetchBrandProfile, role]);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#FDF6EE' }}>
            {/* Desktop sidebar */}
            <div className="hidden lg:flex" style={{ flexShrink: 0 }}>
                <Sidebar role={role} brandLogo={brandLogo} brandName={brandName} />
            </div>

            {/* Mobile sidebar overlay */}
            {mobileOpen && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 50,
                        background: 'rgba(26,10,0,0.35)',
                        backdropFilter: 'blur(4px)',
                    }}
                    onClick={() => setMobileOpen(false)}
                >
                    <div onClick={e => e.stopPropagation()}>
                        <Sidebar role={role} mobileOpen brandLogo={brandLogo} brandName={brandName} onNavigate={() => setMobileOpen(false)} />
                    </div>
                </div>
            )}


            {/* Main content */}
            <main style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px',
                background: '#FDF6EE',
            }}>
                {children}
            </main>
        </div>
    );
}
