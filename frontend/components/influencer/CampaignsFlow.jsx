'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useApi, apiPatch } from '../../hooks/useApi';
import CampaignMetricsCard from './CampaignMetricsCard';

const STATUS_TABS = [
    { key: 'pending,countered', label: 'Requests' },
    { key: 'accepted,active,content_submitted,content_approved,posted', label: 'Active' },
    { key: 'completed', label: 'Completed' },
];

export default function CampaignsFlow() {
    const [activeTab, setActiveTab] = useState(0);
    const [expanded, setExpanded] = useState(null);
    const [driveLink, setDriveLink] = useState('');
    const [postLink, setPostLink] = useState('');
    const [counterAmount, setCounterAmount] = useState('');
    const [acting, setActing] = useState(false);
    const { data, loading, refetch } = useApi(`/collaborations?status=${STATUS_TABS[activeTab].key}`);
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
                {STATUS_TABS.map((tab, i) => (
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
                            <p className="text-xs text-gray-400">From: {c.brandProfile?.businessName || c.brandName || 'Brand'}</p>
                            <p className="text-xs text-gray-500">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xl font-semibold text-white">${Number(c.pricing?.agreedFee || c.pricing?.brandOffer || 0).toLocaleString()}</p>
                            <p className="text-xs text-gray-400">{c.status?.replace('_', ' ')}</p>
                        </div>
                    </div>

                    {activeTab === 0 && (
                        <>
                            <button onClick={() => setExpanded(expanded === c._id ? null : c._id)} className="text-xs text-purple-400 hover:text-purple-300">
                                {expanded === c._id ? 'Hide brief' : 'View full brief'}
                            </button>
                            {expanded === c._id && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                    {[
                                        ['Key message', c.brief?.keyMessage],
                                        ['Product details', c.brief?.productDetails],
                                        ['Content', c.brief?.contentTypes?.join(', ')],
                                        ['Deadline', c.brief?.postingSchedule ? new Date(c.brief.postingSchedule).toLocaleDateString() : null],
                                    ].filter(([, value]) => value).map(([label, value]) => (
                                        <div key={label} className="p-3 rounded-lg bg-white/5"><p className="text-xs text-gray-400">{label}</p><p className="text-white">{value}</p></div>
                                    ))}
                                </div>
                            )}
                            {c.status === 'pending' && (
                                <div className="flex flex-col md:flex-row gap-3">
                                    <button onClick={() => action(c._id, 'accept')} disabled={acting} className="flex-1 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium disabled:opacity-40">Accept</button>
                                    <input type="number" placeholder="Counter amount" value={counterAmount} onChange={(e) => setCounterAmount(e.target.value)} className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm" />
                                    <button onClick={() => action(c._id, 'counter', { counterAmount: Number(counterAmount) })} disabled={acting || !counterAmount} className="px-4 py-2 rounded-lg border border-purple-500/40 bg-purple-900/30 text-purple-300 text-sm disabled:opacity-40">Counter</button>
                                    <button onClick={() => action(c._id, 'decline')} disabled={acting} className="px-4 py-2 rounded-lg border border-red-500/30 bg-red-900/20 text-red-400 text-sm disabled:opacity-40">Decline</button>
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 1 && (
                        <>
                            {(c.brief?.trackingLink || c.brief?.promoCode) && (
                                <div className="p-4 rounded-xl bg-purple-900/20 border border-purple-500/30 space-y-3">
                                    <p className="text-sm font-medium text-purple-300">Your campaign tools</p>
                                    {c.brief?.trackingLink && <CopyValue label="Tracking link" value={c.brief.trackingLink} />}
                                    {c.brief?.promoCode && <CopyValue label="Promo code" value={c.brief.promoCode} strong />}
                                </div>
                            )}

                            {!c.content?.driveLink && (
                                <div className="flex gap-2">
                                    <input placeholder="Google Drive link" value={driveLink} onChange={(e) => setDriveLink(e.target.value)} className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm" />
                                    <button onClick={() => action(c._id, 'submit-drive', { driveLink })} disabled={acting || !driveLink} className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm disabled:opacity-40">Submit</button>
                                </div>
                            )}

                            {c.content?.brandApprovedDrive && !c.content?.postLink && (
                                <div className="flex gap-2">
                                    <input placeholder="Instagram post link" value={postLink} onChange={(e) => setPostLink(e.target.value)} className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm" />
                                    <button onClick={() => action(c._id, 'submit-post', { postLink })} disabled={acting || !postLink} className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm disabled:opacity-40">Submit post</button>
                                </div>
                            )}

                            <CampaignMetricsCard collaborationId={c._id} />
                        </>
                    )}

                    {activeTab === 2 && <CampaignMetricsCard collaborationId={c._id} />}
                </motion.div>
            ))}

            {!loading && collabs.length === 0 && <div className="text-center py-12 text-gray-500 text-sm">Nothing here yet.</div>}
        </div>
    );
}

function CopyValue({ label, value, strong = false }) {
    return (
        <div>
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <div className="flex gap-2">
                <input readOnly value={value} className={`flex-1 px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-purple-300 text-xs ${strong ? 'font-bold tracking-wider' : 'font-mono'}`} />
                <button onClick={() => navigator.clipboard.writeText(value)} className="px-3 py-2 rounded-lg bg-white/10 text-white text-xs hover:bg-white/20">Copy</button>
            </div>
        </div>
    );
}
