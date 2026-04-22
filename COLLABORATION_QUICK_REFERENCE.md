# Collaboration System - Quick Reference Guide

## 🔗 API ENDPOINTS AT A GLANCE

### Brand Endpoints
```
POST   /api/brand/requests              Create campaign request
GET    /api/brand/requests              List all brand requests  
GET    /api/brand/requests/:id          Get request details
PATCH  /api/brand/requests/:id          Respond to counter/update status

GET    /api/brand/influencers           Search & discover influencers
GET    /api/brand/influencers/:id/details  Get influencer full profile

GET    /api/brand/verifications         Get verification status of posts
GET    /api/brand/notifications         Get notifications
```

### Influencer Endpoints
```
GET    /api/influencer/requests         Get incoming requests (⚠️ auto-updates status)
PATCH  /api/influencer/requests/:id     Accept/reject/counter request

POST   /api/influencer/verify           Submit post URL (❌ MISSING IMPL)
GET    /api/influencer/verifications    Get verification history (❌ MISSING IMPL)

GET    /api/influencer/notifications    Get notifications
```

---

## 📊 REQUEST STATUS STATE MACHINE

```
                        ┌─────────────────────┐
                        │    BRAND CREATES    │
                        │    'sent' status    │
                        └──────────┬──────────┘
                                   │
                    ┌──────────────▼───────────────┐
                    │ Influencer views request     │
                    │ (AUTO: 'sent' → 'viewed')    │
                    └──────────────┬───────────────┘
                                   │
                ┌──────────────────┼──────────────────┐
                │                  │                  │
           ┌───▼──┐          ┌──────▼─────┐    ┌─────▼────┐
           │       │          │            │    │          │
        ACCEPTED   │      REJECTED    NEGOTIATION  │    EXPIRED
           │       │          │            │    │          │
           │    (NO ACTION)   │            │    │    (auto) │
           │                  │        ┌───▼────┴──┐       │
           │                  │        │ Counter   │       │
           │                  │        │ Offer     │       │
           │                  │        └─┬──────┬──┘       │
           │                  │          │      │         │
           │              ┌───▼──────┐   │      │         │
           │              │ REJECTED │◄──┘      │         │
           │              └──────────┘          │         │
           │                                ┌───▼────┐    │
           │ (DEAL_CLOSED status)           │ACCEPTED│    │
           │        once influencer          └───┬────┘    │
           │        submits post                  │        │
           │                                      │        │
           └──────────────────────┬───────────────┘        │
                                  │                        │
                    ┌─────────────▼────────────────┐       │
                    │    DEAL_CLOSED (Final)       │       │
                    │ (Awaiting verification)      │       │
                    └──────────────────────────────┘       │
                                                           │
         ┌─────────────────────────────────────────────────┘
         │
    CANCELLED (brand cancels)
```

---

## 🛠️ KEY FUNCTIONS QUICK LOOKUP

### Backend Controllers

| Function | File | Route | What It Does |
|----------|------|-------|-------------|
| `createRequest()` | campaignRequestController | POST /brand/requests | Brand creates new request |
| `getBrandRequests()` | campaignRequestController | GET /brand/requests | List brand's requests |
| `getInfluencerRequests()` | campaignRequestController | GET /influencer/requests | List influencer's incoming requests ⚠️ has side effect |
| `respondToRequest()` | campaignRequestController | PATCH /influencer/requests/:id | Influencer accepts/rejects/counters |
| `brandRespondToRequest()` | campaignRequestController | PATCH /brand/requests/:id | Brand responds to counter |
| `getVerifications()` | campaignRequestController | GET /brand/verifications | Get verification status |
| `computeDynamicFitScore()` | brandController | — | Calculate influencer fit score (0-100) |
| `buildInfluencerCard()` | brandController | — | Format influencer data for display |

### Frontend API Methods

| Method | File | Returns | Use Case |
|--------|------|---------|----------|
| `brandAPI.createRequest(data)` | lib/api.ts | Promise<Request> | Send request to influencer |
| `brandAPI.getRequests(params)` | lib/api.ts | Promise<{requests, total, page}> | Load brand's requests |
| `brandAPI.updateRequest(id, data)` | lib/api.ts | Promise<Request> | Accept/reject counter or close deal |
| `brandAPI.getInfluencers(params)` | lib/api.ts | Promise<{influencers}> | Search influencers with filters |
| `influencerAPI.getRequests(params)` | lib/api.ts | Promise<{requests, total}> | Load incoming requests |
| `influencerAPI.respondToRequest(id, data)` | lib/api.ts | Promise<Request> | Accept/reject/counter request |

