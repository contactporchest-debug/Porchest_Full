'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useApi, apiPatch } from '../../hooks/useApi';
import CollaborationMetrics from './CollaborationMetrics';

const TABS = [
    { key: 'pending,countered', label: 'Requests sent' },
    { key: 'accepted,active,content_submitted,content_approved,posted', label: 'Active' },
    { key: 'completed', label: 'Completed' },
];

export default function CollaborationsFlow() {
    const [activeTab, setActiveTab] = useState(0);
    const [acting, setActing] = useState(false);
    const { data, loading, refetch } = useApi(`/collaborations?status=${TABS[activeTab].key}`);
    const collabs = data?.collaborations || [];

    async function action(id, endpoint, body = {}) {
        setActing(true);
        await apiPatch(`/collaborations/${id}/${endpoint}`, body);
        await refetch();
        setActing(false);
    }

    return (
        <div className="space-y-5">
            <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10 w-fit">
                {TABS.map((tab, i) => (
                    <button key={tab.key} onClick={() => setActiveTab(i)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === i ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {loading && <p className="text-gray-400 text-sm">Loading...</p>}

            {collabs.map((c, i) => (
                <motion.div key={c._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-white font-medium">{c.brief?.campaignObjective || c.campaignTitle || 'Collaboration'}</p>
                            <p className="text-xs text-gray-400">@{c.influencerProfile?.igUsername || c.influencerUsername || 'creator'}</p>
                            <p className="text-xs text-gray-500">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xl font-semibold text-white">${Number(c.pricing?.agreedFee || c.pricing?.brandOffer || 0).toLocaleString()}</p>
                            <span className="text-xs px-2 py-0.5 rounded-full border capitalize bg-purple-900/20 border-purple-500/30 text-purple-300">{c.status?.replace('_', ' ')}</span>
                        </div>
                    </div>

                    {c.status === 'countered' && c.pricing?.influencerCounter && (
                        <div className="p-4 rounded-xl bg-orange-900/20 border border-orange-500/30 space-y-3">
                            <p className="text-orange-300 text-sm font-medium">Influencer countered at ${Number(c.pricing.influencerCounter).toLocaleString()}</p>
                            <div className="flex gap-3">
                                <button onClick={() => action(c._id, 'accept-counter')} disabled={acting} className="flex-1 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium disabled:opacity-40">Accept counter</button>
                                <button onClick={() => action(c._id, 'decline')} disabled={acting} className="px-4 py-2 rounded-lg border border-red-500/30 bg-red-900/20 text-red-400 text-sm disabled:opacity-40">Decline</button>
                            </div>
                        </div>
                    )}

                    {c.status === 'content_submitted' && c.content?.driveLink && (
                        <div className="p-4 rounded-xl bg-blue-900/20 border border-blue-500/30 space-y-3">
                            <p className="text-blue-300 text-sm font-medium">Content submitted for review</p>
                            <a href={c.content.driveLink} target="_blank" rel="noopener noreferrer" className="text-purple-400 text-sm hover:text-purple-300 underline break-all block">{c.content.driveLink}</a>
                            <button onClick={() => action(c._id, 'approve-drive')} disabled={acting} className="w-full py-2.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-medium disabled:opacity-40">Approve content</button>
                        </div>
                    )}

                    {c.status === 'posted' && c.content?.postLink && (
                        <div className="p-4 rounded-xl bg-yellow-900/20 border border-yellow-500/30">
                            <p className="text-yellow-300 text-sm font-medium">Post submitted - pending admin verification</p>
                            <a href={c.content.postLink} target="_blank" rel="noopener noreferrer" className="text-purple-400 text-sm hover:text-purple-300 underline break-all mt-1 block">{c.content.postLink}</a>
                        </div>
                    )}

                    {['accepted', 'active', 'content_submitted', 'content_approved', 'posted', 'completed'].includes(c.status) && (
                        <CollaborationMetrics collaborationId={c._id} />
                    )}

                    {c.brief?.trackingLink && (
                        <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-2">
                            <p className="text-xs text-gray-400 uppercase tracking-wider">Campaign tracking</p>
                            <p className="text-xs text-purple-300 font-mono truncate">{c.brief.trackingLink}</p>
                            <p className="text-xs text-purple-300 font-bold font-mono">{c.brief.promoCode}</p>
                        </div>
                    )}
                </motion.div>
            ))}

            {!loading && collabs.length === 0 && <div className="text-center py-12 text-gray-500 text-sm">No collaborations in this tab.</div>}
        </div>
    );
}
