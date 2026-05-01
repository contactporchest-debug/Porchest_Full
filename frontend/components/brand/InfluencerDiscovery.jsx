'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApi } from '../../hooks/useApi';
import InfluencerProfileMetrics from './InfluencerProfileMetrics';
import RequestCollaborationButton from './RequestCollaborationButton';

const TIERS = ['nano', 'micro', 'macro', 'mega'];
const NICHES = ['fashion', 'beauty', 'tech', 'food', 'travel', 'fitness', 'gaming', 'finance', 'education', 'lifestyle'];

export default function InfluencerDiscovery() {
    const [filters, setFilters] = useState({ search: '', niche: '', tier: '', minER: '', minScore: '', maxRate: '' });
    const [selectedId, setSelectedId] = useState(null);
    const query = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([, value]) => value))).toString();
    const { data, loading, error } = useApi(`/discover/influencers?${query}`);
    const influencers = data?.influencers || [];

    const inputClass = 'px-3 py-2 rounded-lg bg-black/20 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/50';

    return (
        <div className="space-y-5">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <input className={`w-full ${inputClass}`} placeholder="Search by username or name..." value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} />
                <div className="flex flex-wrap gap-2">
                    {TIERS.map((tier) => (
                        <button key={tier} onClick={() => setFilters((f) => ({ ...f, tier: f.tier === tier ? '' : tier }))} className={`px-3 py-1.5 rounded-full text-xs border capitalize ${filters.tier === tier ? 'bg-purple-600 border-purple-500 text-white' : 'bg-white/5 border-white/10 text-gray-400'}`}>
                            {tier}
                        </button>
                    ))}
                    {NICHES.map((niche) => (
                        <button key={niche} onClick={() => setFilters((f) => ({ ...f, niche: f.niche === niche ? '' : niche }))} className={`px-3 py-1.5 rounded-full text-xs border capitalize ${filters.niche === niche ? 'bg-teal-600 border-teal-500 text-white' : 'bg-white/5 border-white/10 text-gray-400'}`}>
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

            {loading && <p className="text-gray-400 text-sm">Finding influencers...</p>}
            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {influencers.map((inf, i) => (
                    <motion.div key={inf._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3 hover:border-purple-500/30 transition-all">
                        <button type="button" onClick={() => setSelectedId(selectedId === inf._id ? null : inf._id)} className="w-full text-left">
                            <div className="flex items-center gap-3">
                                {inf.igProfileUrl && <img src={inf.igProfileUrl} alt="" className="w-12 h-12 rounded-full object-cover border border-white/10" />}
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-medium truncate">@{inf.igUsername || inf.displayName || 'creator'}</p>
                                    <p className="text-xs text-gray-500 capitalize">{inf.niche?.slice(0, 2).join(', ') || 'No niche'} | {inf.country || 'No country'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-semibold text-purple-400">{Math.round(inf.porchestScore || inf.influencerScore || 0)}</p>
                                    <p className="text-xs text-gray-500">score</p>
                                </div>
                            </div>
                        </button>

                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="p-2 rounded-lg bg-white/5"><p className="text-white text-sm font-medium">{Number(inf.igFollowersCount || inf.followersCount || 0).toLocaleString()}</p><p className="text-xs text-gray-500">Followers</p></div>
                            <div className="p-2 rounded-lg bg-white/5"><p className="text-white text-sm font-medium">{Number(inf.avgEngagementRate || inf.engagementRate || 0).toFixed(1)}%</p><p className="text-xs text-gray-500">ER</p></div>
                            <div className="p-2 rounded-lg bg-white/5"><p className="text-white text-sm font-medium">{Math.round(inf.authenticityScore || 0)}%</p><p className="text-xs text-gray-500">Authentic</p></div>
                        </div>

                        <AnimatePresence>
                            {selectedId === inf._id && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                    <div className="pt-3 border-t border-white/10 space-y-4">
                                        <InfluencerProfileMetrics influencerId={inf._id} />
                                        <RequestCollaborationButton influencerId={inf._id} influencerName={inf.igUsername || inf.displayName} rates={inf.rates || { reelPrice: inf.avgReelPrice, postPrice: inf.avgPostPrice }} />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </div>

            {!loading && influencers.length === 0 && <div className="text-center py-12 text-gray-500 text-sm">No influencers found matching your filters.</div>}
        </div>
    );
}
