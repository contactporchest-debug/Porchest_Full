'use client';

import { useState } from 'react';
import { useApi, apiPatch } from '../../hooks/useApi';

export default function PostVerificationQueue() {
    const { data, loading, refetch } = useApi('/collaborations?status=posted');
    const [verifying, setVerifying] = useState(null);
    const collabs = data?.collaborations || [];

    async function verify(id) {
        setVerifying(id);
        await apiPatch(`/collaborations/${id}/verify-admin`, {});
        await refetch();
        setVerifying(null);
    }

    if (loading) return <p className="text-gray-400 text-sm">Loading queue...</p>;

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-medium text-white">Post verification queue</h2>
            {collabs.length === 0 && <p className="text-gray-500 text-sm">No posts awaiting verification.</p>}
            {collabs.map((c) => (
                <div key={c._id} className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-white font-medium">{c.brief?.campaignObjective || c.campaignTitle}</p>
                            <p className="text-xs text-gray-400">Brand: {c.brandProfile?.businessName || c.brandName} | Influencer: @{c.influencerProfile?.igUsername || c.influencerUsername}</p>
                        </div>
                        <p className="text-white font-semibold">${Number(c.pricing?.agreedFee || c.agreedPrice || 0).toLocaleString()}</p>
                    </div>
                    {c.content?.postLink && <a href={c.content.postLink} target="_blank" rel="noopener noreferrer" className="text-stone-400 text-sm underline break-all block">{c.content.postLink}</a>}
                    <button onClick={() => verify(c._id)} disabled={verifying === c._id} className="w-full py-2.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-medium disabled:opacity-40">
                        {verifying === c._id ? 'Verifying...' : 'Verify and release payment'}
                    </button>
                </div>
            ))}
        </div>
    );
}