### Frontend Hooks

| Hook | File | Purpose |
|------|------|---------|
| `useSocket()` | lib/useSocket.ts | Get Socket.IO connection instance |
| `useCollaborationUpdates(callback)` | lib/useSocket.ts | Listen to real-time collaboration events |
| `emitCollaborationAction(action, data)` | lib/useSocket.ts | Emit collaboration action via socket |

---

## 📱 COMPONENT HIERARCHY

```
BRAND SIDE
├── /dashboard/brand/collaborations
│   └── CampaignsPage (main container)
│       ├── CampaignDetail (expandable per-request)
│       │   ├── Counter offer panel
│       │   ├── Verification status
│       │   └── Action buttons
│       └── Uses: CampaignDetail, CreateRequestModal
│
├── /dashboard/brand/matching (or influencers)
│   └── InfluencerSearch
│       ├── Filter pills (niche, followers, engagement, cost)
│       └── Influencer card list
│           └── On click → InfluencerProfileModal
│               ├── Analytics charts
│               ├── Demographics
│               └── "Request Collaboration" button
│                   └── Opens CreateRequestModal
│
└── CreateRequestModal
    ├── Form fields (title, description, deliverables, etc)
    └── Submit → brandAPI.createRequest()

─────────────────────────────────────────────────────

INFLUENCER SIDE
├── /dashboard/influencer/collaborations
│   └── CollaborationsPage
│       ├── PendingRequests section
│       │   ├── Request card (expandable)
│       │   │   ├── Campaign brief
│       │   │   ├── T&C checkbox
│       │   │   └── Action buttons (Accept/Counter/Decline)
│       │   │       └── Counter form (price + message)
│       │   └── Empty/Error state
│       │
│       ├── ActiveCollaborations section
│       │   ├── Accepted request
│       │   │   ├── Campaign details
│       │   │   └── Post submission form (URL)
│       │   │       └── Submit → influencerAPI.submitVerification()
│       │   └── Verification status display
│       │
│       └── CompletedHistory section
│           ├── Closed deals
│           ├── Payment status
│           └── Performance metrics
│
└── MyProfilePage
    ├── Edit profile form
    └── Instagram connection status
```

---

## 🔄 DATA FLOW: Create Request → Close Deal

```
STEP 1: BRAND CREATES REQUEST
┌──────────────────────────────────────┐
│ Brand fills CreateRequestModal       │
│ - Title, deliverables, price, etc    │
│ - Selects influencer                 │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ POST /brand/requests                 │
│ {influencerId, campaignTitle, ...}   │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────┐
│ Backend: createRequest()                 │
│ 1. Validate influencer exists            │
│ 2. Create CampaignRequest               │
│ 3. Store denormalized snapshots         │
│ 4. Create notification                  │
│ 5. Return request                       │
└────────────┬─────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────┐
│ Influencer receives notification             │
│ "New Collaboration Request from Brand"       │
└────────────┬─────────────────────────────────┘

STEP 2: INFLUENCER REVIEWS & RESPONDS
             │
             ▼
┌──────────────────────────────────────────┐
│ Influencer opens CollaborationsPage      │
│ GET /influencer/requests                 │
│ ⚠️ Auto-updates status: sent → viewed    │
└────────────┬─────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────┐
│ Influencer sees request in Pending tab   │
│ Views campaign brief (expandable)        │
│ Chooses one of:                          │
│  A) Accept (if T&C checked)              │
│  B) Counter with new price               │
│  C) Decline with reason                  │
└────────────┬─────────────────────────────┘
             │
        CHOICE A (Accept)
             │
             ▼
┌──────────────────────────────────────────┐
│ PATCH /influencer/requests/:id           │
│ {status: 'accepted'}                     │
└────────────┬─────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────┐
│ Backend: respondToRequest()              │
│ 1. Update status to 'accepted'           │
│ 2. Set acceptedAt timestamp              │
│ 3. Create notification for brand         │
│ 4. Return updated request                │
└────────────┬─────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│ Brand sees notification                     │
│ "Collaboration accepted! 🎉"                │
│ Request status shows 'In-Process'           │
│ Awaits influencer to submit post URL        │
└────────────┬────────────────────────────────┘

STEP 3: INFLUENCER SUBMITS DELIVERABLE
             │
             ▼
┌──────────────────────────────────────────┐
│ Influencer creates/posts content         │
│ Submits post URL in ActiveCollaborations │
│ POST /influencer/verify                  │
│ {campaignRequestId, postUrl}             │
│ ❌ ENDPOINT NOT IMPLEMENTED              │
└─────────────────────────────────────────┘

IF IMPLEMENTED:
             │
             ▼
┌──────────────────────────────────────────┐
│ Backend creates Verification record      │
│ Optionally fetches post metrics from IG  │
│ Sets status to 'pending' for admin       │
└────────────┬─────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────┐
│ Admin reviews post URL                   │
│ PATCH /admin/verifications/:id           │
│ {status: 'verified'|'rejected'}          │
│ ❌ ENDPOINT NOT IMPLEMENTED              │
└────────────┬─────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────┐
│ Status changes to 'verified'             │
│ Performance metrics displayed            │
│ Influencer earnings credited             │
└──────────────────────────────────────────┘
```

