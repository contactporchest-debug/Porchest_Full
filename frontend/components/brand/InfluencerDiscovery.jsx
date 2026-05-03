'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApi } from '../../hooks/useApi';
import InfluencerProfileMetrics from './InfluencerProfileMetrics';
import RequestCollaborationButton from './RequestCollaborationButton';
import { Search, ShieldCheck, Users, MapPin, Star, Target } from 'lucide-react';

const TIERS = ['nano', 'micro', 'macro', 'mega'];
const NICHES = ['fashion', 'beauty', 'tech', 'food', 'travel', 'fitness', 'gaming', 'finance', 'education', 'lifestyle'];

const getPillColor = (niche) => {
    const colors = {
        fashion: 'border-blue-500/20 bg-blue-500/10 text-blue-300',
        fitness: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
        food: 'border-orange-500/20 bg-orange-500/10 text-orange-300',
        beauty: 'border-pink-500/20 bg-pink-500/10 text-pink-300',
        tech: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300',
    };
    return colors[niche?.toLowerCase()] || 'border-[#2A2A30] bg-[#202025] text-gray-300';
};

export default function InfluencerDiscovery() {
    const [filters, setFilters] = useState({ search: '', niche: '', tier: '', minER: '', minScore: '', maxRate: '' });
    const [selectedId, setSelectedId] = useState(null);
    const query = useMemo(() => new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([, value]) => value))).toString(), [filters]);
    const { data, loading, error } = useApi(`/discover/influencers?${query}`);
    const influencers = data?.influencers || [];

    const pillClass = (active) => `rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${active ? 'border-blue-500/30 bg-blue-500/15 text-blue-300' : 'border-[#2A2A30] bg-[#202025] text-gray-400 hover:bg-[#2A2A30] hover:text-white'}`;
    const inputClass = 'w-full rounded-xl border border-[#2A2A30] bg-[#202025] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-blue-500';

    return (
        <div className="space-y-6">
            <div className="rounded-xl border border-[#2A2A30] bg-[#1A1A1E] p-5">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[240px]">
                        <Search size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input className={`${inputClass} pl-11`} placeholder="Search by username or name..." value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} />
                    </div>
                    <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
                        <span className="inline-flex items-center gap-1"><ShieldCheck size={12} /> Verified profiles</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Tier</p>
                        <div className="flex flex-wrap gap-2">
                            {TIERS.map((tier) => (
                                <button key={tier} onClick={() => setFilters((f) => ({ ...f, tier: f.tier === tier ? '' : tier }))} className={pillClass(filters.tier === tier)}>
                                    {tier}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Niche</p>
                        <div className="flex flex-wrap gap-2">
                            {NICHES.map((niche) => (
                                <button key={niche} onClick={() => setFilters((f) => ({ ...f, niche: f.niche === niche ? '' : niche }))} className={pillClass(filters.niche === niche)}>
                                    {niche}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                        <input type="number" className={inputClass} placeholder="Min ER%" value={filters.minER} onChange={(e) => setFilters((f) => ({ ...f, minER: e.target.value }))} />
                        <input type="number" className={inputClass} placeholder="Min score" value={filters.minScore} onChange={(e) => setFilters((f) => ({ ...f, minScore: e.target.value }))} />
                        <input type="number" className={inputClass} placeholder="Max rate" value={filters.maxRate} onChange={(e) => setFilters((f) => ({ ...f, maxRate: e.target.value }))} />
                    </div>
                </div>
            </div>

            {loading && <p className="text-sm font-medium text-gray-400">Finding influencers...</p>}
            {error && <p className="text-sm font-medium text-red-400">{error}</p>}

            <div className="grid gap-6 lg:grid-cols-2">
                <AnimatePresence>
                    {influencers.map((inf, i) => {
                        const primaryNiche = inf.niche?.[0] || 'lifestyle';
                        const avatar = inf.avatar || inf.profilePictureURL || inf.igProfileUrl;
                        const followerCount = inf.followersCount || inf.igFollowersCount || inf.audienceSize || 0;
                        const engagementRate = inf.avgEngagementRate || inf.engagementRate || inf.overallEngagementRate;
                        return (
                            <motion.div key={inf._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="overflow-hidden rounded-xl border border-[#2A2A30] bg-[#1A1A1E]">
                                <div className="h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-300" />
                                <div className="space-y-5 p-6">
                                    <div className="flex items-start gap-4">
                                        {avatar ? (
                                            <img src={avatar} alt="" className="h-16 w-16 rounded-2xl object-cover ring-1 ring-[#2A2A30]" />
                                        ) : (
                                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#202025] text-lg font-bold text-white ring-1 ring-[#2A2A30]">
                                                {(inf.displayName || inf.igUsername || 'C')[0].toUpperCase()}
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="truncate text-base font-semibold text-white">{inf.displayName || inf.igUsername || 'Creator'}</p>
                                                {inf.followerTier && <span className="rounded-full border border-[#2A2A30] bg-[#202025] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-300">{inf.followerTier}</span>}
                                            </div>
                                            <p className="mt-1 text-xs text-gray-400">@{inf.igUsername} <span className="mx-1">•</span> {inf.country || 'Global'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] uppercase tracking-wider text-gray-500">Fit</p>
                                            <p className="text-2xl font-bold text-blue-300">4.8</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="rounded-xl border border-[#2A2A30] bg-[#202025] p-3">
                                            <p className="text-[10px] uppercase tracking-wider text-gray-400">Followers</p>
                                            <p className="mt-1 text-lg font-semibold text-white">{Number(followerCount).toLocaleString()}</p>
                                        </div>
                                        <div className="rounded-xl border border-[#2A2A30] bg-[#202025] p-3">
                                            <p className="text-[10px] uppercase tracking-wider text-gray-400">ER</p>
                                            <p className="mt-1 text-lg font-semibold text-white">{engagementRate != null ? `${Number(engagementRate).toFixed(1)}%` : '—'}</p>
                                        </div>
                                        <div className="rounded-xl border border-[#2A2A30] bg-[#202025] p-3">
                                            <p className="text-[10px] uppercase tracking-wider text-gray-400">Tier</p>
                                            <p className="mt-1 text-lg font-semibold capitalize text-white">{inf.followerTier || '—'}</p>
                                        </div>
                                    </div>

                                    <p className="text-sm leading-7 text-gray-400 line-clamp-2">
                                        {inf.bio || `Creative ${primaryNiche} influencer focusing on authentic content and engaging storytelling.`}
                                    </p>

                                    <div className="flex flex-wrap gap-2">
                                        <span className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wide ${getPillColor(primaryNiche)}`}>
                                            {primaryNiche}
                                        </span>
                                        {inf.city && (
                                            <span className="inline-flex items-center gap-1 rounded-full border border-[#2A2A30] bg-[#202025] px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                                                <MapPin size={10} /> {inf.city}
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="rounded-xl border border-[#2A2A30] bg-[#202025] p-4">
                                            <div className="mb-1 flex items-center gap-1.5 text-blue-300">
                                                <Star size={12} />
                                                <span className="text-[10px] font-semibold uppercase tracking-wide">IG Post</span>
                                            </div>
                                            <p className="text-lg font-semibold text-white">${inf.rates?.postPrice || inf.avgPostPrice || 250}</p>
                                        </div>
                                        <div className="rounded-xl border border-[#2A2A30] bg-[#202025] p-4">
                                            <div className="mb-1 flex items-center gap-1.5 text-emerald-300">
                                                <Target size={12} />
                                                <span className="text-[10px] font-semibold uppercase tracking-wide">IG Reel</span>
                                            </div>
                                            <p className="text-lg font-semibold text-white">${inf.rates?.reelPrice || inf.avgReelPrice || 350}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button type="button" onClick={() => setSelectedId(selectedId === inf._id ? null : inf._id)} className="flex-1 rounded-lg border border-[#2A2A30] bg-[#202025] px-4 py-3 text-sm font-semibold text-gray-300 transition hover:bg-[#2A2A30]">
                                            {selectedId === inf._id ? 'Hide Profile' : 'View Profile'}
                                        </button>
                                        <button type="button" onClick={() => setSelectedId(inf._id)} className="flex-[1.5] rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500">
                                            Request
                                        </button>
                                    </div>

                                    <AnimatePresence>
                                        {selectedId === inf._id && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                                <div className="mt-5 space-y-5 border-t border-[#2A2A30] pt-5">
                                                    <InfluencerProfileMetrics influencerId={inf._id} />
                                                    <RequestCollaborationButton influencerId={inf._id} influencerName={inf.igUsername || inf.displayName} rates={inf.rates || { reelPrice: inf.avgReelPrice, postPrice: inf.avgPostPrice }} />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {!loading && influencers.length === 0 && (
                <div className="rounded-xl border border-dashed border-[#2A2A30] bg-[#1A1A1E] p-10 text-center">
                    <Users className="mx-auto mb-4 text-gray-500" size={44} />
                    <p className="text-lg font-semibold text-white">No influencers found</p>
                    <p className="mt-2 text-sm text-gray-400">Try adjusting your filters or search terms.</p>
                </div>
            )}
        </div>
    );
}
