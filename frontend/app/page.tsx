'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
    ArrowRight, Zap, BarChart3, MessageSquare, Shield, Users, Megaphone,
    Star, TrendingUp, Target, CheckCircle, Bot, Cpu, Eye, DollarSign, ChevronRight
} from 'lucide-react';

const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: (i: number = 0) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.09, duration: 0.55, ease: [0.23, 1, 0.32, 1] }
    }),
};

const stagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
};

// Section label pill
function SectionPill({ label, color = '#7B3FF2' }: { label: string; color?: string }) {
    return (
        <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '6px 16px', borderRadius: '99px',
            background: `${color}12`, border: `1px solid ${color}30`,
            fontSize: '12px', fontWeight: '600', letterSpacing: '0.06em',
            textTransform: 'uppercase', color, marginBottom: '20px',
        }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }} />
            {label}
        </div>
    );
}

// Metric stat card
function MetricCard({ value, label, delay }: { value: string; label: string; delay: number }) {
    return (
        <motion.div custom={delay} variants={fadeUp}
            className="glass-card text-center float-a"
            style={{ padding: '28px 24px', borderRadius: '24px' }}>
            <p style={{
                fontFamily: 'Space Grotesk', fontWeight: '800',
                fontSize: '2.4rem', letterSpacing: '-0.04em',
                background: 'linear-gradient(90deg, #7B3FF2, #A855F7)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                lineHeight: '1',
            }}>{value}</p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginTop: '8px', fontWeight: '500' }}>{label}</p>
        </motion.div>
    );
}

// How it works card
function HowCard({ icon, step, title, desc, delay, offset = 0 }: { icon: React.ReactNode; step: string; title: string; desc: string; delay: number; offset?: number }) {
    return (
        <motion.div custom={delay} variants={fadeUp}
            className="glass-card"
            style={{ padding: '36px 32px', borderRadius: '32px', transform: `translateY(${offset}px)` }}>
            <div style={{
                width: '52px', height: '52px', borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(123,63,242,0.25), rgba(168,85,247,0.1))',
                border: '1px solid rgba(123,63,242,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#a78bfa', marginBottom: '24px',
                boxShadow: '0 0 30px rgba(123,63,242,0.25)',
            }}>{icon}</div>
            <div style={{ fontSize: '11px', color: 'rgba(123,63,242,0.8)', fontWeight: '700', letterSpacing: '0.12em', marginBottom: '10px' }}>
                STEP {step}
            </div>
            <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '20px', color: '#fff', marginBottom: '12px', letterSpacing: '-0.02em' }}>{title}</h3>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.65' }}>{desc}</p>
        </motion.div>
    );
}

