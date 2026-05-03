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

    const blockClass = 'rounded-xl border border-[#2A2A30] bg-[#1A1A1E] p-5 space-y-4';
    const copyClass = 'inline-flex items-center gap-2 rounded-lg border border-[#2A2A30] bg-[#202025] px-3 py-1.5 text-xs font-medium text-gray-300 transition hover:bg-[#2A2A30]';

    return (
        <div className="space-y-5">
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200/70">Brand tracking setup</p>
                <h3 className="mt-2 text-lg font-semibold text-white">Share these integration options with brands</h3>
                <p className="mt-2 text-sm text-gray-300">
                    Use the webhook if the brand can send server-side purchase events. Use the pixel if they can only add a script tag to a confirmation page.
                </p>
            </div>

            <div className={blockClass}>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold text-white">Webhook tracking</p>
                        <p className="mt-1 text-xs text-gray-400">Recommended for the most accurate purchase attribution.</p>
                    </div>
                    <button onClick={() => copy(webhookCode, 'webhook')} className={copyClass}>
                        {copied === 'webhook' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied === 'webhook' ? 'Copied' : 'Copy'}
                    </button>
                </div>
                <pre className="overflow-x-auto rounded-lg border border-[#2A2A30] bg-black/40 p-4 text-xs leading-6 text-gray-300">
                    {webhookCode}
                </pre>
            </div>

            <div className={blockClass}>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold text-white">Browser pixel</p>
                        <p className="mt-1 text-xs text-gray-400">Fallback option for brands that cannot wire webhooks.</p>
                    </div>
                    <button onClick={() => copy(pixelCode, 'pixel')} className={copyClass}>
                        {copied === 'pixel' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied === 'pixel' ? 'Copied' : 'Copy'}
                    </button>
                </div>
                <pre className="overflow-x-auto rounded-lg border border-[#2A2A30] bg-black/40 p-4 text-xs leading-6 text-gray-300">
                    {pixelCode}
                </pre>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Pixel script URL: https://www.porchest.com/pixel.js</span>
                </div>
            </div>
        </div>
    );
}
