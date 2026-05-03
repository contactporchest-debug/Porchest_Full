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
        <header className={`fixed inset-x-0 top-0 z-50 border-b transition-colors ${scrolled ? 'border-[#2A2A30] bg-[#0A0A0B]/95' : 'border-transparent bg-transparent'}`}>
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                <Link href="/" className="flex items-center gap-3 rounded-full border border-[#2A2A30] bg-[#1A1A1E] px-4 py-2">
                    <Image src="/logo.png" alt="Porchest" width={26} height={26} className="rounded-md" />
                    <span className="text-sm font-semibold tracking-wide text-white">PORCHEST</span>
                </Link>

                <nav className="hidden items-center gap-2 md:flex">
                    {links.map((item) => (
                        <a key={item.href} href={item.href} className="rounded-full px-4 py-2 text-sm text-gray-400 transition hover:bg-[#1A1A1E] hover:text-white">
                            {item.label}
                        </a>
                    ))}
                </nav>

                <div className="hidden items-center gap-2 md:flex">
                    <Link href="/login" className="rounded-lg border border-[#2A2A30] bg-[#1A1A1E] px-4 py-2 text-sm font-medium text-gray-300 transition hover:bg-[#202025]">
                        Sign in
                    </Link>
                    <Link href="/signup" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500">
                        Get started
                    </Link>
                </div>

                <button onClick={() => setOpen((v) => !v)} className="rounded-lg border border-[#2A2A30] bg-[#1A1A1E] p-2 text-gray-300 md:hidden">
                    <Plus size={18} className={open ? 'rotate-45 transition-transform' : 'transition-transform'} />
                </button>
            </div>

            <AnimatePresence>
                {open && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="border-t border-[#2A2A30] bg-[#0A0A0B] md:hidden">
                        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 sm:px-6">
                            {links.map((item) => (
                                <a key={item.href} href={item.href} className="rounded-lg border border-[#2A2A30] bg-[#1A1A1E] px-4 py-3 text-sm text-gray-300">
                                    {item.label}
                                </a>
                            ))}
                            <Link href="/login" className="rounded-lg border border-[#2A2A30] bg-[#1A1A1E] px-4 py-3 text-sm font-medium text-gray-300">
                                Sign in
                            </Link>
                            <Link href="/signup" className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white">
                                Get started
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}

function Metric({ label, value, tone = 'text-white' }: { label: string; value: string; tone?: string }) {
    return (
        <div className="rounded-xl border border-[#2A2A30] bg-[#1A1A1E] p-5">
            <p className="text-xs uppercase tracking-wider text-gray-400">{label}</p>
            <p className={`mt-3 text-3xl font-bold ${tone}`}>{value}</p>
        </div>
    );
}

