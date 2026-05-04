'use client';

import { ReactNode, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { Menu, X } from 'lucide-react';
import { useApi } from '@/hooks/useApi';

export default function DashboardShell({
    children,
    role,
}: {
    children: ReactNode;
    role: 'influencer' | 'brand' | 'admin' | 'software-client';
}) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const { data: brandProfile, refetch: refetchBrandProfile } = useApi('/profile/brand/me', { immediate: role === 'brand' });
    const brandLogo = role === 'brand' ? (brandProfile?.logo || brandProfile?.logoUrl || '') : '';
    const brandName = role === 'brand' ? (brandProfile?.businessName || brandProfile?.brandName || '') : '';

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

            {/* Right column */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {/* Mobile header */}
                <div
                    className="lg:hidden"
                    style={{
                        height: '60px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 16px',
                        borderBottom: '1px solid #EDD9BC',
                        background: 'rgba(253,246,238,0.85)',
                        backdropFilter: 'blur(12px)',
                        flexShrink: 0,
                    }}
                >
                    <button
                        onClick={() => setMobileOpen(v => !v)}
                        style={{
                            width: '38px', height: '38px',
                            borderRadius: '8px',
                            border: '1px solid #EDD9BC',
                            background: 'rgba(255,255,255,0.60)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#7A5030',
                        }}
                    >
                        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
                    </button>

                    <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                        {role === 'brand' && brandLogo ? (
                            <img src={brandLogo} alt={brandName || 'Brand logo'} style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #EDD9BC' }} />
                        ) : (
                            <Image src="/porchest-logo.png" alt="Porchest" width={28} height={28} style={{ borderRadius: '5px', objectFit: 'contain' }} />
                        )}
                        <span style={{ fontSize: '16px', fontWeight: 600, color: '#1A0A00' }}>{role === 'brand' && brandName ? brandName : 'Porchest'}</span>
                    </Link>

                    <div style={{ width: '38px' }} />
                </div>

                {/* Desktop topbar */}
                <div className="hidden lg:block">
                    <TopBar role={role} brandLogo={brandLogo} brandName={brandName} />
                </div>

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
        </div>
    );
}
