function hasPositiveRate(value) {
    const amount = Number(value || 0);
    return Number.isFinite(amount) && amount > 0;
}

function isMeaningfulText(value, { placeholders = [] } = {}) {
    const text = String(value ?? '').trim();
    if (!text) return false;
    return !placeholders.includes(text.toLowerCase());
}

function arrayHasItems(value) {
    return Array.isArray(value) && value.length > 0;
}

function isInstagramConnected(profile, fallback = {}) {
    return Boolean(
        profile?.instagramConnected ||
        profile?.instagramConnectionStatus === 'connected' ||
        fallback.instagramConnected ||
        fallback.instagramConnectionStatus === 'connected'
    );
}

/**
 * @param {Record<string, any> | null | undefined} profile
 * @param {Record<string, any> | null | undefined} fallback
 */
export function buildInfluencerProfileCompletion(profile = {}, fallback = {}) {
    const placeholderAccountTypes = ['select account type', 'choose account type', 'account type'];
    const checklist = [
        { key: 'fullName', label: 'Add full name', done: isMeaningfulText(profile?.fullName) },
        { key: 'contactEmail', label: 'Add contact email', done: isMeaningfulText(profile?.contactEmail) },
        { key: 'bio', label: 'Add bio', done: isMeaningfulText(profile?.bio || profile?.igBio || profile?.instagramBiography) },
        { key: 'country', label: 'Set country', done: isMeaningfulText(profile?.country || profile?.countryOfResidence) },
        { key: 'city', label: 'Set city', done: isMeaningfulText(profile?.city) },
        { key: 'niche', label: 'Select niche', done: arrayHasItems(profile?.niche) },
        { key: 'languages', label: 'Select languages', done: arrayHasItems(profile?.languages) },
        { key: 'contentStyleTags', label: 'Pick content style', done: arrayHasItems(profile?.contentStyleTags) },
        { key: 'instagramUsername', label: 'Add Instagram username', done: isMeaningfulText(profile?.instagramUsername || profile?.igUsername) },
        { key: 'instagramProfileURL', label: 'Add Instagram profile URL', done: isMeaningfulText(profile?.instagramProfileURL || profile?.profileUrl || profile?.igProfileUrl) },
        { key: 'instagramDPURL', label: 'Add profile picture URL', done: isMeaningfulText(profile?.instagramDPURL || profile?.profilePictureUrl || profile?.profileImageURL) },
        { key: 'accountType', label: 'Set Instagram account type', done: isMeaningfulText(profile?.accountType || profile?.igAccountType || profile?.instagramAccountType, { placeholders: placeholderAccountTypes }) },
        { key: 'postPrice', label: 'Set average post price', done: hasPositiveRate(profile?.rates?.postPrice ?? profile?.avgPostPrice ?? profile?.avgPostCostUSD) },
        { key: 'reelPrice', label: 'Set average reel price', done: hasPositiveRate(profile?.rates?.reelPrice ?? profile?.avgReelPrice ?? profile?.avgReelCostUSD) },
        { key: 'instagramConnected', label: 'Connect Instagram', done: isInstagramConnected(profile, fallback) },
    ];

    const doneCount = checklist.filter((item) => item.done).length;
    const percentage = Math.round((doneCount / checklist.length) * 100);
    const isComplete = doneCount === checklist.length;

    return { checklist, doneCount, percentage, isComplete };
}