### COUNTER OFFER FLOW (Alternative to Accept)

```
INFLUENCER COUNTERS
        │
        ▼
┌──────────────────────────────────────────┐
│ PATCH /influencer/requests/:id           │
│ {                                        │
│   status: 'negotiation',                │
│   counterOfferPrice: 750,                │
│   counterOfferMessage: "Can do for $750"│
│ }                                        │
└────────────┬─────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────┐
│ Brand sees notification                  │
│ "Counter Offer Received"                 │
│ Original ask: $500 (strikethrough)       │
│ Counter ask: $750 (highlighted)          │
└────────────┬─────────────────────────────┘
             │
             ▼
         BRAND CHOOSES
        │         │         │
        │         │         │
    ACCEPT    REJECT    COUNTER BACK
        │         │         │
        ▼         ▼         ▼
    DEAL_   REJECTED  NEGOTIATION
   CLOSED            (loop back)
```

---

## 🔐 AUTHENTICATION & AUTHORIZATION

```
All protected endpoints require:

1. JWT Token in Authorization header
   Authorization: Bearer <token>
   (from localStorage.porchest_token)

2. Role-based access:
   - Brand routes: roleMiddleware('brand')
   - Influencer routes: roleMiddleware('influencer')
   - Admin routes: roleMiddleware('admin')

3. Ownership verification:
   - brandUserId must match req.user._id
   - influencerUserId must match req.user._id
   - Prevents cross-user access

PUBLIC ENDPOINTS:
- GET /brand/instagram/callback     (OAuth redirect)
- GET /influencer/instagram/callback (OAuth redirect)
```

---

## 📊 DATA STRUCTURES

### CampaignRequest Document
```javascript
{
  _id: ObjectId,
  requestCode: "REQ-12345",
  
  // Participants
  brandUserId: ObjectId,
  influencerUserId: ObjectId,
  brandProfileId: ObjectId | null,
  influencerProfileId: ObjectId,
  
  // Campaign
  campaignTitle: "Smart Gadgets Review Series",
  campaignDescription: "Review our new smartwatch...",
  campaignType: "sponsored_post",
  deliverables: "1x Reel (60s), 3x Stories",
  requiredElements: "Show unboxing, mention price",
  videoLength: "60 seconds",
  contentGuidelines: "Use this tone...",
  hashtags: "#TechReview #SmartWatch",
  disclosureRequirements: "#Ad #Sponsored",
  
  // Budget
  agreedPrice: 500,
  budgetRangeMin: 300,
  budgetRangeMax: 1000,
  paymentTerms: "50% advance, 50% after verification",
  currency: "USD",
  
  // Timeline
  postingDeadline: Date,
  campaignStartDate: Date,
  campaignEndDate: Date,
  
  // Message
  brandMessage: "Looking forward to working with you!",
  
  // Status & Lifecycle
  status: "sent|viewed|accepted|rejected|negotiation|deal_closed|expired|cancelled",
  sentAt: Date,
  viewedAt: Date | null,
  acceptedAt: Date | null,
  rejectedAt: Date | null,
  negotiationStartedAt: Date | null,
  dealClosedAt: Date | null,
  
  // Negotiation
  counterOfferPrice: 750 | null,
  counterOfferMessage: "Can do for this price" | null,
  rejectionReason: "Not interested" | null,
  
  // Denormalized snapshots (from profiles at creation time)
  brandName: "TechBrand Inc",
  brandLogoUrl: "https://...",
  brandCategory: "Technology",
  influencerName: "John Creator",
  influencerUsername: "johncreator",
  influencerProfilePic: "https://...",
  influencerNiche: "Tech",
  
  createdAt: Date,
  updatedAt: Date
}
```

