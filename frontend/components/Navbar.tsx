'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronRight } from 'lucide-react';

export function Logo() {
    return (
        <Link href="/" className="flex items-center gap-3" style={{ textDecoration: 'none' }}>
            <Image
                src="/porchest-logo.png"
                alt="Porchest"
                width={156}
                height={38}
                style={{ width: '156px', height: 'auto', objectFit: 'contain' }}
            />
        </Link>
    );
}

const navLinks = [
    { label: 'How it Works', href: '#how' },
    { label: 'Smart Matching', href: '#ai' },
    { label: 'For Brands', href: '#brands' },
    { label: 'For Influencers', href: '#influencers' },
];

type BrandProfileResponse = {
    logo?: string;
    logoUrl?: string;
    businessName?: string;
    brandName?: string;
};

export default function Navbar() {
    const { user, logout } = useAuth();
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const { data: brandProfile, refetch: refetchBrandProfile } = useApi<BrandProfileResponse>('/profile/brand/me', { immediate: Boolean(user?.role === 'brand') });
    const brandProfileData = brandProfile;

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        if (user?.role !== 'brand') return;

        const handleBrandProfileUpdated = () => {
            void refetchBrandProfile();
        };

        window.addEventListener('porchest-brand-profile-updated', handleBrandProfileUpdated as EventListener);
        return () => window.removeEventListener('porchest-brand-profile-updated', handleBrandProfileUpdated as EventListener);
    }, [refetchBrandProfile, user?.role]);

    const dashboardHref = user ? `/dashboard/${user.role}` : '/login';
    const roleLabel = user ? (user.companyName || user.fullName || user.email.split('@')[0]) : null;
    const brandLogo = user?.role === 'brand' ? (brandProfileData?.logo || brandProfileData?.logoUrl || '') : '';
    const brandName = user?.role === 'brand' ? (brandProfileData?.businessName || brandProfileData?.brandName || roleLabel || '') : '';

    return (
        <>
            <motion.nav
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                style={{
                    position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
                    zIndex: 1000, width: 'calc(100% - 48px)', maxWidth: '1100px',
                    background: scrolled ? 'rgba(255,251,244,0.92)' : 'rgba(255,251,244,0.78)',
                    backdropFilter: 'blur(30px)',
                    border: '1px solid rgba(17,19,24,0.10)',
                    borderRadius: '20px',
                    boxShadow: scrolled ? '0 0 60px rgba(155,111,80,0.10), 0 20px 60px rgba(17,19,24,0.10)' : '0 0 40px rgba(155,111,80,0.06)',
                    padding: '12px 20px',
                    transition: 'all 300ms ease',
                }}
            >
                <div className="flex items-center justify-between gap-6">
                    <Logo />

                    {/* Desktop links */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map((l) => (
                            <a key={l.label} href={l.href}
                                style={{
                                    padding: '6px 16px', borderRadius: '99px',
                                    fontSize: '13.5px', fontWeight: '500',
                                    color: '#6e665d',
                                    textDecoration: 'none', transition: 'all 200ms ease',
                                    display: 'block',
                                }}
                                onMouseEnter={(e) => { (e.target as HTMLElement).style.color = '#111318'; (e.target as HTMLElement).style.background = 'rgba(17,19,24,0.04)'; }}
                                onMouseLeave={(e) => { (e.target as HTMLElement).style.color = '#6e665d'; (e.target as HTMLElement).style.background = 'transparent'; }}>
                                {l.label}
                            </a>
                        ))}
                    </div>

                    {/* Desktop CTAs */}
                    <div className="hidden md:flex items-center gap-3">
                        {user ? (
                            <>
                                <Link href={dashboardHref} className="outline-btn" style={{ fontSize: '13.5px', padding: '8px 20px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                    {brandLogo ? (
                                        <img src={brandLogo} alt={brandName || 'Brand logo'} style={{ width: '18px', height: '18px', borderRadius: '4px', objectFit: 'cover', border: '1px solid rgba(17,19,24,0.12)' }} />
                                    ) : null}
                                    {user?.role === 'brand' && brandName ? brandName : roleLabel}
                                </Link>
                                <button onClick={logout} className="outline-btn" style={{ fontSize: '13.5px', padding: '8px 20px', cursor: 'pointer' }}>
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <>
                                <Link href="/login" className="outline-btn" style={{ fontSize: '13.5px', padding: '8px 20px' }}>
                                    Sign In
                                </Link>
                                <Link href="/signup" className="glow-btn" style={{ fontSize: '13.5px', padding: '9px 22px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    Get Started <ChevronRight size={14} />
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile toggle */}
                    <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}
                        style={{ background: 'rgba(17,19,24,0.04)', border: '1px solid rgba(17,19,24,0.10)', borderRadius: '10px', padding: '8px', color: '#111318', cursor: 'pointer' }}>
                        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
                    </button>
                </div>

                {/* Mobile menu */}
                <AnimatePresence>
                    {mobileOpen && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            className="md:hidden" style={{ overflow: 'hidden', marginTop: '12px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingBottom: '8px' }}>
                                {navLinks.map((l) => (
                                    <a key={l.label} href={l.href} onClick={() => setMobileOpen(false)}
                                        style={{ padding: '10px 16px', borderRadius: '12px', fontSize: '14px', fontWeight: '500', color: '#6e665d', textDecoration: 'none', background: 'rgba(17,19,24,0.03)' }}>
                                        {l.label}
                                    </a>
                                ))}
                                <div className="flex gap-2 mt-2">
                                <Link href="/login" className="outline-btn" style={{ flex: 1, fontSize: '13px', padding: '10px' }}>Sign In</Link>
                                    <Link href="/signup" className="glow-btn" style={{ flex: 1, fontSize: '13px', padding: '10px' }}>Get Started</Link>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.nav>

            {/* Spacer to offset floating navbar */}
            <div style={{ height: '90px' }} />
        </>
    );
}
