'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { ArrowRight, Plus, Mail, Linkedin, Instagram, ExternalLink } from 'lucide-react';

/* ───── Scroll Reveal Hook ───── */
function useReveal(threshold = 0.15) {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once: true, amount: threshold });
    return { ref, inView };
}

const fadeUp = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

/* ───── NAV ───── */
function LandingNav() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const h = () => setScrolled(window.scrollY > 40);
        window.addEventListener('scroll', h, { passive: true });
        return () => window.removeEventListener('scroll', h);
    }, []);

    const scrollTo = (id: string) => {
        setMenuOpen(false);
        setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    return (
        <>
            <header style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, padding: '16px 24px',
                background: scrolled ? 'rgba(12,12,12,0.85)' : 'transparent',
                backdropFilter: scrolled ? 'blur(20px)' : 'none',
                borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
                transition: 'all 400ms cubic-bezier(0.23,1,0.32,1)',
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', padding: '8px 16px', borderRadius: '999px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <Image src="/logo.png" alt="Porchest" width={28} height={28} style={{ borderRadius: '8px' }} />
                        <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '15px', color: '#fff' }}>Porchest</span>
                    </Link>

                    <button onClick={() => setMenuOpen(!menuOpen)} style={{ width: '44px', height: '44px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', transition: 'all 300ms ease' }}
                        aria-label="Menu">
                        {menuOpen ? <Plus size={20} style={{ transform: 'rotate(45deg)' }} /> : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ width: '18px', height: '2px', background: '#fff', borderRadius: '1px' }} />
                                <div style={{ width: '14px', height: '2px', background: '#fff', borderRadius: '1px' }} />
                            </div>
                        )}
                    </button>
                </div>
            </header>

            <AnimatePresence>
                {menuOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, zIndex: 45, background: 'rgba(12,12,12,0.97)', backdropFilter: 'blur(30px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <motion.nav initial="hidden" animate="visible" exit="hidden" variants={stagger}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            {[
                                { label: 'Features', id: 'features' },
                                { label: 'Process', id: 'how-it-works' },
                                { label: 'FAQ', id: 'faq' },
                                { label: 'Contact', id: 'contact' },
                            ].map(item => (
                                <motion.button key={item.id} variants={fadeUp} onClick={() => scrollTo(item.id)}
                                    style={{ background: 'none', border: 'none', fontFamily: 'Space Grotesk', fontSize: '36px', fontWeight: 600, color: '#fff', cursor: 'pointer', padding: '12px 24px', transition: 'color 300ms ease' }}
                                    onMouseEnter={e => (e.currentTarget.style.color = '#A855F7')}
                                    onMouseLeave={e => (e.currentTarget.style.color = '#fff')}>
                                    {item.label}
                                </motion.button>
                            ))}
                            <motion.div variants={fadeUp} style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                                <Link href="/login" className="outline-btn" style={{ fontSize: '14px', padding: '12px 24px' }}>Sign In</Link>
                                <Link href="/signup" className="glow-btn" style={{ fontSize: '14px', padding: '12px 24px' }}>Sign Up</Link>
                            </motion.div>
                            <motion.div variants={fadeUp} style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
                                {[Mail, Instagram, Linkedin].map((Icon, i) => (
                                    <a key={i} className="social-icon" href="#"><Icon size={18} /></a>
                                ))}
                            </motion.div>
                        </motion.nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

/* ───── HERO ───── */
function Hero() {
    return (
        <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 24px 80px', overflow: 'hidden' }}>
            <div className="hero-glow" />
            <div className="top-beam" />

            <div style={{ maxWidth: '900px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', marginBottom: '32px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80' }} />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>Available to work</span>
                </motion.div>

                <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.7 }}
                    className="display-text" style={{ fontSize: 'clamp(3rem, 7vw, 5.5rem)', marginBottom: '24px', color: '#fff' }}>
                    Smart <span style={{ color: 'rgba(255,255,255,0.4)' }}>creator</span> collaboration that fuels real growth.
                </motion.h1>

                <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.6 }}
                    style={{ fontSize: '18px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, maxWidth: '600px', margin: '0 auto 40px' }}>
                    Discover authentic creators, review profile quality, and run brand collaborations from one workspace built for clarity.
                </motion.p>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65, duration: 0.6 }}
                    style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link href="/signup" className="dark-btn" style={{ gap: '10px' }}>
                        <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ArrowRight size={14} />
                        </span>
                        Get Started <ArrowRight size={16} />
                    </Link>
                    <a href="#features" className="outline-btn" style={{ color: 'rgba(255,255,255,0.6)' }}>See Features</a>
                </motion.div>
            </div>
        </section>
    );
}

