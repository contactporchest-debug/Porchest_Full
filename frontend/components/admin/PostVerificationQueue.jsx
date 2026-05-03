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

    if (loading) return <p style={{ color: '#7A5030', fontSize: '14px', fontWeight: 500 }}>Loading queue...</p>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1A0A00' }}>Post verification queue</h2>
            {collabs.length === 0 && <p style={{ color: '#7A5030', fontSize: '14px' }}>No posts awaiting verification.</p>}
            {collabs.map((c) => (
                <div key={c._id} style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.6)', border: '1px solid #EDD9BC', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 4px 12px rgba(26,10,0,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                        <div>
                            <p style={{ color: '#1A0A00', fontWeight: 700, fontSize: '15px' }}>{c.brief?.campaignObjective || c.campaignTitle}</p>
                            <p style={{ fontSize: '13px', color: '#7A5030', marginTop: '4px' }}>Brand: {c.brandProfile?.businessName || c.brandName} | Influencer: @{c.influencerProfile?.igUsername || c.influencerUsername}</p>
                        </div>
                        <p style={{ color: '#059669', fontWeight: 800, fontSize: '16px' }}>${Number(c.pricing?.agreedFee || c.agreedPrice || 0).toLocaleString()}</p>
                    </div>
                    {c.content?.postLink && <a href={c.content.postLink} target="_blank" rel="noopener noreferrer" style={{ color: '#C2340A', fontSize: '14px', textDecoration: 'underline', wordBreak: 'break-all', display: 'block', fontWeight: 500 }}>{c.content.postLink}</a>}
                    <button onClick={() => verify(c._id)} disabled={verifying === c._id} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#059669', color: '#fff', fontSize: '14px', fontWeight: 700, border: 'none', cursor: verifying === c._id ? 'not-allowed' : 'pointer', opacity: verifying === c._id ? 0.4 : 1, transition: 'background-color 0.15s', fontFamily: 'inherit' }}
                        onMouseEnter={e => { if (verifying !== c._id) e.currentTarget.style.background = '#047857' }}
                        onMouseLeave={e => { if (verifying !== c._id) e.currentTarget.style.background = '#059669' }}>
                        {verifying === c._id ? 'Verifying...' : 'Verify and release payment'}
                    </button>
                </div>
            ))}
        </div>
    );
}
