'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Building2, Star, ArrowRight, Zap } from 'lucide-react';

export default function SignupPage() {
    return (
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#050505', position: 'relative' }}>
            <div className="neon-grid" />
            <div className="edge-glow" />
            <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '500px', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(123,63,242,0.15) 0%, transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />

            <div style={{ width: '100%', maxWidth: '640px', position: 'relative', zIndex: 1 }}>
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', marginBottom: '24px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #7B3FF2, #A855F7)', boxShadow: '0 0 24px rgba(123,63,242,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '18px', color: '#fff' }}>P</div>
                        <span style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '20px', color: '#fff', letterSpacing: '-0.02em' }}>
                            Por<span style={{ background: 'linear-gradient(90deg, #7B3FF2, #A855F7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>chest</span>
                        </span>
                    </Link>
                    <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '32px', letterSpacing: '-0.03em', color: '#fff', marginBottom: '10px' }}>
                        Join Porchest
                    </h1>
                    <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.5' }}>
                        Choose your role to get started
                    </p>
                </motion.div>

                {/* Role cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                    {[
                        {
                            icon: <Building2 size={32} />, role: 'Brand', color: '#7B3FF2', href: '/signup/brand',
                            tagline: 'Scale with AI',
                            desc: 'Create campaigns, discover AI-matched influencers, and track ROI in real-time.',
                            perks: ['AI influencer matching', 'Campaign analytics', 'Direct messaging'],
                            delay: 0,
                        },
                        {
                            icon: <Star size={32} />, role: 'Influencer', color: '#A855F7', href: '/signup/influencer',
                            tagline: 'Monetize faster',
                            desc: 'Browse brand campaigns, apply to collabs, and manage your earnings.',
                            perks: ['Browse live campaigns', 'Earnings tracking', 'Brand messaging'],
                            delay: 0.1,
                        },
                    ].map((card) => (
                        <motion.div key={card.role} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: card.delay, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}>
                            <Link href={card.href} style={{ textDecoration: 'none', display: 'block' }}>
                                <div className="glass-card" style={{
                                    padding: '36px 30px', borderRadius: '32px', cursor: 'pointer',
                                    transition: 'all 250ms cubic-bezier(0.23, 1, 0.32, 1)',
                                    border: `1px solid ${card.color}20`,
                                }}
                                    onMouseEnter={(e) => {
                                        (e.currentTarget as HTMLElement).style.border = `1px solid ${card.color}45`;
                                        (e.currentTarget as HTMLElement).style.boxShadow = `0 0 80px ${card.color}20, 0 0 160px ${card.color}08`;
                                    }}
                                    onMouseLeave={(e) => {
                                        (e.currentTarget as HTMLElement).style.border = `1px solid ${card.color}20`;
                                        (e.currentTarget as HTMLElement).style.boxShadow = '';
                                    }}>
                                    {/* Icon */}
                                    <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: `${card.color}15`, border: `1px solid ${card.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color, marginBottom: '24px', boxShadow: `0 0 30px ${card.color}25` }}>
                                        {card.icon}
                                    </div>
                                    <div style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: '6px', background: `${card.color}12`, border: `1px solid ${card.color}25`, fontSize: '11px', fontWeight: '700', color: card.color, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '12px' }}>
                                        {card.tagline}
                                    </div>
                                    <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '22px', color: '#fff', letterSpacing: '-0.02em', marginBottom: '12px' }}>
                                        I&apos;m a {card.role}
                                    </h2>
                                    <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.6', marginBottom: '20px' }}>{card.desc}</p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px' }}>
                                        {card.perks.map((p) => (
                                            <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>
                                                <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: `${card.color}15`, border: `1px solid ${card.color}25`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <Zap size={9} style={{ color: card.color }} />
                                                </span>
                                                {p}
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '600', color: card.color }}>
                                        Get Started <ArrowRight size={14} />
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                <p style={{ textAlign: 'center', marginTop: '28px', fontSize: '14px', color: 'rgba(255,255,255,0.3)' }}>
                    Already have an account?{' '}
                    <Link href="/login" style={{ color: '#a78bfa', fontWeight: '600', textDecoration: 'none' }}>Sign in →</Link>
                </p>
            </div>
        </main>
    );
}