/* ───── FEATURES ───── */
function Features() {
    const { ref, inView } = useReveal();
    const features = [
        { title: 'Audience Analytics', desc: 'Understand demographics, engagement, and quality signals before reaching out.' },
        { title: 'Influencer Discovery', desc: 'Filter creators by niche, location, pricing, and credibility scores.' },
        { title: 'Request Workflows', desc: 'Send structured collaboration requests. Keep negotiations in one inbox.' },
        { title: 'Campaign Monitoring', desc: 'Track statuses, approvals, verification, and deliverables live.' },
        { title: 'Profile Completion', desc: 'Help users fill the right details so profiles are readable and useful.' },
        { title: 'Admin Oversight', desc: 'Manage users and activity from a central control panel.' },
    ];

    return (
        <section id="features" ref={ref} style={{ padding: '80px 24px 100px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <motion.div initial="hidden" animate={inView ? 'visible' : 'hidden'} variants={stagger}>
                    <motion.p variants={fadeUp} className="section-label" style={{ marginBottom: '16px' }}>Features</motion.p>
                    <motion.h2 variants={fadeUp} className="display-text" style={{ fontSize: 'clamp(2rem, 4.5vw, 3rem)', maxWidth: '600px', marginBottom: '60px' }}>
                        Built for organized brand-creator collaboration
                    </motion.h2>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1px', background: 'rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
                        {features.map((f, i) => (
                            <motion.div key={f.title} variants={fadeUp}
                                style={{ padding: '36px', background: '#0c0c0c', transition: 'all 400ms ease', cursor: 'default' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#0c0c0c'; }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(123,63,242,0.1)', border: '1px solid rgba(123,63,242,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa', fontWeight: 800, marginBottom: '20px', fontSize: '16px' }}>
                                    {f.title.charAt(0)}
                                </div>
                                <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '20px', color: '#fff', marginBottom: '10px', letterSpacing: '-0.02em' }}>{f.title}</h3>
                                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

/* ───── HOW IT WORKS ───── */
function HowItWorks() {
    const { ref, inView } = useReveal();
    const steps = [
        { n: '1', title: 'Discover', desc: 'Define campaign objectives, audience fit, and collaboration scope.' },
        { n: '2', title: 'Request', desc: 'Share terms clearly so brands and influencers see the same details.' },
        { n: '3', title: 'Create', desc: 'Check profile strength, pricing, and audience quality in one place.' },
        { n: '4', title: 'Activate', desc: 'Follow collaboration progress, verification, and platform activity.' },
    ];

    return (
        <section id="how-it-works" ref={ref} style={{ padding: '40px 24px 100px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <motion.div initial="hidden" animate={inView ? 'visible' : 'hidden'} variants={stagger}>
                    <motion.p variants={fadeUp} className="section-label" style={{ marginBottom: '16px' }}>Our Process</motion.p>
                    <motion.h2 variants={fadeUp} className="display-text" style={{ fontSize: 'clamp(2rem, 4.5vw, 3rem)', maxWidth: '550px', marginBottom: '60px' }}>
                        A simple workflow, explained
                    </motion.h2>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                        {steps.map(s => (
                            <motion.div key={s.n} variants={fadeUp} className="hover-lift"
                                style={{ padding: '32px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                                <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '48px', color: 'rgba(255,255,255,0.08)', lineHeight: 1, marginBottom: '16px' }}>{s.n}</div>
                                <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '22px', color: '#fff', marginBottom: '10px' }}>{s.title}</h3>
                                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>{s.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

/* ───── MARQUEE ───── */
function MarqueeTicker() {
    const tags = ['Audience Analytics', 'Smart Matching', 'Campaign Tracking', 'Profile Scoring', 'Content Verification', 'Brand Discovery', 'ROI Monitoring', 'Influencer Vetting'];
    const doubled = [...tags, ...tags];

    return (
        <section style={{ padding: '40px 0', overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="marquee-container">
                <div className="marquee-track">
                    {doubled.map((tag, i) => (
                        <span key={i} className="marquee-item">
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#a78bfa' }} />
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ───── FAQ ───── */
function FAQ() {
    const { ref, inView } = useReveal();
    const [openIdx, setOpenIdx] = useState<number | null>(null);
    const items = [
        { q: 'How does influencer matching work?', a: 'Porchest uses audience demographics, engagement patterns, and content quality signals to surface creators that are a strong fit for your campaign goals.' },
        { q: 'What metrics can I track?', a: 'Track follower growth, engagement rate, post reach, impressions, link clicks, conversions, and ROAS — all from one dashboard.' },
        { q: 'Is there a free trial?', a: 'Yes — you can create an account and explore the platform for free. Premium features unlock with a paid plan.' },
        { q: 'How fast is the turnaround on requests?', a: 'Most collaboration requests receive a response within 24-48 hours. The platform notifies both parties in real-time.' },
        { q: 'Can I manage multiple campaigns?', a: 'Absolutely. The platform supports unlimited concurrent campaigns with separate tracking and analytics for each.' },
    ];

    return (
        <section id="faq" ref={ref} style={{ padding: '80px 24px 100px' }}>
            <div style={{ maxWidth: '720px', margin: '0 auto' }}>
                <motion.div initial="hidden" animate={inView ? 'visible' : 'hidden'} variants={stagger}>
                    <motion.p variants={fadeUp} className="section-label" style={{ marginBottom: '16px' }}>FAQ</motion.p>
                    <motion.h2 variants={fadeUp} className="display-text" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', marginBottom: '48px' }}>
                        Have more questions?
                    </motion.h2>

                    <motion.div variants={fadeUp}>
                        {items.map((item, i) => (
                            <div key={i} className="faq-item">
                                <button className="faq-trigger" data-open={openIdx === i ? 'true' : 'false'} onClick={() => setOpenIdx(openIdx === i ? null : i)}>
                                    {item.q}
                                    <Plus size={18} />
                                </button>
                                <div className="faq-answer" data-open={openIdx === i ? 'true' : 'false'}>
                                    <p>{item.a}</p>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}

/* ───── CONTACT ───── */
function Contact() {
    const { ref, inView } = useReveal();
    return (
        <section id="contact" ref={ref} style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '600px', height: '400px', background: 'radial-gradient(ellipse, rgba(123,63,242,0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />
            <motion.div initial="hidden" animate={inView ? 'visible' : 'hidden'} variants={stagger} style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                <motion.div variants={fadeUp} style={{ display: 'inline-flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
                    <div style={{ height: '1px', width: '60px', background: 'rgba(255,255,255,0.15)' }} />
                    <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>Available to work</span>
                    <div style={{ height: '1px', width: '60px', background: 'rgba(255,255,255,0.15)' }} />
                </motion.div>

                <motion.h2 variants={fadeUp} className="display-text" style={{ fontSize: 'clamp(3rem, 7vw, 6rem)', marginBottom: '20px' }}>
                    Let&apos;s <span style={{ color: 'rgba(255,255,255,0.35)' }}>Connect</span>
                </motion.h2>

                <motion.p variants={fadeUp} style={{ fontSize: '16px', color: 'rgba(255,255,255,0.45)', maxWidth: '480px', margin: '0 auto 36px', lineHeight: 1.7 }}>
                    Reach the Porchest team for onboarding, product questions, or help planning your creator operations.
                </motion.p>

                <motion.div variants={fadeUp} style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <a href="https://wa.me/923477437615" target="_blank" rel="noopener noreferrer" className="dark-btn">
                        <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>💬</span>
                        Chat on WhatsApp <ArrowRight size={16} />
                    </a>
                    <a href="mailto:info@porchest.com" className="outline-btn" style={{ color: 'rgba(255,255,255,0.6)' }}>Send Email</a>
                </motion.div>
            </motion.div>
        </section>
    );
}

/* ───── FOOTER ───── */
function Footer() {
    return (
        <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '28px 24px 36px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Image src="/logo.png" alt="Porchest" width={24} height={24} style={{ borderRadius: '6px' }} />
                    <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>© Porchest, {new Date().getFullYear()}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {[Mail, Instagram, Linkedin, ExternalLink].map((Icon, i) => (
                        <a key={i} className="social-icon" href="#" style={{ width: '36px', height: '36px' }}><Icon size={15} /></a>
                    ))}
                </div>
            </div>
        </footer>
    );
}

/* ───── PAGE ───── */
export default function LandingPage() {
    return (
        <main style={{ minHeight: '100vh', background: '#0c0c0c', position: 'relative', overflow: 'hidden' }}>
            <div className="landing-texture-grid" />
            <LandingNav />
            <Hero />
            <Features />
            <HowItWorks />
            <MarqueeTicker />
            <FAQ />
            <Contact />
            <Footer />
        </main>
    );
}
