'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Building2, Star, ArrowRight, CheckCircle2 } from 'lucide-react';

const roleCards = [
    {
        icon: Building2,
        role: 'Brand',
        href: '/signup/brand',
        tagline: 'Scale with clarity',
        desc: 'Create campaigns, match with creators, and manage every collaboration from one place.',
        perks: ['Influencer discovery', 'Campaign coordination', 'Live request tracking'],
        tint: 'rgba(194,52,10,0.10)',
        iconColor: '#C2340A',
    },
    {
        icon: Star,
        role: 'Influencer',
        href: '/signup/influencer',
        tagline: 'Monetize with confidence',
        desc: 'Receive brand requests, showcase your profile, and keep your collaborations organized.',
        perks: ['Brand request inbox', 'Profile visibility', 'Collaboration workflow'],
        tint: 'rgba(255,107,26,0.10)',
        iconColor: '#E8400A',
    },
];

export default function SignupPage() {
    return (
        <main style={{ minHeight: '100vh', background: '#FDF6EE', padding: '40px 16px' }}>
            <div style={{ maxWidth: '960px', margin: '0 auto' }}>
                {/* Logo */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '36px' }}>
                    <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none', padding: '10px 20px', borderRadius: '999px', background: 'rgba(255,255,255,0.60)', border: '1px solid #EDD9BC' }}>
                        <Image src="/porchest-logo.png" alt="Porchest" width={26} height={26} style={{ borderRadius: '5px', objectFit: 'contain' }} />
                        <span style={{ fontSize: '15px', fontWeight: 600, color: '#1A0A00' }}>Porchest</span>
                    </Link>
                </div>

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <span style={{ display: 'inline-block', padding: '4px 14px', borderRadius: '999px', background: '#FFE5CC', color: '#C2340A', fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em', marginBottom: '14px' }}>Create account</span>
                    <h1 style={{ fontSize: 'clamp(28px,5vw,40px)', fontWeight: 700, color: '#1A0A00', letterSpacing: '-0.02em', marginBottom: '12px' }}>Choose how you want to join</h1>
                    <p style={{ fontSize: '14px', color: '#7A5030', lineHeight: 1.65, maxWidth: '480px', margin: '0 auto' }}>
                        Porchest gives brands and influencers tailored workflows. Pick the role that fits.
                    </p>
                </motion.div>

                {/* Cards */}
                <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                    {roleCards.map((card, index) => (
                        <motion.div key={card.role} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}>
                            <Link href={card.href} style={{
                                display: 'block',
                                padding: '28px',
                                borderRadius: '14px',
                                border: '1px solid rgba(255,255,255,0.65)',
                                background: 'rgba(255,255,255,0.35)',
                                backdropFilter: 'blur(12px)',
                                textDecoration: 'none',
                                transition: 'all 0.15s',
                                boxShadow: '0 2px 16px rgba(26,10,0,0.06)',
                            }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(26,10,0,0.10)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 16px rgba(26,10,0,0.06)'; }}
                            >
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: card.tint, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                                    <card.icon size={22} style={{ color: card.iconColor }} />
                                </div>

                                <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '999px', background: '#FFE5CC', color: '#C2340A', fontSize: '10px', fontWeight: 500, letterSpacing: '0.06em', marginBottom: '12px' }}>
                                    {card.tagline}
                                </span>

                                <h2 style={{ fontSize: '22px', fontWeight: 600, color: '#1A0A00', marginBottom: '10px', letterSpacing: '-0.01em' }}>I&apos;m a {card.role}</h2>
                                <p style={{ fontSize: '14px', color: '#7A5030', lineHeight: 1.65, marginBottom: '24px' }}>{card.desc}</p>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                                    {card.perks.map(perk => (
                                        <div key={perk} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#7A5030' }}>
                                            <CheckCircle2 size={15} style={{ color: card.iconColor, flexShrink: 0 }} />
                                            {perk}
                                        </div>
                                    ))}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #EDD9BC', paddingTop: '18px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#C2340A' }}>Get started</span>
                                    <ArrowRight size={15} style={{ color: '#C2340A' }} />
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                <p style={{ marginTop: '28px', textAlign: 'center', fontSize: '14px', color: '#7A5030' }}>
                    Already have an account?{' '}
                    <Link href="/login" style={{ color: '#C2340A', fontWeight: 500, textDecoration: 'none' }}>Sign in</Link>
                </p>
            </div>
        </main>
    );
}
