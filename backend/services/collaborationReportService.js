const ClickEvent = require('../models/ClickEvent');
const PurchaseEvent = require('../models/PurchaseEvent');

function toNumber(value, fallback = 0) {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
}

function firstDefined(...values) {
    for (const value of values) {
        if (value !== undefined && value !== null && value !== '') return value;
    }
    return null;
}

function resolveDeadline(collaboration) {
    return firstDefined(
        collaboration?.campaignEndAt,
        collaboration?.campaignEndDate,
        collaboration?.timeline?.campaignEndDate,
        collaboration?.brief?.postingDeadline,
        collaboration?.postingDeadline
    );
}

function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString();
}

function formatDateTime(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString();
}

function wrapText(text, maxLength = 92) {
    const source = String(text || '').trim();
    if (!source) return ['—'];

    const lines = [];
    for (const paragraph of source.split(/\r?\n/)) {
        const words = paragraph.split(/\s+/).filter(Boolean);
        if (!words.length) {
            lines.push('');
            continue;
        }

        let current = '';
        for (const word of words) {
            const next = current ? `${current} ${word}` : word;
            if (next.length > maxLength && current) {
                lines.push(current);
                current = word;
            } else {
                current = next;
            }
        }
        if (current) lines.push(current);
    }

    return lines.length ? lines : ['—'];
}

function escapePdfText(text) {
    return String(text || '')
        .replace(/\\/g, '\\\\')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)')
        .replace(/\r/g, '');
}

function buildLineBlocks(sections) {
    const blocks = [];
    for (const section of sections) {
        blocks.push(`## ${section.title}`);
        for (const row of section.rows || []) {
            const label = row.label ? `${row.label}: ` : '';
            const value = row.value == null ? '—' : row.value;
            const wrapped = wrapText(value, 88);
            wrapped.forEach((line, index) => {
                blocks.push(index === 0 ? `${label}${line}` : `  ${line}`);
            });
        }
        blocks.push('');
    }
    return blocks;
}