function Hero() {
    return (
        <section className="mx-auto max-w-7xl px-4 pb-20 pt-28 sm:px-6 lg:px-8 lg:pt-32">
            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
                    <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-[#2A2A30] bg-[#1A1A1E] px-3 py-1 text-xs font-medium text-gray-300">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        Available for brands and creators
                    </motion.div>
                    <motion.h1 variants={fadeUp} className="max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                        A cleaner workspace for influencer campaigns, analytics, and collaboration flow.
                    </motion.h1>
                    <motion.p variants={fadeUp} className="max-w-2xl text-base leading-8 text-gray-400 sm:text-lg">
                        Porchest brings creator discovery, profile scoring, request workflows, and campaign tracking into one dark, focused dashboard.
                    </motion.p>
                    <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
                        <Link href="/signup" className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-500">
                            Get started
                        </Link>
                        <a href="#features" className="rounded-lg border border-[#2A2A30] bg-[#1A1A1E] px-5 py-3 text-sm font-medium text-gray-300 transition hover:bg-[#202025]">
                            Explore features
                        </a>
                    </motion.div>
                </motion.div>

                <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-4">
                    <motion.div variants={fadeUp} className="rounded-xl border border-[#2A2A30] bg-[#1A1A1E] p-5">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-wider text-gray-400">Platform snapshot</p>
                                <h2 className="mt-1 text-lg font-semibold text-white">Campaign dashboard</h2>
                            </div>
                            <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-blue-300">Live</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Metric label="Creators" value="12.4K" tone="text-blue-300" />
                            <Metric label="Campaigns" value="1.8K" tone="text-emerald-300" />
                            <Metric label="Clicks" value="94.2K" tone="text-orange-300" />
                            <Metric label="Revenue" value="$2.4M" tone="text-yellow-300" />
                        </div>
                    </motion.div>
                    <motion.div variants={fadeUp} className="rounded-xl border border-[#2A2A30] bg-[#1A1A1E] p-5">
                        <div className="mb-4 flex items-center justify-between">
                            <p className="text-sm font-medium text-white">Signal quality</p>
                            <span className="text-xs text-emerald-400">+14% this month</span>
                        </div>
                        <div className="grid grid-cols-6 gap-2">
                            {[44, 58, 49, 74, 61, 82].map((h, i) => (
                                <div key={i} className="flex h-36 items-end rounded-lg border border-[#2A2A30] bg-[#202025] p-2">
                                    <div className="w-full rounded-md bg-gradient-to-t from-blue-500 to-cyan-300" style={{ height: `${h}%` }} />
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
        { icon: LayoutDashboard, title: 'Dashboard clarity', desc: 'Clean surfaces, strong hierarchy, and readable metrics across every portal.' },
        { icon: Users, title: 'Creator discovery', desc: 'Filter influencers by audience, niche, pricing, and trust signals.' },
        { icon: Briefcase, title: 'Collaboration workflow', desc: 'Structured requests, approvals, posting, verification, and payout tracking.' },
        { icon: BarChart3, title: 'Analytics first', desc: 'Follower growth, engagement, traffic, and ROI are surfaced with simple charts.' },
        { icon: Sparkles, title: 'Smart matching', desc: 'Brand and creator fit is easier to understand with profile completeness and scoring.' },
        { icon: ExternalLink, title: 'Actionable links', desc: 'Campaign links, promo codes, and tracking are always visible when needed.' },
    ];

    return (
        <section id="features" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <SectionReveal>
                <motion.div variants={fadeUp} className="mb-8">
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Features</p>
                    <h2 className="mt-2 text-3xl font-semibold text-white">Everything in one dark dashboard</h2>
                </motion.div>
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {items.map((item) => (
                        <motion.div key={item.title} variants={fadeUp} className="rounded-xl border border-[#2A2A30] bg-[#1A1A1E] p-6">
                            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-[#2A2A30] bg-[#202025] text-blue-300">
                                <item.icon size={18} />
                            </div>
                            <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                            <p className="mt-2 text-sm leading-7 text-gray-400">{item.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </SectionReveal>
        </section>
    );
}

function Workflow() {
    const steps = [
        ['Discover', 'Find creators with matching audiences and reliable signals.'],
        ['Request', 'Send a structured brief with offer, requirements, and deadlines.'],
        ['Track', 'Monitor approvals, posts, and metrics in one place.'],
        ['Report', 'Review final traffic, conversions, and campaign performance.'],
    ];

    return (
        <section id="workflow" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <SectionReveal>
                <motion.div variants={fadeUp} className="mb-8">
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Workflow</p>
                    <h2 className="mt-2 text-3xl font-semibold text-white">A simple, repeatable process</h2>
                </motion.div>
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                    {steps.map(([title, desc], index) => (
                        <motion.div key={title} variants={fadeUp} className="rounded-xl border border-[#2A2A30] bg-[#1A1A1E] p-6">
                            <p className="text-5xl font-bold text-white/10">{index + 1}</p>
                            <h3 className="mt-4 text-xl font-semibold text-white">{title}</h3>
                            <p className="mt-2 text-sm leading-7 text-gray-400">{desc}</p>
                        </motion.div>
                    ))}
                </div>
            </SectionReveal>
        </section>
    );
}

function FAQ() {
    const [open, setOpen] = useState<number | null>(0);
    const items = [
        ['How does matching work?', 'We use audience fit, engagement quality, niche alignment, and profile completeness to surface the best creators.'],
        ['Can brands track campaigns?', 'Yes. Campaigns include tracking links, promo codes, traffic metrics, and campaign reporting.'],
        ['Can influencers manage pricing?', 'Yes. Influencers set their own rates, profile details, and content style tags.'],
    ];

    return (
        <section id="faq" className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
            <SectionReveal>
                <motion.div variants={fadeUp} className="mb-8">
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-400">FAQ</p>
                    <h2 className="mt-2 text-3xl font-semibold text-white">Common questions</h2>
                </motion.div>
                <div className="space-y-3">
                    {items.map(([q, a], index) => (
                        <motion.div key={q} variants={fadeUp} className="rounded-xl border border-[#2A2A30] bg-[#1A1A1E]">
                            <button onClick={() => setOpen(open === index ? null : index)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
                                <span className="font-medium text-white">{q}</span>
                                <Plus size={16} className={`text-gray-400 transition-transform ${open === index ? 'rotate-45' : ''}`} />
                            </button>
                            {open === index && <div className="border-t border-[#2A2A30] px-5 py-4 text-sm leading-7 text-gray-400">{a}</div>}
                        </motion.div>
                    ))}
                </div>
            </SectionReveal>
        </section>
    );
}

function Contact() {
    return (
        <section id="contact" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="rounded-xl border border-[#2A2A30] bg-[#1A1A1E] p-8 md:flex md:items-center md:justify-between">
                <div className="max-w-2xl">
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Contact</p>
                    <h2 className="mt-2 text-3xl font-semibold text-white">Need help getting set up?</h2>
                    <p className="mt-3 text-sm leading-7 text-gray-400">Reach the Porchest team for onboarding, product questions, or help with your creator workflows.</p>
                </div>
                <div className="mt-6 flex flex-wrap gap-3 md:mt-0">
                    <a href="mailto:info@porchest.com" className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-500">
                        Send email
                    </a>
                    <a href="https://wa.me/923477437615" target="_blank" rel="noreferrer" className="rounded-lg border border-[#2A2A30] bg-[#202025] px-5 py-3 text-sm font-medium text-gray-300 transition hover:bg-[#2A2A30]">
                        WhatsApp
                    </a>
                </div>
            </div>
        </section>
    );
}

function Footer() {
    return (
        <footer className="border-t border-[#2A2A30]">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
                <div className="flex items-center gap-3">
                    <Image src="/logo.png" alt="Porchest" width={24} height={24} className="rounded-md" />
                    <span className="text-sm text-gray-400">© Porchest, {new Date().getFullYear()}</span>
                </div>
                <div className="flex items-center gap-2">
                    {[Mail, Instagram, Linkedin, ExternalLink].map((Icon, i) => (
                        <a key={i} href="#" className="rounded-lg border border-[#2A2A30] bg-[#1A1A1E] p-2 text-gray-400 transition hover:bg-[#202025] hover:text-white">
                            <Icon size={15} />
                        </a>
                    ))}
                </div>
            </div>
        </footer>
    );
}

export default function LandingPage() {
    return (
        <main className="min-h-screen bg-[#0A0A0B]">
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
