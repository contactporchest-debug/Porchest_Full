'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Mail, Linkedin, Instagram, ExternalLink, Plus, LayoutDashboard, Users, BarChart3, Briefcase, Sparkles } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

function SectionReveal({ children }: { children: ReactNode }) {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once: true, amount: 0.15 });
    return (
        <div ref={ref}>
            <motion.div initial="hidden" animate={inView ? 'visible' : 'hidden'} variants={stagger}>
                {children}
            </motion.div>
        </div>
    );
}

function LandingNav() {
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 12);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);
    const links = [
        { label: 'Features', href: '#features' },
        { label: 'Workflow', href: '#workflow' },
        { label: 'FAQ', href: '#faq' },
        { label: 'Contact', href: '#contact' },
    ];
    return (
        <header style={{
            position: 'fixed', inset: '0 0 auto 0', zIndex: 50,
            background: scrolled ? 'rgba(253,246,238,0.92)' : 'rgba(253,246,238,0.75)',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            borderBottom: `1px solid ${scrolled ? '#EDD9BC' : 'transparent'}`,
            transition: 'all 0.2s',
        }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 28px' }}>
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                    <Image src="/porchest-logo.png" alt="Porchest" width={32} height={32} style={{ borderRadius: '6px', objectFit: 'contain' }} />
                    <span style={{ fontSize: '17px', fontWeight: 600, color: '#1A0A00', letterSpacing: '-0.01em' }}>Porchest</span>
                </Link>
                <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }} className="hidden md:flex">
                    {links.map(item => (
                        <a key={item.href} href={item.href} style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '14px', color: '#7A5030', textDecoration: 'none', transition: 'color 0.15s', fontWeight: 400 }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#C2340A'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#7A5030'; }}>
                            {item.label}
                        </a>
                    ))}
                </nav>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="hidden md:flex">
                    <Link href="/login" style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, color: '#7A5030', background: 'rgba(255,255,255,0.60)', border: '1px solid #EDD9BC', textDecoration: 'none', transition: 'all 0.15s' }}>Sign in</Link>
                    <Link href="/signup" style={{ padding: '10px 22px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, color: '#fff', background: '#C2340A', border: 'none', textDecoration: 'none', transition: 'all 0.15s' }}>Get started</Link>
                </div>
                <button onClick={() => setOpen(v => !v)} className="md:hidden" style={{ padding: '8px', borderRadius: '8px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.60)', color: '#7A5030', cursor: 'pointer' }}>
                    <Plus size={18} style={{ transform: open ? 'rotate(45deg)' : '', transition: 'transform 0.2s' }} />
                </button>
            </div>
            <AnimatePresence>
                {open && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ borderTop: '1px solid #EDD9BC', background: '#FDF6EE' }} className="md:hidden">
                        <div style={{ padding: '12px 28px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {links.map(item => <a key={item.href} href={item.href} style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.50)', fontSize: '14px', color: '#7A5030', textDecoration: 'none' }}>{item.label}</a>)}
                            <Link href="/login" style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.50)', fontSize: '14px', color: '#7A5030', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
                            <Link href="/signup" style={{ padding: '12px 14px', borderRadius: '8px', background: '#C2340A', fontSize: '14px', color: '#fff', textDecoration: 'none', fontWeight: 500, textAlign: 'center' }}>Get started</Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}

