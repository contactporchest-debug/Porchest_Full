export const MOCK_INFLUENCERS = [
    { id: '1', username: '@nova.style', name: 'Nova Chen', niche: 'Fashion', avatar: 'N', followers: 284000, engagement: 6.8, avgViews: 52000, avgComments: 1240, costPerPost: 1800, location: 'NYC', gender: '78% Female', age: '18-24', verified: true },
    { id: '2', username: '@fitlife.kai', name: 'Kai Patel', niche: 'Fitness', avatar: 'K', followers: 512000, engagement: 8.2, avgViews: 98000, avgComments: 3100, costPerPost: 3200, location: 'LA', gender: '55% Male', age: '22-30', verified: true },
    { id: '3', username: '@techbyrams', name: 'Ram Santoshi', niche: 'Tech', avatar: 'R', followers: 189000, engagement: 5.4, avgViews: 34000, avgComments: 890, costPerPost: 1200, location: 'SF', gender: '82% Male', age: '20-28', verified: false },
    { id: '4', username: '@foodie.luna', name: 'Luna Park', niche: 'Food', avatar: 'L', followers: 341000, engagement: 9.1, avgViews: 71000, avgComments: 4200, costPerPost: 2400, location: 'Chicago', gender: '70% Female', age: '25-34', verified: true },
    { id: '5', username: '@travelwith.max', name: 'Max Rivera', niche: 'Travel', avatar: 'M', followers: 728000, engagement: 7.3, avgViews: 124000, avgComments: 5800, costPerPost: 4500, location: 'Miami', gender: '52% Female', age: '24-35', verified: true },
    { id: '6', username: '@beauty.sofi', name: 'Sofia Martinez', niche: 'Beauty', avatar: 'S', followers: 412000, engagement: 10.2, avgViews: 87000, avgComments: 6100, costPerPost: 3800, location: 'LA', gender: '91% Female', age: '18-26', verified: true },
];

export const MOCK_CAMPAIGNS = [
    { id: '1', title: 'Summer Collection Launch', influencer: '@nova.style', avatar: 'N', status: 'live', deal: 1800, budget: 5000, start: 'Feb 15', end: 'Mar 15', postUrl: 'https://instagram.com/p/abc123', paid: true, views: 48000, likes: 3200, comments: 890 },
    { id: '2', title: 'Protein Series Campaign', influencer: '@fitlife.kai', avatar: 'K', status: 'live', deal: 3200, budget: 8000, start: 'Feb 20', end: 'Mar 20', postUrl: 'https://instagram.com/p/def456', paid: false, views: 91000, likes: 7400, comments: 2900 },
    { id: '3', title: 'Smart Gadgets Review', influencer: '@techbyrams', avatar: 'R', status: 'pending', deal: 1200, budget: 3000, start: 'Mar 1', end: 'Mar 31', postUrl: '', paid: false, views: 0, likes: 0, comments: 0 },
    { id: '4', title: 'Gourmet Box Promo', influencer: '@foodie.luna', avatar: 'L', status: 'completed', deal: 2400, budget: 6000, start: 'Jan 10', end: 'Feb 10', postUrl: 'https://instagram.com/p/ghi789', paid: true, views: 68000, likes: 6100, comments: 3800 },
];

export const MOCK_ANALYTICS = {
    views: [12000, 28000, 45000, 38000, 62000, 57000, 91000],
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    engagement: [{ name: 'Likes', value: 7400 }, { name: 'Comments', value: 2900 }, { name: 'Saves', value: 1800 }, { name: 'Shares', value: 940 }],
    demographics: [{ name: 'Female 18-24', value: 38 }, { name: 'Female 25-34', value: 22 }, { name: 'Male 18-24', value: 24 }, { name: 'Male 25-34', value: 16 }],
    sentiment: { positive: 72, neutral: 18, negative: 10 },
};

export const DEAL_HISTORY = [
    { id: '1', influencer: '@foodie.luna', avatar: 'L', deal: 2400, campaign: 'Gourmet Box Promo', outcome: 'Completed', roi: '+142%', paid: true, date: 'Feb 10' },
    { id: '2', influencer: '@nova.style', avatar: 'N', deal: 1800, campaign: 'Summer Collection', outcome: 'Live', roi: '+89%', paid: true, date: 'Mar 1' },
    { id: '3', influencer: '@fitlife.kai', avatar: 'K', deal: 3200, campaign: 'Protein Series', outcome: 'Live', roi: '+67%', paid: false, date: 'Mar 5' },
];

export const NICHES = ['All', 'Fashion', 'Fitness', 'Tech', 'Food', 'Travel', 'Beauty'];
export const FOLLOWER_RANGES = ['Any', '10K–100K', '100K–500K', '500K+'];
export const ENGAGEMENT_OPTS = ['Any', '5%+', '7%+', '9%+'];
