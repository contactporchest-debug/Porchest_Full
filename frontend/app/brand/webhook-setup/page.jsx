'use client';

import { useEffect, useState } from 'react';

export default function WebhookSetupPage() {
    const [secret, setSecret] = useState('YOUR_PORCHEST_WEBHOOK_SECRET');
    const [copied, setCopied] = useState(false);

    async function fetchSecret() {
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('porchest_token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/webhook/docs`, {
                headers: { Authorization: `Bearer ${token || ''}` },
            });
            const data = await res.json();
            if (data?.webhookSecret) setSecret(data.webhookSecret);
        } catch {
            setSecret('YOUR_PORCHEST_WEBHOOK_SECRET');
        }
    }

    useEffect(() => {
        fetchSecret();
    }, []);

    const code = `// Add this to your checkout success handler
await fetch('https://www.porchest.com/api/webhook/purchase', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    promoCode: appliedPromoCode,
    orderValue: order.total,
    orderId: order.id,
    currency: 'USD',
    webhookSecret: '${secret}'
  })
});`;

    async function copy() {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
            <div>
                <h1 className="text-2xl font-semibold text-white">Purchase tracking setup</h1>
                <p className="mt-2 text-sm text-gray-400">
                    Add this one API call to your checkout to track promo code purchases and calculate ROI.
                </p>
            </div>

            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-medium text-white">Where to add it</p>
                <ul className="list-inside list-disc space-y-1 text-sm text-gray-400">
                    <li>Put the webhook call in the brand's checkout success handler on the server.</li>
                    <li>If the brand uses Shopify Plus, WooCommerce, or a custom backend, add it after payment is confirmed.</li>
                    <li>Send the order ID, order total, promo code, and currency exactly as shown in the snippet below.</li>
                </ul>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Your integration code</p>
                    <button onClick={copy} className="text-xs text-stone-400 transition-colors hover:text-stone-300">
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                </div>
                <pre className="overflow-x-auto whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/40 p-4 text-xs text-gray-300">
                    {code}
                </pre>
            </div>

            <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-medium text-white">How it works</p>
                <ul className="list-inside list-disc space-y-1 text-sm text-gray-400">
                    <li>Porchest automatically matches the promo code to the correct influencer</li>
                    <li>Revenue is recorded and ROI is calculated instantly</li>
                    <li>Duplicate orders are safely ignored</li>
                    <li>Only purchases within the campaign window are counted</li>
                </ul>
            </div>

            <div className="rounded-2xl border border-amber-500/30 bg-amber-900/20 p-4">
                <p className="text-sm font-medium text-amber-300">Test your integration</p>
                <p className="mt-1 text-xs text-amber-400/80">
                    Call GET https://www.porchest.com/api/webhook/verify?webhookSecret={secret} to confirm your endpoint is reachable.
                </p>
            </div>
        </div>
    );
}