function Metric({ label, value, tone = '#1A0A00' }: { label: string; value: string; tone?: string }) {
    return (
        <div style={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.65)', background: 'rgba(255,255,255,0.35)', backdropFilter: 'blur(12px)', padding: '18px' }}>
            <p style={{ fontSize: '11px', fontWeight: 500, color: '#7A5030', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</p>
            <p style={{ marginTop: '10px', fontSize: '28px', fontWeight: 700, color: tone, letterSpacing: '-0.02em' }}>{value}</p>
        </div>
    );
}

function Hero() {
    return (
        <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '120px 28px 80px' }}>
            <div style={{ display: 'grid', gap: '40px', gridTemplateColumns: '1fr' }} className="lg:grid-cols-[1.2fr_0.8fr]">
                <motion.div initial="hidden" animate="visible" variants={stagger} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <motion.div variants={fadeUp}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 14px', borderRadius: '999px', background: '#FFE5CC', color: '#C2340A', fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C2340A', flexShrink: 0 }} />
                            Available for brands and creators
                        </span>
                    </motion.div>
                    <motion.h1 variants={fadeUp} style={{ fontSize: 'clamp(32px,5vw,44px)', fontWeight: 700, color: '#1A0A00', letterSpacing: '-0.02em', lineHeight: 1.15, maxWidth: '680px' }}>
                        A focused workspace for influencer campaigns, analytics, and collaboration.
                    </motion.h1>
                    <motion.p variants={fadeUp} style={{ fontSize: '15px', fontWeight: 400, color: '#7A5030', lineHeight: 1.65, maxWidth: '520px' }}>
                        Porchest brings creator discovery, profile scoring, request workflows, and campaign tracking into one clean, warm dashboard.
                    </motion.p>
                    <motion.div variants={fadeUp} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <Link href="/signup" style={{ padding: '12px 26px', borderRadius: '8px', background: '#C2340A', color: '#fff', fontSize: '13px', fontWeight: 500, textDecoration: 'none', letterSpacing: '0.01em', transition: 'all 0.15s' }}>Get started</Link>
                        <a href="#features" style={{ padding: '12px 26px', borderRadius: '8px', background: 'transparent', color: '#C2340A', fontSize: '13px', fontWeight: 500, border: '1.5px solid #C2340A', textDecoration: 'none', letterSpacing: '0.01em', transition: 'all 0.15s' }}>Explore features</a>
                    </motion.div>
                </motion.div>

                <motion.div initial="hidden" animate="visible" variants={stagger} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <motion.div variants={fadeUp} style={{ borderRadius: '14px', border: '1px solid rgba(255,255,255,0.65)', background: 'rgba(255,255,255,0.35)', backdropFilter: 'blur(12px)', padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <div>
                                <p style={{ fontSize: '11px', fontWeight: 500, color: '#7A5030', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Platform snapshot</p>
                                <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1A0A00', marginTop: '4px' }}>Campaign dashboard</h2>
                            </div>
                            <span style={{ padding: '4px 12px', borderRadius: '999px', background: '#FFE5CC', color: '#C2340A', fontSize: '10px', fontWeight: 500, letterSpacing: '0.06em' }}>Live</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <Metric label="Creators" value="12.4K" tone="#C2340A" />
                            <Metric label="Campaigns" value="1.8K" tone="#E8400A" />
                            <Metric label="Reach" value="94.2K" tone="#FF6B1A" />
                            <Metric label="Revenue" value="$2.4M" tone="#1A0A00" />
                        </div>
                    </motion.div>
                    <motion.div variants={fadeUp} style={{ borderRadius: '14px', border: '1px solid rgba(255,255,255,0.65)', background: 'rgba(255,255,255,0.35)', backdropFilter: 'blur(12px)', padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <p style={{ fontSize: '14px', fontWeight: 600, color: '#1A0A00' }}>Signal quality</p>
                            <span style={{ fontSize: '12px', color: '#E8400A', fontWeight: 500 }}>+14% this month</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '6px' }}>
                            {[44, 58, 49, 74, 61, 82].map((h, i) => (
                                <div key={i} style={{ height: '100px', display: 'flex', alignItems: 'flex-end', borderRadius: '8px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.50)', padding: '4px' }}>
                                    <div style={{ width: '100%', borderRadius: '5px', background: 'linear-gradient(to top, #C2340A, #FF6B1A)', height: `${h}%` }} />
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}

function FeatureGrid() {
    const items = [
        { icon: LayoutDashboard, title: 'Dashboard clarity', desc: 'Clean surfaces, strong hierarchy, and readable metrics across every portal.', tint: 'rgba(232,64,10,0.12)' },
        { icon: Users, title: 'Creator discovery', desc: 'Filter influencers by audience, niche, pricing, and trust signals.', tint: 'rgba(255,107,26,0.12)' },
        { icon: Briefcase, title: 'Collaboration workflow', desc: 'Structured requests, approvals, posting, verification, and payout tracking.', tint: 'rgba(194,52,10,0.10)' },
        { icon: BarChart3, title: 'Analytics first', desc: 'Follower growth, engagement, traffic, and ROI are surfaced with simple charts.', tint: 'rgba(232,64,10,0.12)' },
        { icon: Sparkles, title: 'Smart matching', desc: 'Brand and creator fit is easier to understand with profile completeness and scoring.', tint: 'rgba(255,107,26,0.12)' },
        { icon: ExternalLink, title: 'Actionable links', desc: 'Campaign links, promo codes, and tracking are always visible when needed.', tint: 'rgba(194,52,10,0.10)' },
    ];
    return (
        <section id="features" style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 28px' }}>
            <SectionReveal>
                <motion.div variants={fadeUp} style={{ marginBottom: '36px' }}>
                    <span style={{ display: 'inline-block', padding: '4px 14px', borderRadius: '999px', background: '#FFE5CC', color: '#C2340A', fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em', marginBottom: '12px' }}>Features</span>
                    <h2 style={{ fontSize: '30px', fontWeight: 600, color: '#1A0A00', letterSpacing: '-0.02em' }}>Everything in one clean dashboard</h2>
                </motion.div>
                <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))' }}>
                    {items.map(item => (
                        <motion.div key={item.title} variants={fadeUp} style={{ padding: '24px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.65)', background: 'rgba(255,255,255,0.35)', backdropFilter: 'blur(12px)' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: item.tint, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                                <item.icon size={20} style={{ color: '#C2340A' }} />
                            </div>
                            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#1A0A00', marginBottom: '8px' }}>{item.title}</h3>
                            <p style={{ fontSize: '14px', color: '#7A5030', lineHeight: 1.65 }}>{item.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </SectionReveal>
        </section>
    );
}

function Workflow() {
    const steps: [string, string][] = [
        ['Discover', 'Find creators with matching audiences and reliable signals.'],
        ['Request', 'Send a structured brief with offer, requirements, and deadlines.'],
        ['Track', 'Monitor approvals, posts, and metrics in one place.'],
        ['Report', 'Review final traffic, conversions, and campaign performance.'],
    ];
    return (
        <section id="workflow" style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 28px' }}>
            <SectionReveal>
                <motion.div variants={fadeUp} style={{ marginBottom: '36px' }}>
                    <span style={{ display: 'inline-block', padding: '4px 14px', borderRadius: '999px', background: '#FFE5CC', color: '#C2340A', fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em', marginBottom: '12px' }}>Workflow</span>
                    <h2 style={{ fontSize: '30px', fontWeight: 600, color: '#1A0A00', letterSpacing: '-0.02em' }}>A simple, repeatable process</h2>
                </motion.div>
                <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))' }}>
                    {steps.map(([title, desc], index) => (
                        <motion.div key={title} variants={fadeUp} style={{ padding: '24px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.65)', background: 'rgba(255,255,255,0.35)', backdropFilter: 'blur(12px)' }}>
                            <p style={{ fontSize: '48px', fontWeight: 700, color: 'rgba(194,52,10,0.12)', lineHeight: 1, marginBottom: '12px' }}>{index + 1}</p>
                            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1A0A00', marginBottom: '8px' }}>{title}</h3>
                            <p style={{ fontSize: '14px', color: '#7A5030', lineHeight: 1.65 }}>{desc}</p>
                        </motion.div>
                    ))}
                </div>
            </SectionReveal>
        </section>
    );
}

function FAQ() {
    const [open, setOpen] = useState<number | null>(0);
    const items: [string, string][] = [
        ['How does matching work?', 'We use audience fit, engagement quality, niche alignment, and profile completeness to surface the best creators.'],
        ['Can brands track campaigns?', 'Yes. Campaigns include tracking links, promo codes, traffic metrics, and campaign reporting.'],
        ['Can influencers manage pricing?', 'Yes. Influencers set their own rates, profile details, and content style tags.'],
    ];
    return (
        <section id="faq" style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 28px' }}>
            <SectionReveal>
                <motion.div variants={fadeUp} style={{ marginBottom: '36px' }}>
                    <span style={{ display: 'inline-block', padding: '4px 14px', borderRadius: '999px', background: '#FFE5CC', color: '#C2340A', fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em', marginBottom: '12px' }}>FAQ</span>
                    <h2 style={{ fontSize: '30px', fontWeight: 600, color: '#1A0A00', letterSpacing: '-0.02em' }}>Common questions</h2>
                </motion.div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {items.map(([q, a], index) => (
                        <motion.div key={q} variants={fadeUp} style={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.65)', background: 'rgba(255,255,255,0.35)', backdropFilter: 'blur(12px)', overflow: 'hidden' }}>
                            <button onClick={() => setOpen(open === index ? null : index)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '16px 20px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                                <span style={{ fontSize: '14px', fontWeight: 500, color: '#1A0A00' }}>{q}</span>
                                <Plus size={16} style={{ color: '#C2340A', flexShrink: 0, transform: open === index ? 'rotate(45deg)' : '', transition: 'transform 0.2s' }} />
                            </button>
                            {open === index && <div style={{ borderTop: '1px solid #EDD9BC', padding: '14px 20px', fontSize: '14px', color: '#7A5030', lineHeight: 1.65 }}>{a}</div>}
                        </motion.div>
                    ))}
                </div>
            </SectionReveal>
        </section>
    );
}

function Contact() {
    return (
        <section id="contact" style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 28px 60px' }}>
            <div style={{ borderRadius: '14px', border: '1px solid rgba(255,255,255,0.65)', background: 'rgba(255,255,255,0.35)', backdropFilter: 'blur(12px)', padding: '40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap' }}>
                <div style={{ maxWidth: '520px' }}>
                    <span style={{ display: 'inline-block', padding: '4px 14px', borderRadius: '999px', background: '#FFE5CC', color: '#C2340A', fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em', marginBottom: '14px' }}>Contact</span>
                    <h2 style={{ fontSize: '28px', fontWeight: 600, color: '#1A0A00', letterSpacing: '-0.02em', marginBottom: '10px' }}>Need help getting set up?</h2>
                    <p style={{ fontSize: '14px', color: '#7A5030', lineHeight: 1.65 }}>Reach the Porchest team for onboarding, product questions, or help with your creator workflows.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <a href="mailto:info@porchest.com" style={{ padding: '11px 24px', borderRadius: '8px', background: '#C2340A', color: '#fff', fontSize: '13px', fontWeight: 500, textDecoration: 'none' }}>Send email</a>
                    <a href="https://wa.me/923477437615" target="_blank" rel="noreferrer" style={{ padding: '11px 24px', borderRadius: '8px', background: 'transparent', color: '#C2340A', fontSize: '13px', fontWeight: 500, border: '1.5px solid #C2340A', textDecoration: 'none' }}>WhatsApp</a>
                </div>
            </div>
        </section>
    );
}

function Footer() {
    return (
        <footer style={{ borderTop: '1px solid #EDD9BC', background: 'rgba(253,246,238,0.75)', backdropFilter: 'blur(12px)' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 28px', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Image src="/porchest-logo.png" alt="Porchest" width={24} height={24} style={{ borderRadius: '5px', objectFit: 'contain' }} />
                    <span style={{ fontSize: '13px', color: '#7A5030' }}>© Porchest, {new Date().getFullYear()}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {[Mail, Instagram, Linkedin, ExternalLink].map((Icon, i) => (
                        <a key={i} href="#" style={{ width: '34px', height: '34px', borderRadius: '8px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.60)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7A5030', textDecoration: 'none' }}>
                            <Icon size={14} />
                        </a>
                    ))}
                </div>
            </div>
        </footer>
    );
}

export default function LandingPage() {
    return (
        <main style={{ minHeight: '100vh', background: '#FDF6EE' }}>
            <LandingNav />
            <Hero />
            <FeatureGrid />
            <Workflow />
            <FAQ />
            <Contact />
            <Footer />
        </main>
    );
}