export default function LandingPage() {
    return (
        <main style={{ background: '#050505', minHeight: '100vh', overflow: 'hidden', position: 'relative' }}>
            {/* Global background layers */}
            <div className="neon-grid" />
            <div className="edge-glow" />

            <Navbar />

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ HERO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <section style={{ position: 'relative', minHeight: '90vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 24px 80px', overflow: 'hidden' }}>
                {/* Hero glow */}
                <div className="hero-glow" />
                {/* Secondary left/right orbs */}
                <div style={{ position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(123,63,242,0.08) 0%, transparent 70%)', top: '20%', left: '-10%', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)', bottom: '0', right: '-5%', pointerEvents: 'none' }} />

                <motion.div initial="hidden" animate="visible" variants={stagger} style={{ maxWidth: '780px', position: 'relative', zIndex: 1 }}>
                    {/* AI badge pill */}
                    <motion.div variants={fadeUp} style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '10px',
                            padding: '8px 20px', borderRadius: '99px',
                            background: 'rgba(123,63,242,0.1)',
                            border: '1px solid rgba(123,63,242,0.3)',
                            boxShadow: '0 0 30px rgba(123,63,242,0.15)',
                        }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#a78bfa', boxShadow: '0 0 10px #7B3FF2', animation: 'pulse-glow 2s ease-in-out infinite' }} />
                            <span style={{ fontSize: '13px', fontWeight: '600', color: '#a78bfa', letterSpacing: '0.04em' }}>
                                AI-Powered Influencer Platform
                            </span>
                            <Zap size={13} style={{ color: '#7B3FF2' }} />
                        </div>
                    </motion.div>

                    {/* Headline */}
                    <motion.h1 variants={fadeUp}
                        style={{
                            fontFamily: 'Space Grotesk', fontWeight: '800',
                            fontSize: 'clamp(2.8rem, 7vw, 5.5rem)',
                            letterSpacing: '-0.04em', lineHeight: '1.02',
                            color: '#fff', marginBottom: '28px',
                        }}>
                        Connect{' '}
                        <span style={{ background: 'linear-gradient(90deg, #7B3FF2, #A855F7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                            Brands
                        </span>
                        {' '}with<br />the Right{' '}
                        <span style={{ background: 'linear-gradient(90deg, #A855F7, #7B3FF2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                            Influencers
                        </span>
                    </motion.h1>

                    {/* Subheadline */}
                    <motion.p variants={fadeUp}
                        style={{ fontSize: 'clamp(1rem, 2.2vw, 1.2rem)', color: 'rgba(255,255,255,0.5)', maxWidth: '540px', margin: '0 auto 44px', lineHeight: '1.65', fontWeight: '400' }}>
                        Porchest uses{' '}
                        <span style={{ color: '#a78bfa', fontWeight: '500' }}>AI-driven matching</span>
                        {' '}to pair brands with perfect influencers — supercharged by live analytics and real-time messaging.
                    </motion.p>

                    {/* CTAs */}
                    <motion.div variants={fadeUp} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px', marginBottom: '72px' }}>
                        <Link href="/signup" className="glow-btn" style={{ fontSize: '15px', padding: '16px 36px', gap: '8px' }}>
                            Get Started Free <ArrowRight size={18} />
                        </Link>
                        <Link href="/login" className="outline-btn" style={{ fontSize: '15px', padding: '15px 32px' }}>
                            Sign In
                        </Link>
                    </motion.div>

                    {/* Stats row — staggered, floating */}
                    <motion.div variants={stagger} initial="hidden" animate="visible"
                        className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
                        {[
                            { value: '10K+', label: 'Creators', delay: 0 },
                            { value: '2K+', label: 'Brand Partners', delay: 1 },
                            { value: '98%', label: 'Match Quality', delay: 2 },
                            { value: '$4M+', label: 'Campaign Value', delay: 3 },
                        ].map((s) => <MetricCard key={s.label} {...s} />)}
                    </motion.div>
                </motion.div>
            </section>

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━ HOW IT WORKS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <section id="how" style={{ position: 'relative', padding: '120px 24px' }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: '72px' }}>
                        <SectionPill label="How It Works" />
                        <h2 className="section-title" style={{ color: '#fff', marginBottom: '16px' }}>
                            Launch in{' '}
                            <span style={{ background: 'linear-gradient(90deg, #7B3FF2, #A855F7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>3 Simple Steps</span>
                        </h2>
                        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '17px', maxWidth: '480px', margin: '0 auto', lineHeight: '1.6' }}>
                            From setup to live campaign in minutes. No complexity, just results.
                        </p>
                    </motion.div>

                    {/* Cards with anti-gravity vertical stagger */}
                    <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <HowCard delay={0} step="01" offset={0} icon={<Megaphone size={24} />}
                            title="Create Your Campaign" desc="Define your goals, budget, and target audience. Our AI instantly understands your brand identity." />
                        <HowCard delay={1} step="02" offset={24} icon={<Bot size={24} />}
                            title="AI Finds Your Match" desc="Our algorithm scores thousands of influencers across engagement, niche, and audience fit in real-time." />
                        <HowCard delay={2} step="03" offset={0} icon={<TrendingUp size={24} />}
                            title="Track & Scale" desc="Monitor performance live. Real-time analytics, ROI dashboards, and direct messaging — all in one place." />
                    </motion.div>
                </div>
            </section>

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ AI MATCHING ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <section id="ai" style={{ position: 'relative', padding: '80px 24px 120px' }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                        <div className="glass-card glass-card-xl" style={{ padding: '64px 56px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center' }}>
                            {/* Left */}
                            <div>
                                <SectionPill label="AI Engine" />
                                <h2 className="section-title" style={{ color: '#fff', marginBottom: '24px' }}>
                                    <span style={{ background: 'linear-gradient(90deg, #7B3FF2, #A855F7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Intelligence</span>
                                    <br />Behind the Match
                                </h2>
                                <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: '1.7', marginBottom: '32px', fontSize: '16px' }}>
                                    Our proprietary AI scores every creator across three weighted dimensions — surface only the most resonant partnerships.
                                </p>
                                {[
                                    { label: 'Engagement Rate', pct: 40, color: '#7B3FF2', desc: 'Real audience interaction quality' },
                                    { label: 'Niche Similarity', pct: 40, color: '#A855F7', desc: 'Content alignment with brand' },
                                    { label: 'Reach Score', pct: 20, color: '#60d5f8', desc: 'Log-weighted follower impact' },
                                ].map((s) => (
                                    <div key={s.label} style={{ marginBottom: '20px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <div>
                                                <span style={{ color: '#fff', fontWeight: '600', fontSize: '14px' }}>{s.label}</span>
                                                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginLeft: '8px' }}>{s.desc}</span>
                                            </div>
                                            <span style={{ color: s.color, fontWeight: '700', fontFamily: 'Space Grotesk' }}>{s.pct}%</span>
                                        </div>
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{ width: `${s.pct * 2.5}%`, background: `linear-gradient(90deg, ${s.color}90, ${s.color})`, boxShadow: `0 0 10px ${s.color}60` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Right: futuristic dashboard mockup */}
                            <div style={{ position: 'relative' }}>
                                <div className="float-b" style={{
                                    background: 'rgba(14,14,22,0.9)', borderRadius: '28px',
                                    border: '1px solid rgba(123,63,242,0.25)',
                                    padding: '28px',
                                    boxShadow: '0 0 80px rgba(123,63,242,0.2), 0 0 160px rgba(123,63,242,0.08)',
                                }}>
                                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontWeight: '600', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Cpu size={12} /> AI Match Engine
                                        </span>
                                        <span style={{ color: '#4ade80', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', display: 'inline-block', boxShadow: '0 0 8px #4ade80' }} />
                                            Live
                                        </span>
                                    </div>

                                    {[
                                        { name: 'Alex Rivera', niche: 'Tech', score: 94, followers: '125K' },
                                        { name: 'Sarah Chen', niche: 'Fashion', score: 88, followers: '280K' },
                                        { name: 'Marcus J.', niche: 'Fitness', score: 82, followers: '520K' },
                                    ].map((inf, i) => (
                                        <div key={inf.name} style={{
                                            display: 'flex', alignItems: 'center', gap: '12px',
                                            padding: '14px', borderRadius: '16px',
                                            background: i === 0 ? 'rgba(123,63,242,0.12)' : 'rgba(255,255,255,0.03)',
                                            border: i === 0 ? '1px solid rgba(123,63,242,0.3)' : '1px solid rgba(255,255,255,0.05)',
                                            marginBottom: '10px',
                                        }}>
                                            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #7B3FF2, #A855F7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '15px', flexShrink: 0 }}>
                                                {inf.name[0]}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ fontWeight: '600', color: '#fff', fontSize: '13px' }}>{inf.name}</p>
                                                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{inf.niche} · {inf.followers}</p>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '18px', color: i === 0 ? '#a78bfa' : 'rgba(255,255,255,0.6)' }}>{inf.score}</p>
                                                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>AI Score</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━ GROWTH BILLBOARD ━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <section style={{ padding: '40px 24px 120px' }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                        <div className="glass-card float-a glass-card-xl" style={{
                            padding: '64px 56px', borderRadius: '40px',
                            background: 'rgba(16,14,28,0.75)',
                            boxShadow: '0 0 100px rgba(123,63,242,0.18), 0 0 200px rgba(123,63,242,0.08)',
                            border: '1px solid rgba(123,63,242,0.2)',
                            display: 'grid', gridTemplateColumns: '1fr auto', gap: '40px', alignItems: 'center',
                        }}>
                            <div>
                                <p style={{ fontSize: '12px', fontWeight: '700', color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ width: '28px', height: '2px', background: 'linear-gradient(90deg, #7B3FF2, #A855F7)', display: 'inline-block', borderRadius: '1px', boxShadow: '0 0 8px #7B3FF2' }} />
                                    Growth Breakdown
                                </p>
                                <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '-0.04em', lineHeight: '1', color: '#fff', marginBottom: '32px' }}>
                                    Followers<br />
                                    <span style={{ background: 'linear-gradient(90deg, #7B3FF2, #A855F7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Don&apos;t Matter.</span>
                                </h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {['Leads matter.', 'Retention matters.', 'Revenue matters.'].map((t, i) => (
                                        <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                            <div style={{ width: '2px', height: '20px', background: `linear-gradient(180deg, #7B3FF2, #A855F7)`, borderRadius: '1px', flexShrink: 0, boxShadow: '0 0 8px rgba(123,63,242,0.6)' }} />
                                            <span style={{ fontSize: '20px', fontFamily: 'Space Grotesk', fontWeight: '600', color: i === 2 ? '#a78bfa' : 'rgba(255,255,255,0.65)' }}>{t}</span>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ marginTop: '40px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <Link href="/signup/brand" className="glow-btn" style={{ padding: '12px 28px', fontSize: '14px' }}>
                                        Start for Free
                                    </Link>
                                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>porchest.com</span>
                                </div>
                            </div>
                            <div className="float-b" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px' }}>
                                <div style={{
                                    width: '64px', height: '64px', borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #7B3FF2, #A855F7)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 0 40px rgba(123,63,242,0.6), 0 0 80px rgba(123,63,242,0.3)',
                                    position: 'relative',
                                }}>
                                    <div className="ring-pulse" />
                                    <div className="ring-pulse ring-pulse-2" />
                                    <ArrowRight size={28} style={{ color: '#fff' }} />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━ FOR BRANDS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <section id="brands" style={{ padding: '40px 24px 120px' }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center"
                        initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
                        <motion.div variants={fadeUp}>
                            <SectionPill label="For Brands" />
                            <h2 className="section-title" style={{ color: '#fff', marginBottom: '20px' }}>
                                Scale Campaigns<br />
                                <span style={{ background: 'linear-gradient(90deg, #7B3FF2, #A855F7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>With Precision</span>
                            </h2>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px', lineHeight: '1.7', marginBottom: '32px' }}>
                                Create targeted campaigns, discover AI-matched influencers, and track every dollar of ROI — all from one control panel.
                            </p>
                            {['Create targeted campaigns', 'AI influencer discovery', 'Real-time Budget & ROI tracking', 'Direct messaging with creators'].map((f) => (
                                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(123,63,242,0.15)', border: '1px solid rgba(123,63,242,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <CheckCircle size={13} style={{ color: '#a78bfa' }} />
                                    </div>
                                    <span style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)' }}>{f}</span>
                                </div>
                            ))}
                            <Link href="/signup/brand" className="glow-btn" style={{ marginTop: '32px', display: 'inline-flex' }}>
                                Start as Brand <ArrowRight size={16} />
                            </Link>
                        </motion.div>

                        <motion.div variants={fadeUp} className="glass-card float-a" style={{ padding: '0', overflow: 'hidden', borderRadius: '32px' }}>
                            {[
                                { label: 'Active Campaigns', value: '12', icon: <Megaphone size={16} />, color: '#7B3FF2' },
                                { label: 'AI Matches Found', value: '48', icon: <Users size={16} />, color: '#A855F7' },
                                { label: 'Avg. Engagement', value: '6.2%', icon: <TrendingUp size={16} />, color: '#4ade80' },
                                { label: 'Total Reach', value: '2.4M', icon: <Target size={16} />, color: '#60d5f8' },
                            ].map((s, i) => (
                                <div key={s.label} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '20px 28px',
                                    borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${s.color}15`, border: `1px solid ${s.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                                            {s.icon}
                                        </div>
                                        <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>{s.label}</span>
                                    </div>
                                    <span style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '22px', color: '#fff', letterSpacing: '-0.03em' }}>{s.value}</span>
                                </div>
                            ))}
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━ FOR INFLUENCERS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <section id="influencers" style={{ padding: '40px 24px 120px' }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center"
                        initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
                        {/* Left: influencer card stack */}
                        <motion.div variants={fadeUp} style={{ order: 0 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {[
                                    { name: 'Alex Rivera', niche: 'Tech & Lifestyle', followers: '125K', score: 94, delay: 0 },
                                    { name: 'Sarah Chen', niche: 'Fashion', followers: '280K', score: 88, delay: 24 },
                                    { name: 'Marcus J.', niche: 'Fitness', followers: '520K', score: 82, delay: 12 },
                                ].map((inf, i) => (
                                    <motion.div key={inf.name} custom={i} variants={fadeUp}
                                        className="glass-card"
                                        style={{ padding: '20px 24px', borderRadius: '24px', transform: `translateY(${inf.delay}px)` }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #7B3FF2, #A855F7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '18px', flexShrink: 0, boxShadow: '0 0 20px rgba(123,63,242,0.4)' }}>
                                                {inf.name[0]}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ fontWeight: '700', color: '#fff', fontSize: '15px', fontFamily: 'Space Grotesk' }}>{inf.name}</p>
                                                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                                    <span className="badge badge-purple" style={{ fontSize: '11px' }}>{inf.niche}</span>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <p style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '18px', color: '#a78bfa' }}>{inf.followers}</p>
                                                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>
                                                    <span style={{ color: '#4ade80' }}>AI:{inf.score}%</span>
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div variants={fadeUp} style={{ order: 1 }}>
                            <SectionPill label="For Influencers" color="#A855F7" />
                            <h2 className="section-title" style={{ color: '#fff', marginBottom: '20px' }}>
                                Turn Influence Into{' '}
                                <span style={{ background: 'linear-gradient(90deg, #A855F7, #7B3FF2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Revenue</span>
                            </h2>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px', lineHeight: '1.7', marginBottom: '32px' }}>
                                Discover relevant brand campaigns, collaborate with top companies, and grow your income — from one powerful portal.
                            </p>
                            {['Browse campaigns by niche', 'AI-matched brand opportunities', 'Track applications & earnings', 'Real-time brand messaging'].map((f) => (
                                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <CheckCircle size={13} style={{ color: '#c084fc' }} />
                                    </div>
                                    <span style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)' }}>{f}</span>
                                </div>
                            ))}
                            <Link href="/signup/influencer" className="glow-btn" style={{ marginTop: '32px', display: 'inline-flex', background: 'linear-gradient(135deg, #A855F7, #7B3FF2)' }}>
                                Join as Influencer <ArrowRight size={16} />
                            </Link>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ FINAL CTA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <section style={{ padding: '40px 24px 140px' }}>
                <div style={{ maxWidth: '780px', margin: '0 auto', textAlign: 'center' }}>
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
                        <div className="glass-card glass-card-xl float-a" style={{
                            padding: '72px 56px', borderRadius: '40px',
                            background: 'rgba(18,14,30,0.8)',
                            boxShadow: '0 0 120px rgba(123,63,242,0.2), 0 0 240px rgba(123,63,242,0.08)',
                            border: '1px solid rgba(123,63,242,0.25)',
                        }}>
                            <div style={{ width: '60px', height: '60px', borderRadius: '20px', background: 'linear-gradient(135deg, rgba(123,63,242,0.3), rgba(168,85,247,0.15))', border: '1px solid rgba(123,63,242,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', boxShadow: '0 0 40px rgba(123,63,242,0.3)' }}>
                                <Star size={28} style={{ color: '#a78bfa' }} />
                            </div>
                            <h2 className="section-title" style={{ color: '#fff', marginBottom: '16px' }}>
                                Ready to{' '}
                                <span style={{ background: 'linear-gradient(90deg, #7B3FF2, #A855F7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Get Started?</span>
                            </h2>
                            <p style={{ color: 'rgba(255,255,255,0.45)', marginBottom: '40px', fontSize: '17px', lineHeight: '1.6', maxWidth: '420px', margin: '0 auto 40px' }}>
                                Join thousands of brands and influencers building high-impact collaborations with AI.
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px' }}>
                                <Link href="/signup" className="glow-btn" style={{ fontSize: '16px', padding: '16px 40px' }}>
                                    Create Account <ArrowRight size={18} />
                                </Link>
                                <Link href="/login" className="outline-btn" style={{ fontSize: '16px', padding: '15px 36px' }}>
                                    Sign In
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
