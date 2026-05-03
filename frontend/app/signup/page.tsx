'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Building2, Star, ArrowRight, Zap } from 'lucide-react';

const roleCards = [
    {
        icon: Building2,
        role: 'Brand',
        href: '/signup/brand',
        tagline: 'Scale with clarity',
        desc: 'Create campaigns, match with creators, and manage every collaboration from one place.',
        perks: ['Influencer discovery', 'Campaign coordination', 'Live request tracking'],
    },
    {
        icon: Star,
        role: 'Influencer',
        href: '/signup/influencer',
        tagline: 'Monetize with confidence',
        desc: 'Receive brand requests, showcase your profile, and keep your collaborations organized.',
        perks: ['Brand request inbox', 'Profile visibility', 'Collaboration workflow'],
    },
];

export default function SignupPage() {
    return (
        <main className="min-h-screen bg-[#0A0A0B] px-4 py-10 text-white">
            <div className="mx-auto max-w-6xl">
                <div className="mx-auto mb-8 flex w-fit items-center gap-3 rounded-full border border-[#2A2A30] bg-[#1A1A1E] px-4 py-2">
                    <Image src="/logo.png" alt="Porchest" width={26} height={26} className="rounded-md" />
                    <span className="text-sm font-semibold tracking-wide">PORCHEST</span>
                </div>

                <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-4xl text-center">
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Create account</p>
                    <h1 className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">Choose how you want to join</h1>
                    <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-gray-400 sm:text-base">
                        Porchest gives brands and influencers tailored workflows. Pick the role that fits.
                    </p>
                </motion.div>

                <div className="mx-auto mt-10 grid max-w-5xl gap-6 md:grid-cols-2">
                    {roleCards.map((card, index) => (
                        <motion.div key={card.role} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}>
                            <Link href={card.href} className="block h-full rounded-2xl border border-[#2A2A30] bg-[#1A1A1E] p-6 transition hover:-translate-y-1 hover:bg-[#202025]">
                                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-[#2A2A30] bg-[#202025] text-blue-300">
                                    <card.icon size={22} />
                                </div>
                                <div className="mb-4 inline-flex rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-300">
                                    {card.tagline}
                                </div>
                                <h2 className="text-2xl font-semibold text-white">I&apos;m a {card.role}</h2>
                                <p className="mt-3 text-sm leading-7 text-gray-400">{card.desc}</p>
                                <div className="mt-6 space-y-3">
                                    {card.perks.map((perk) => (
                                        <div key={perk} className="flex items-center gap-3 text-sm text-gray-300">
                                            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#2A2A30] bg-[#202025] text-blue-300">
                                                <Zap size={10} />
                                            </span>
                                            {perk}
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-8 flex items-center justify-between border-t border-[#2A2A30] pt-5">
                                    <span className="text-sm font-semibold text-blue-300">Get started</span>
                                    <ArrowRight size={16} className="text-blue-300" />
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                <p className="mt-8 text-center text-sm text-gray-400">
                    Already have an account?{' '}
                    <Link href="/login" className="font-semibold text-blue-400 transition hover:text-blue-300">
                        Sign in
                    </Link>
                </p>
            </div>
        </main>
    );
}
