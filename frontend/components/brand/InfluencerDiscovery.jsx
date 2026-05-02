'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApi } from '../../hooks/useApi';
import InfluencerProfileMetrics from './InfluencerProfileMetrics';
import RequestCollaborationButton from './RequestCollaborationButton';

const TIERS = ['nano', 'micro', 'macro', 'mega'];
const NICHES = ['fashion', 'beauty', 'tech', 'food', 'travel', 'fitness', 'gaming', 'finance', 'education', 'lifestyle'];

const getPillColor = (niche) => {
    const colors = {
        fashion: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
        fitness: 'bg-green-500/10 text-green-400 border border-green-500/20',
        food: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
        beauty: 'bg-pink-500/10 text-pink-400 border border-pink-500/20',
        tech: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    };
    return colors[niche?.toLowerCase()] || 'bg-white/5 text-white/50 border border-white/10';
};

export default function InfluencerDiscovery() {
    const [filters, setFilters] = useState({ search: '', niche: '', tier: '', minER: '', minScore: '', maxRate: '' });
    const [selectedId, setSelectedId] = useState(null);
    const query = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([, value]) => value))).toString();
    const { data, loading, error } = useApi(`/discover/influencers?${query}`);
    const influencers = data?.influencers || [];

    const inputClass = 'px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 placeholder-white/30 transition-all';

    return (
        <div className="space-y-6">
            <div className="p-6 rounded-[20px] bg-white/[0.03] border border-white/[0.07] space-y-4">
                <input className={`w-full ${inputClass}`} placeholder="Search by username or name..." value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} />
                <div className="flex flex-wrap gap-2">
                    {TIERS.map((tier) => (
                        <button key={tier} onClick={() => setFilters((f) => ({ ...f, tier: f.tier === tier ? '' : tier }))} 
                            className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${filters.tier === tier ? 'bg-purple-500 border-purple-500 text-white shadow-md shadow-purple-500/20' : 'bg-white/[0.04] border border-white/[0.08] text-white/50 hover:border-white/20'}`}>
                            {tier}
                        </button>
                    ))}
                    <div className="w-[1px] h-6 bg-white/[0.08] mx-1 self-center" />
                    {NICHES.map((niche) => (
                        <button key={niche} onClick={() => setFilters((f) => ({ ...f, niche: f.niche === niche ? '' : niche }))} 
                            className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${filters.niche === niche ? 'bg-blue-500 border-blue-500 text-white shadow-md shadow-blue-500/20' : 'bg-white/[0.04] border border-white/[0.08] text-white/50 hover:border-white/20'}`}>
                            {niche}
                        </button>
                    ))}
                </div>
                <div className="flex flex-wrap gap-3">
                    <input type="number" className={inputClass} placeholder="Min ER%" value={filters.minER} onChange={(e) => setFilters((f) => ({ ...f, minER: e.target.value }))} />
                    <input type="number" className={inputClass} placeholder="Min score" value={filters.minScore} onChange={(e) => setFilters((f) => ({ ...f, minScore: e.target.value }))} />
                    <input type="number" className={inputClass} placeholder="Max rate" value={filters.maxRate} onChange={(e) => setFilters((f) => ({ ...f, maxRate: e.target.value }))} />
                </div>
            </div>

            {loading && <p className="text-white/40 text-sm font-medium">Finding influencers...</p>}
            {error && <p className="text-red-400 text-sm font-medium">{error}</p>}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {influencers.map((inf, i) => {
                    const primaryNiche = inf.niche?.[0] || 'lifestyle';
                    const avatar = inf.avatar || inf.profilePictureURL || inf.igProfileUrl;
                    const followerCount = inf.followersCount || inf.igFollowersCount || inf.audienceSize || 0;
                    const engagementRate = inf.avgEngagementRate || inf.engagementRate || inf.overallEngagementRate;
                    return (
                        <motion.div key={inf._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} 
                            className="overflow-hidden rounded-[24px] border border-white/[0.08] bg-white/[0.03] shadow-[0_22px_60px_rgba(0,0,0,0.22)] transition-all hover:border-white/[0.14] hover:bg-white/[0.05] flex flex-col justify-between">
                            <div className="h-1 bg-gradient-to-r from-purple-500 via-fuchsia-400 to-amber-300" />
                            <div className="space-y-4 p-6">
                            
                            {/* Card Header */}
                            <div className="flex items-start gap-4">
                                {avatar ? (
                                    <img src={avatar} alt="" className="w-16 h-16 rounded-[18px] object-cover border border-white/[0.12] shadow-lg shadow-black/20" />
                                ) : (
                                    <div className="w-16 h-16 rounded-[18px] bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-black/20">
                                        {(inf.displayName || inf.igUsername || 'C')[0].toUpperCase()}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0 pt-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-white font-bold text-base truncate">{inf.displayName || inf.igUsername || 'Creator'}</p>
                                        {inf.followerTier && (
                                            <span className="px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-[10px] font-bold uppercase tracking-wide text-white/70">
                                                {inf.followerTier}
                                            </span>
                                        )}
                                        <div className="w-4 h-4 bg-green-500/15 rounded-full flex items-center justify-center text-green-400">
                                            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                        </div>
                                    </div>
                                    <p className="text-xs text-white/40 mt-0.5">@{inf.igUsername} <span className="mx-1">•</span> {inf.country || 'Global'}</p>
                                </div>
                                <div className="text-right pt-1">
                                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-wide">Fit Score</p>
                                    <p className="text-2xl font-bold text-purple-300">4.8</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-white/30">Followers</p>
                                    <p className="mt-1 text-lg font-bold text-white">{Number(followerCount).toLocaleString()}</p>
                                </div>
                                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-white/30">ER</p>
                                    <p className="mt-1 text-lg font-bold text-white">{engagementRate != null ? `${Number(engagementRate).toFixed(1)}%` : '—'}</p>
                                </div>
                                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-white/30">Tier</p>
                                    <p className="mt-1 text-lg font-bold text-white capitalize">{inf.followerTier || '—'}</p>
                                </div>
                            </div>

                            {/* Bio / Description */}
                            <p className="text-sm text-white/60 leading-relaxed line-clamp-2">
                                {inf.bio || `Creative ${primaryNiche} influencer focusing on authentic content and engaging storytelling.`}
                            </p>

                            <div className="flex flex-wrap gap-2">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${getPillColor(primaryNiche)}`}>
                                    {primaryNiche}
                                </span>
                                {inf.city && (
                                    <span className="px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-[10px] font-bold uppercase tracking-wide text-white/60">
                                        {inf.city}
                                    </span>
                                )}
                            </div>

                            {/* Rates Grid */}
                            <div className="grid grid-cols-2 gap-3 mt-4">
                                <div className="p-3.5 rounded-2xl bg-purple-500/[0.08] border border-purple-500/[0.16]">
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        <svg className="w-3.5 h-3.5 text-purple-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                                        <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wide">IG POST</span>
                                    </div>
                                    <p className="text-white font-bold text-lg">${inf.rates?.postPrice || inf.avgPostPrice || 250}</p>
                                </div>
                                <div className="p-3.5 rounded-2xl bg-blue-500/[0.08] border border-blue-500/[0.16]">
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        <svg className="w-3.5 h-3.5 text-blue-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                                        <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wide">IG REEL</span>
                                    </div>
                                    <p className="text-white font-bold text-lg">${inf.rates?.reelPrice || inf.avgReelPrice || 350}</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setSelectedId(selectedId === inf._id ? null : inf._id)} 
                                    className="flex-1 py-3 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/60 font-bold text-sm hover:bg-white/[0.1] hover:border-white/[0.14] transition-all">
                                    {selectedId === inf._id ? 'Hide Profile' : 'View Profile'}
                                </button>
                                <button type="button" onClick={() => setSelectedId(inf._id)} 
                                    className="flex-[1.5] py-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold text-sm hover:shadow-lg hover:shadow-purple-500/20 transition-all flex items-center justify-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                                    Request
                                </button>
                            </div>

                            <AnimatePresence>
                                {selectedId === inf._id && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                        <div className="pt-5 mt-5 border-t border-white/[0.06] space-y-5">
                                            <InfluencerProfileMetrics influencerId={inf._id} />
                                            {/* Note: The RequestCollaborationButton handles the actual popup form */}
                                            <RequestCollaborationButton influencerId={inf._id} influencerName={inf.igUsername || inf.displayName} rates={inf.rates || { reelPrice: inf.avgReelPrice, postPrice: inf.avgPostPrice }} />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {!loading && influencers.length === 0 && (
                <div className="text-center py-16 bg-white/[0.03] border border-white/[0.07] rounded-[20px]">
                    <svg className="w-12 h-12 text-white/15 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    <p className="text-white font-bold text-lg mb-1">No influencers found</p>
                    <p className="text-white/40 text-sm">Try adjusting your filters or search terms.</p>
                </div>
            )}
        </div>
    );
}
