'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronRight } from 'lucide-react';

export function Logo() {
    return (
        <Link href="/" className="flex items-center gap-3" style={{ textDecoration: 'none' }}>
            <div style={{
                width: '38px', height: '38px', borderRadius: '12px',
                background: 'linear-gradient(135deg, #7B3FF2, #A855F7)',
                boxShadow: '0 0 20px rgba(123,63,242,0.5), 0 0 40px rgba(123,63,242,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '18px', color: '#fff',
                flexShrink: 0,
            }}>P</div>
            <span style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '19px', color: '#fff', letterSpacing: '-0.02em' }}>
                Por<span style={{ background: 'linear-gradient(90deg, #7B3FF2, #A855F7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>chest</span>
            </span>
        </Link>
    );
}

const navLinks = [
    { label: 'How it Works', href: '#how' },
    { label: 'AI Matching', href: '#ai' },
    { label: 'For Brands', href: '#brands' },
    { label: 'For Influencers', href: '#influencers' },
];

export default function Navbar() {
    const { user, logout } = useAuth();
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const dashboardHref = user ? `/dashboard/${user.role}` : '/login';
    const roleLabel = user ? (user.companyName || user.fullName || user.email.split('@')[0]) : null;

    return (
        <>
            <motion.nav
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                style={{
                    position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
                    zIndex: 1000, width: 'calc(100% - 48px)', maxWidth: '1100px',
                    background: scrolled ? 'rgba(10,10,16,0.85)' : 'rgba(10,10,16,0.6)',
                    backdropFilter: 'blur(30px)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '20px',
                    boxShadow: scrolled ? '0 0 60px rgba(123,63,242,0.12), 0 20px 60px rgba(0,0,0,0.5)' : '0 0 40px rgba(123,63,242,0.08)',
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
                                    color: 'rgba(255,255,255,0.55)',
                                    textDecoration: 'none', transition: 'all 200ms ease',
                                    display: 'block',
                                }}
                                onMouseEnter={(e) => { (e.target as HTMLElement).style.color = '#fff'; (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
                                onMouseLeave={(e) => { (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.55)'; (e.target as HTMLElement).style.background = 'transparent'; }}>
                                {l.label}
                            </a>
                        ))}
                    </div>

                    {/* Desktop CTAs */}
                    <div className="hidden md:flex items-center gap-3">
                        {user ? (
                            <>
                                <Link href={dashboardHref} className="outline-btn" style={{ fontSize: '13.5px', padding: '8px 20px' }}>
                                    {roleLabel}
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
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '8px', color: '#fff', cursor: 'pointer' }}>
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
                                        style={{ padding: '10px 16px', borderRadius: '12px', fontSize: '14px', fontWeight: '500', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', background: 'rgba(255,255,255,0.04)' }}>
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