function buildPdfObjectsFromLines(lines, title) {
    const lineHeight = 13;
    const headerHeight = 48;
    const topMargin = 40;
    const bottomMargin = 40;
    const linesPerPage = Math.max(1, Math.floor((792 - topMargin - bottomMargin - headerHeight) / lineHeight));
    const pages = [];

    for (let i = 0; i < lines.length; i += linesPerPage) {
        pages.push(lines.slice(i, i + linesPerPage));
    }

    const objects = {
        1: '<< /Type /Catalog /Pages 2 0 R >>',
        3: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    };
    const pageRefs = [];

    for (let pageIndex = 0; pageIndex < pages.length; pageIndex += 1) {
        const pageNumber = pageIndex + 1;
        const pageLines = pages[pageIndex];
        const contentLines = [];
        const startY = 742;

        contentLines.push('BT');
        contentLines.push('/F1 18 Tf');
        contentLines.push(`50 ${startY} Td`);
        contentLines.push(`(${escapePdfText(title)}) Tj`);
        contentLines.push('T*');
        contentLines.push('/F1 10 Tf');
        contentLines.push('12 TL');

        for (const line of pageLines) {
            if (line.startsWith('## ')) {
                contentLines.push('/F1 11 Tf');
                contentLines.push(`(${escapePdfText(line.slice(3))}) Tj`);
                contentLines.push('T*');
                contentLines.push('/F1 10 Tf');
                continue;
            }

            contentLines.push(`(${escapePdfText(line)}) Tj`);
            contentLines.push('T*');
        }

        contentLines.push('ET');
        contentLines.push('BT');
        contentLines.push('/F1 9 Tf');
        contentLines.push(`50 24 Td`);
        contentLines.push(`(Page ${pageNumber} of ${pages.length}) Tj`);
        contentLines.push('ET');

        const stream = contentLines.join('\n');
        const pageObjectNumber = 4 + (pageIndex * 2);
        const contentObjectNumber = 5 + (pageIndex * 2);
        pageRefs.push(`${pageObjectNumber} 0 R`);

        objects[pageObjectNumber] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`;
        objects[contentObjectNumber] = `<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream`;
    }

    objects[2] = `<< /Type /Pages /Kids [${pageRefs.join(' ')}] /Count ${pageRefs.length} >>`;

    const parts = ['%PDF-1.4\n'];
    const offsets = ['0000000000 65535 f \n'];
    let offset = Buffer.byteLength(parts[0], 'utf8');

    const totalObjects = Math.max(...Object.keys(objects).map(Number));
    for (let objNumber = 1; objNumber <= totalObjects; objNumber += 1) {
        const bodyContent = objects[objNumber];
        if (!bodyContent) {
            throw new Error(`Missing PDF object ${objNumber}`);
        }
        offsets.push(`${String(offset).padStart(10, '0')} 00000 n \n`);
        const body = `${objNumber} 0 obj\n${bodyContent}\nendobj\n`;
        parts.push(body);
        offset += Buffer.byteLength(body, 'utf8');
    }

    const xrefStart = offset;
    const xref = [
        'xref',
        `0 ${totalObjects + 1}`,
        ...offsets,
        'trailer',
        `<< /Size ${totalObjects + 1} /Root 1 0 R >>`,
        'startxref',
        String(xrefStart),
        '%%EOF',
        '',
    ].join('\n');

    parts.push(xref);
    return Buffer.from(parts.join(''), 'utf8');
}

async function buildCollaborationAnalytics(collaboration) {
    const collaborationId = collaboration?._id;
    if (!collaborationId) {
        return {
            summary: {},
            recentClicks: [],
            recentPurchases: [],
        };
    }

    const periodDaysInput = Number(collaboration?.analyticsPeriodDays || collaboration?.periodDays || collaboration?.analytics?.periodDays || 30);
    const periodDays = [1, 10, 20, 30].includes(periodDaysInput) ? periodDaysInput : 30;
    const windowStart = new Date(Date.now() - (periodDays * 24 * 60 * 60 * 1000));

    const [clicks, purchases] = await Promise.all([
        ClickEvent.find({ collaborationId, timestamp: { $gte: windowStart } })
            .sort({ timestamp: -1 })
            .limit(20)
            .lean(),
        PurchaseEvent.find({ collaborationId, timestamp: { $gte: windowStart } })
            .sort({ timestamp: -1 })
            .limit(20)
            .lean(),
    ]);

    const clickCount = await ClickEvent.countDocuments({ collaborationId, timestamp: { $gte: windowStart } });
    const uniqueClicks = await ClickEvent.countDocuments({ collaborationId, isUnique: true, timestamp: { $gte: windowStart } });
    const purchaseCount = await PurchaseEvent.countDocuments({ collaborationId, timestamp: { $gte: windowStart } });
    const revenueAgg = await PurchaseEvent.aggregate([
        { $match: { collaborationId, timestamp: { $gte: windowStart } } },
        { $group: { _id: null, revenue: { $sum: '$orderValue' } } },
    ]);
    const revenue = toNumber(revenueAgg?.[0]?.revenue, 0);
    const metrics = collaboration.metrics || {};
    const deadline = resolveDeadline(collaboration);
    const deadlineDate = deadline ? new Date(deadline) : null;
    const daysRemaining = deadlineDate
        ? Math.ceil((deadlineDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
        : null;

    return {
        summary: {
            campaignId: String(collaboration._id),
            campaignName: collaboration.campaignTitle || collaboration.brief?.campaignObjective || 'Campaign',
            influencerName: collaboration.influencerName || collaboration.influencerProfile?.fullName || '—',
            status: collaboration.status,
            price: toNumber(collaboration.pricing?.agreedFee ?? collaboration.agreedFee ?? collaboration.pricing?.brandOffer ?? collaboration.brandOfferedFee, 0),
            deadline: formatDate(deadline),
            daysRemaining: Number.isFinite(daysRemaining) ? daysRemaining : null,
            periodDays,
            clickCount,
            uniqueClicks,
            purchaseCount,
            revenue,
            metrics: {
                clicks: metrics.clicks ?? clickCount,
                visits: metrics.visits ?? uniqueClicks,
                conversions: metrics.conversions ?? purchaseCount,
                revenue: metrics.revenue ?? revenue,
                reach: metrics.reach ?? 0,
                impressions: metrics.impressions ?? 0,
                engagementRate: metrics.engagementRate ?? 0,
                roas: metrics.roas ?? 0,
                cpa: metrics.cpa ?? 0,
                lastUpdatedAt: metrics.lastUpdatedAt || null,
            },
            trackingLink: collaboration.brief?.trackingLink || '',
            promoCode: collaboration.brief?.promoCode || '',
        },
        recentClicks: clicks.map((click) => ({
            id: String(click._id),
            timestamp: formatDateTime(click.timestamp),
            influencerName: collaboration.influencerName || collaboration.influencerProfile?.fullName || '—',
            campaignName: collaboration.campaignTitle || collaboration.brief?.campaignObjective || 'Campaign',
            referrer: click.referrer || '—',
            isUnique: Boolean(click.isUnique),
        })),
        recentPurchases: purchases.map((purchase) => ({
            id: String(purchase._id),
            timestamp: formatDateTime(purchase.timestamp),
            orderId: purchase.orderId,
            orderValue: toNumber(purchase.orderValue, 0),
            currency: purchase.currency || 'USD',
            source: purchase.source || 'pixel',
            collaborationId: String(purchase.collaborationId || collaborationId),
            influencerName: collaboration.influencerName || collaboration.influencerProfile?.fullName || '—',
            withinWindow: Boolean(purchase.withinWindow),
        })),
        issues: [],
    };
}

async function buildCollaborationPdfBuffer({ collaboration, analytics }) {
    const deadline = resolveDeadline(collaboration);
    const brief = collaboration.brief || {};
    const content = collaboration.content || {};
    const pricing = collaboration.pricing || {};
    const metrics = collaboration.metrics || {};

    const sections = [
        {
            title: 'Campaign Details',
            rows: [
                { label: 'Campaign name', value: collaboration.campaignTitle || brief.campaignObjective || 'Campaign' },
                { label: 'Brand', value: collaboration.brandName || collaboration.brandProfile?.businessName || '—' },
                { label: 'Influencer', value: collaboration.influencerName || collaboration.influencerProfile?.fullName || '—' },
                { label: 'Status', value: collaboration.status || '—' },
                { label: 'Price', value: `USD ${toNumber(pricing.agreedFee ?? collaboration.agreedFee ?? collaboration.agreedPrice ?? pricing.brandOffer ?? collaboration.brandOfferedFee, 0).toLocaleString()}` },
                { label: 'Deadline', value: formatDate(deadline) },
            ],
        },
        {
            title: 'Tracking',
            rows: [
                { label: 'Tracking link', value: brief.trackingLink || '—' },
                { label: 'Promo code', value: brief.promoCode || '—' },
            ],
        },
        {
            title: 'Requirements',
            rows: [
                { label: 'Description', value: collaboration.campaignDescription || brief.productDetails || '—' },
                { label: 'Deliverables', value: Array.isArray(collaboration.deliverables) ? collaboration.deliverables.join(', ') : (brief.deliverables || '—') },
                { label: 'Content guidelines', value: collaboration.contentGuidelines || brief.captionGuidelines || '—' },
                { label: 'Hashtags', value: Array.isArray(collaboration.hashtags) ? collaboration.hashtags.join(' ') : (brief.hashtags || brief.requiredHashtags || '—') },
                { label: 'Disclosure', value: collaboration.disclosureRequirements || brief.disclosureRequirements || '—' },
            ],
        },
        {
            title: 'Performance',
            rows: [
                { label: 'Clicks', value: toNumber(analytics?.summary?.clickCount ?? metrics.clicks, 0).toLocaleString() },
                { label: 'Unique visitors', value: toNumber(analytics?.summary?.uniqueClicks ?? metrics.visits, 0).toLocaleString() },
                { label: 'Conversions', value: toNumber(analytics?.summary?.purchaseCount ?? metrics.conversions, 0).toLocaleString() },
                { label: 'Revenue', value: `$${toNumber(analytics?.summary?.revenue ?? metrics.revenue, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
                { label: 'Reach', value: toNumber(metrics.reach, 0).toLocaleString() },
                { label: 'Impressions', value: toNumber(metrics.impressions, 0).toLocaleString() },
                { label: 'Engagement rate', value: metrics.engagementRate != null ? `${Number(metrics.engagementRate).toFixed(2)}%` : '—' },
                { label: 'ROAS', value: metrics.roas != null ? `${Number(metrics.roas).toFixed(2)}x` : '—' },
                { label: 'CPA', value: metrics.cpa != null ? `$${Number(metrics.cpa).toFixed(2)}` : '—' },
            ],
        },
    ];

    if (content.postLink) {
        sections.push({
            title: 'Posted Content',
            rows: [
                { label: 'Instagram post', value: content.postLink },
            ],
        });
    }

    const lines = buildLineBlocks(sections);
    return buildPdfObjectsFromLines(lines, `Porchest Collaboration Report - ${collaboration.campaignTitle || 'Campaign'}`);
}

module.exports = {
    buildCollaborationAnalytics,
    buildCollaborationPdfBuffer,
    resolveDeadline,
    formatDate,
    formatDateTime,
};
