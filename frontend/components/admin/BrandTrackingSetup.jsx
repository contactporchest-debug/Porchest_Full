'use client';

import { useState } from 'react';
import { Check, Copy, ExternalLink } from 'lucide-react';

export default function BrandTrackingSetup() {
    const [copied, setCopied] = useState(null);
    const webhookSecret = process.env.NEXT_PUBLIC_WEBHOOK_SECRET || 'YOUR_WEBHOOK_SECRET';

    const webhookCode = `await fetch('https://www.porchest.com/api/webhook/purchase', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    promoCode: orderPromoCode,
    orderValue: order.total,
    orderId: order.id,
    currency: 'USD',
    webhookSecret: '${webhookSecret}'
  })
});`;

    const pixelCode = `<script src="https://www.porchest.com/pixel.js"></script>
<script>
  porchest.track('Purchase', {
    orderId: '{{order.id}}',
    orderValue: {{order.total}},
    currency: 'USD'
  });
</script>`;

    function copy(text, key) {
        navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(null), 1800);
    }

    const blockStyle = {
        borderRadius: '16px',
        border: '1px solid #EDD9BC',
        background: 'rgba(255,255,255,0.6)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '16px',
        boxShadow: '0 4px 12px rgba(26,10,0,0.02)'
    };
    
    const copyStyle = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        borderRadius: '8px',
        border: '1px solid #EDD9BC',
        background: 'rgba(255,255,255,0.8)',
        padding: '6px 12px',
        fontSize: '12px',
        fontWeight: 600,
        color: '#1A0A00',
        cursor: 'pointer',
        transition: 'all 0.15s'
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ borderRadius: '16px', border: '1px solid rgba(194,52,10,0.2)', background: 'rgba(194,52,10,0.06)', padding: '20px' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#C2340A' }}>Brand tracking setup</p>
                <h3 style={{ marginTop: '8px', fontSize: '18px', fontWeight: 700, color: '#1A0A00' }}>Share these integration options with brands</h3>
                <p style={{ marginTop: '8px', fontSize: '14px', color: '#7A5030', lineHeight: 1.6 }}>
                    Use the webhook if the brand can send server-side purchase events. Use the pixel if they can only add a script tag to a confirmation page.
                </p>
            </div>

            <div style={blockStyle}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                    <div>
                        <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A0A00' }}>Webhook tracking</p>
                        <p style={{ marginTop: '4px', fontSize: '12px', color: '#7A5030' }}>Recommended for the most accurate purchase attribution.</p>
                    </div>
                    <button onClick={() => copy(webhookCode, 'webhook')} style={copyStyle}
                        onMouseEnter={e => e.currentTarget.style.background = '#fff'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.8)'}>
                        {copied === 'webhook' ? <Check size={14} /> : <Copy size={14} />}
                        {copied === 'webhook' ? 'Copied' : 'Copy'}
                    </button>
                </div>
                <pre style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.8)', padding: '16px', fontSize: '12px', lineHeight: 1.6, color: '#1A0A00', fontFamily: 'monospace' }}>
                    {webhookCode}
                </pre>
            </div>

            <div style={blockStyle}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                    <div>
                        <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A0A00' }}>Browser pixel</p>
                        <p style={{ marginTop: '4px', fontSize: '12px', color: '#7A5030' }}>Fallback option for brands that cannot wire webhooks.</p>
                    </div>
                    <button onClick={() => copy(pixelCode, 'pixel')} style={copyStyle}
                        onMouseEnter={e => e.currentTarget.style.background = '#fff'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.8)'}>
                        {copied === 'pixel' ? <Check size={14} /> : <Copy size={14} />}
                        {copied === 'pixel' ? 'Copied' : 'Copy'}
                    </button>
                </div>
                <pre style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #EDD9BC', background: 'rgba(255,255,255,0.8)', padding: '16px', fontSize: '12px', lineHeight: 1.6, color: '#1A0A00', fontFamily: 'monospace' }}>
                    {pixelCode}
                </pre>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#7A5030', fontWeight: 500 }}>
                    <ExternalLink size={14} />
                    <span>Pixel script URL: https://www.porchest.com/pixel.js</span>
                </div>
            </div>
        </div>
    );
}