### InfluencerProfile Snippet
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  
  // Identity
  fullName: "John Doe",
  displayName: "John Creator",
  instagramUsername: "johncreator",
  profilePictureUrl: "https://...",  // ✅ Primary field
  instagramDPURL: "https://...",      // ⚠️ Legacy/fallback
  bio: "Tech enthusiast...",
  niche: "Technology",
  
  // Pricing (for matching)
  avgPostPrice: 500,
  avgReelPrice: 750,
  
  // Metrics (for matching)
  followersCount: 50000,
  engagementRate: 3.45,  // %
  avgLikesPerPost: 2500,
  avgCommentsPerPost: 180,
  
  // Status
  instagramConnected: true,
  isSearchable: true,
  verificationStatus: "verified",
  
  // More fields...
}
```

---

## ⚡ PERFORMANCE CONSIDERATIONS

### Caching Opportunities
```
GET /brand/influencers
  - Filter results can be cached 15 minutes
  - Invalidate on influencer profile update
  
GET /brand/requests
  - User's own requests: cache 5 minutes
  - Invalidate on request status change

GET /influencer/requests
  - User's own requests: cache 5 minutes
  - Invalidate on request update
  - ⚠️ Currently auto-updates on fetch
```

### Index Performance
```
Current indexes on CampaignRequest:
✅ { brandUserId: 1, status: 1 }    → Good for brand filtering
✅ { influencerUserId: 1, status: 1 } → Good for influencer filtering
✅ { status: 1, createdAt: -1 }     → Good for listing all

Missing (could add):
- { status: 1 } for admin verification queue
- { dealClosedAt: 1 } for analytics
- { negotiationStartedAt: 1 } for stalled deals
```

### Polling vs Real-time
```
Current:
- Polling interval: 30 seconds
- Socket.IO running but NOT emitting events
- Both run simultaneously = 2x server load

Recommended:
- Enable Socket.IO events in backend
- Disable polling when socket connected
- Re-enable polling only if socket disconnects
- Saves ~14k requests/hour per active user
```

---

## 🐛 KNOWN ISSUES SUMMARY

| Issue | Severity | Component | Fix |
|-------|----------|-----------|-----|
| Auto-update 'sent'→'viewed' on GET | MEDIUM | campaignRequestController | Make explicit parameter |
| No verification endpoints | HIGH | Backend | Implement verification model |
| No real-time socket events | MEDIUM | Backend | Add socket.emit() calls |
| Polling errors silent after initial load | MEDIUM | CollaborationsPage | Show error state in UI |
| DP field name inconsistency | LOW | Various | Use `profilePictureUrl` everywhere |
| No campaign expiration logic | LOW | Backend | Auto-expire old requests |
| No earnings tracking | LOW | Backend | Implement earnings model |

---

## 🚀 QUICK START FOR DEVELOPERS

### To create a campaign request:
```typescript
// Frontend
const response = await brandAPI.createRequest({
  influencerId: '507f1f77bcf86cd799439011',
  campaignTitle: 'My Campaign',
  deliverables: '1x Reel',
  agreedPrice: 500,
  // ... other fields
});
```

### To respond to a request:
```typescript
// Frontend (influencer)
await influencerAPI.respondToRequest(requestId, {
  status: 'accepted'  // or 'rejected', 'negotiation'
});

// Or counter offer:
await influencerAPI.respondToRequest(requestId, {
  status: 'negotiation',
  counterOfferPrice: 750,
  counterOfferMessage: 'Can do for $750'
});
```

### To accept counter offer:
```typescript
// Frontend (brand)
await brandAPI.updateRequest(requestId, {
  status: 'deal_closed',
  agreedPrice: 750  // Accept the counter
});
```

### To listen for real-time updates:
```typescript
// Frontend
import { useCollaborationUpdates } from '@/lib/useSocket';

useCollaborationUpdates((data) => {
  console.log('Collaboration updated:', data);
  // Refetch data
});
```

---

Version: 1.0 | Last Updated: April 22, 2026
