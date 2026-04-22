# Collaboration System Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PORCHEST COLLABORATION PLATFORM                     │
└─────────────────────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════╗         ╔═══════════════════════════════╗
║      BRAND PORTAL                 ║         ║    INFLUENCER PORTAL          ║
║   (Next.js Frontend)              ║         ║   (Next.js Frontend)          ║
╠═══════════════════════════════════╣         ╠═══════════════════════════════╣
║ /dashboard/brand/collaborations   ║         ║ /dashboard/influencer/        ║
║  └─ CampaignsPage                 ║         ║  └─ CollaborationsPage        ║
║     ├─ Request List               ║         ║     ├─ PendingRequests        ║
║     ├─ Counter Offers             ║         ║     ├─ ActiveCollaborations   ║
║     └─ Verification Tracking      ║         ║     └─ CompletedHistory       ║
║                                   ║         ║                               ║
║ /dashboard/brand/influencers      ║         ║ /dashboard/influencer/profile ║
║  └─ InfluencerSearch              ║         ║  └─ MyProfilePage             ║
║     ├─ Filter & Discover          ║         ║     └─ Edit Profile           ║
║     ├─ InfluencerProfileModal     ║         ║                               ║
║     └─ CreateRequestModal         ║         ║                               ║
║                                   ║         ║                               ║
║ API: brandAPI.*                   ║         ║ API: influencerAPI.*          ║
╚═══════════════════════════════════╝         ╚═══════════════════════════════╝
                │                                        │
                │ HTTP/JWT                              │ HTTP/JWT
                │                                        │
                └────────────────┬───────────────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │   WebSocket (Socket.IO)  │
                    │   Real-time Updates      │
                    │   - collaboration:*      │
                    │   - request:*            │
                    │   - negotiation:*        │
                    └────────────┬─────────────┘
                                 │
                    ┌────────────▼────────────────────────────┐
                    │        Express.js Backend               │
                    │      (Node.js + MongoDB)                │
                    │                                         │
                    ├─ Routes                                 │
                    │  ├─ /api/brand/requests                │
                    │  ├─ /api/brand/influencers             │
                    │  ├─ /api/brand/verifications           │
                    │  ├─ /api/influencer/requests           │
                    │  ├─ /api/influencer/verify (❌ TODO)   │
                    │  └─ /api/admin/verifications           │
                    │                                         │
                    ├─ Controllers                            │
                    │  ├─ campaignRequestController.js        │
                    │  ├─ brandController.js                  │
                    │  ├─ influencerController.js             │
                    │  └─ (adminController.js - ❌ TODO)      │
                    │                                         │
                    └────────────┬───────────────────────────┘
                                 │
                    ┌────────────▼────────────────────────────┐
                    │      MongoDB Database                   │
                    │                                         │
                    ├─ Collections                            │
                    │  ├─ CampaignRequest                     │
                    │  │  └─ Schema: Request w/ status lifecycle
                    │  │                                     │
                    │  ├─ InfluencerProfile                  │
                    │  │  └─ Pricing, metrics, Instagram data │
                    │  │                                     │
                    │  ├─ BrandProfile                       │
                    │  │  └─ Brand info, preferences         │
                    │  │                                     │
                    │  ├─ Notification                       │
                    │  │  └─ Collab events (request, response)
                    │  │                                     │
                    │  ├─ User                               │
                    │  │  └─ Auth + role tracking           │
                    │  │                                     │
                    │  └─ Verification (❌ MISSING)          │
                    │     └─ Post submissions, status        │
                    │                                         │
                    └─────────────────────────────────────────┘
```

---

## Request Lifecycle: Complete Flow

```
TIME ──────────────────────────────────────────────────────────────────────►

BRAND SIDE                          BACKEND                 INFLUENCER SIDE
─────────────────────────────────────────────────────────────────────────

T0: CREATE REQUEST
 └─ Opens InfluencerSearch
 └─ Finds influencer
 └─ Clicks "Request Collaboration"
    └─ Opens CreateRequestModal
    └─ Fills form (title, price, deadline, etc)
    └─ Clicks SEND
          │
          ▼
       POST /brand/requests
          │
          ├─ Validate (influencer exists, fields required)
          │
          ├─ Create CampaignRequest doc
          │  └─ status: 'sent'
          │  └─ Store denormalized brand snapshot
          │  └─ Generate request code (REQ-xxxx)
          │
          ├─ Create Notification for influencer
          │  └─ type: 'collaboration_request'
          │
          └─ Return { success: true, request }
             │
             ▼
       Brand sees "Request sent!" toast
       Request appears in CampaignsPage
       with status: "Pending"
                                                      ├─ Notification arrives
                                                      │  "New Collaboration Request
                                                      │   from Brand Inc"
                                                      │
                                                      ├─ Opens CollaborationsPage
                                                      │
T1: INFLUENCER VIEWS REQUEST                          ├─ Clicks to expand
                                                      │
                                                      ├─ Calls GET /influencer/requests
                                                      │     │
                                                      │     ├─ ⚠️ SIDE EFFECT:
                                                      │     │  Auto-update status:
                                                      │     │  sent → viewed
                                                      │     │  viewedAt = now()
                                                      │     │
                                                      │     └─ Create Notification
                                                      │        for brand:
                                                      │        "Request Viewed"
                                                      │
                                                      └─ Sees all campaign details
                                                         (brief, deliverables, price)
                                                         
Brand sees notification
"Influencer viewed your request"
│
├─ CampaignsPage updates status
│  from "Pending" to "Viewed"


T2: INFLUENCER CHOOSES ACTION
                                                      ├─ THREE OPTIONS:
                                                      │
                  CHOICE A: ACCEPT              CHOICE B: COUNTER      CHOICE C: REJECT
                  │                             │                      │
                  ├─ Checks T&C checkbox       ├─ Fills counter form  ├─ Clicks Decline
                  │                            │  └─ New price        │
                  ├─ Clicks ACCEPT            │  └─ Message          ├─ May enter reason
                  │                            │                      │
                  └─ PATCH /influencer/requests/:id
                     {status: 'accepted'}      └─ PATCH /influencer/requests/:id
                        │                         {status: 'negotiation',
                        ├─ Update status        counterOfferPrice, ...}
                        │  accepted                │
                        ├─ Set acceptedAt       ├─ Update status
                        │                        │  negotiation
                        ├─ Create notification  ├─ Store counter details
                        │  for brand            ├─ Create notification
                        │                        │  for brand
                        └─ Return request
                           │
Brand receives              ├─ Brand receives
notification                │  notification
"Collaboration accepted!"   │  "Counter Offer Received"
│                           │
├─ Status shows             ├─ CampaignDetail panel shows:
│  "In-Process"             │  Original: $500 (strikethrough)
│                           │  Counter:  $750 (highlighted)
├─ Awaits influencer        │
│  post submission          └─ Brand chooses:
                               │
                          ┌────┴────┬──────────┐
                          │         │          │
                    ACCEPT      REJECT    COUNTER BACK
                      │            │           │
                      └──────PATCH /brand/requests/:id
                             {status: 'deal_closed'|'rejected'|'negotiation'}

T3: DEAL CLOSED
                  └─ Status: 'deal_closed'
                  └─ Both notified:
                     Brand: "Deal confirmed!"
                     Influencer: "Deal confirmed!"

T4: INFLUENCER SUBMITS DELIVERABLE
                                                      ├─ Creates post per brief
                                                      ├─ Publishes on Instagram
                                                      ├─ Returns to
                                                      │  ActiveCollaborations
                                                      │
                                                      └─ POST /influencer/verify
                                                         {campaignRequestId,
                                                          postUrl}
                                                         ❌ NOT IMPLEMENTED
                                                         
If implemented:
                                                      └─ Verification record created
                                                         status: 'pending'

Brand sees post URL
in verification section

T5: ADMIN VERIFICATION
                                                      └─ Fetches post metrics
                                                         from Instagram API
                                                         └─ Stores likes, comments,
                                                            views, shares

Admin reviews post
Checks if content
meets requirements
└─ PATCH /admin/verifications/:id
   {status: 'verified'|'rejected'}
   ❌ NOT IMPLEMENTED

T6: COMPLETE
   Both parties see:
   - Closed deal
   - Verified post
   - Performance metrics
   - Influencer receives payment ✅
```

---

## Component Interaction Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                          BRAND PORTAL                              │
│                                                                     │
│  ┌──────────────────────┐      ┌──────────────────────┐            │
│  │ InfluencerSearch     │      │ CampaignsPage        │            │
│  │  • Filter pills      │      │  • Request list      │            │
│  │  • Search box        │      │  • Status tabs       │            │
│  │  • Card grid         │      │  • Counter offers    │            │
│  └──────────┬───────────┘      │  • Verification      │            │
│             │                  └────────┬─────────────┘            │
│             │                           │                         │
│             │   Clicks card             │                         │
│             ├──────────────────┐        │                         │
│             │                  │        │                         │
│             ▼                  ▼        │                         │
│  ┌──────────────────────┐   ┌──────────────────────┐             │
│  │InfluencerProfileModal│   │ CampaignDetail       │             │
│  │ • Profile pic DP     │   │ • Campaign brief     │             │
│  │ • Analytics charts   │   │ • Pricing history    │             │
│  │ • Fit score          │   │ • Counter panel      │             │
│  │ • Demographics       │   │ • Verification       │             │
│  │ • "Request" button   │   └──────┬───────────────┘             │
│  └──────────┬───────────┘           │                            │
│             │                       │                            │
│             │ Click "Request"       │ Click "Accept Counter"    │
│             │                       │                            │
│             ▼                       ▼                            │
│  ┌──────────────────────┐   ┌──────────────────────┐            │
│  │CreateRequestModal    │   │ "Confirm Action"     │            │
│  │ • Title              │   │ • Show price         │            │
│  │ • Description        │   │ • Confirm button     │            │
│  │ • Deliverables       │   └──────┬───────────────┘            │
│  │ • Price              │          │                            │
│  │ • T&C checkbox       │          │                            │
│  │ • Submit button      │          │                            │
│  └──────────┬───────────┘          │                            │
│             │                      │                            │
│             └──────────────┬───────┘                             │
│                            │                                     │
│              ┌─────────────▼─────────────┐                       │
│              │  brandAPI.createRequest() │                       │
│              │  brandAPI.updateRequest() │                       │
│              └─────────────┬─────────────┘                       │
│                            │                                     │
└────────────────────────────┼─────────────────────────────────────┘
                             │
                    HTTP/JWT │ (with auth token)
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
   POST /brand/           GET /brand/         GET /brand/
   requests            influencers          verifications
   
        │
        │ Response: { success, request }
        │
┌───────┼─────────────────────────────────────────────────────────┐
│       ▼                                                          │
│ ┌──────────────────────┐                                         │
│ │ INFLUENCER PORTAL    │                                         │
│ │                      │                                         │
│ │ ┌──────────────────────┐      ┌──────────────────────┐        │
│ │ │ PendingRequests      │      │ ActiveCollaborations │        │
│ │ │  • Request cards     │      │  • Accepted requests │        │
│ │ │  • Brief expandable   │      │  • Post submission   │        │
│ │ │  • T&C checkbox      │      │  • Verification stat │        │
│ │ │  • Action buttons    │      └──────┬───────────────┘        │
│ │ └──────────┬───────────┘             │                       │
│ │            │                         │                       │
│ │            │ Actions:                │ Click "Submit Post"   │
│ │            │  • Accept               │                       │
│ │            │  • Counter              │                       │
│ │            │  • Decline              │                       │
│ │            │                         │                       │
│ │            └───────────┬─────────────┘                        │
│ │                        │                                      │
│ │         ┌──────────────▼──────────────┐                       │
│ │         │influencerAPI.respondToRequest│                      │
│ │         │influencerAPI.submitVerification(❌TODO)             │
│ │         └──────────────┬──────────────┘                       │
│ │                        │                                      │
│ └────────────────────────┼──────────────────────────────────────┘
│                          │
└──────────────────────────┼─────────────────────────────────────────
                   HTTP/JWT │ (with auth token)
                           │
          PATCH /influencer/      POST /influencer/
          requests/:id           verify (❌TODO)
```

---

## Database Schema Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                          MONGODB                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐         ┌──────────────┐                     │
│  │ User         │         │ BrandProfile │                     │
│  ├──────────────┤         ├──────────────┤                     │
│  │ _id          │◄────────┤ userId       │ (1:1)              │
│  │ email        │         │ brandName    │                     │
│  │ role         │         │ logoUrl      │                     │
│  │ password     │         │ instagramDPURL│                    │
│  │ ...          │         │ avgPostPrice │                     │
│  └──────────────┘         │ ...          │                     │
│       ▲                    └──────────────┘                     │
│       │                                                        │
│       │                                                        │
│       │ (ref)        ┌──────────────────┐                     │
│       │              │InfluencerProfile │                     │
│       └──────────────┤ userId           │ (1:1)              │
│                      │ fullName         │                     │
│                      │ profilePictureUrl│ ✅ PRIMARY DP FIELD │
│                      │ instagramDPURL   │ ⚠️ LEGACY          │
│                      │ avgPostPrice     │                     │
│                      │ followersCount   │                     │
│                      │ engagementRate   │                     │
│                      │ ...              │                     │
│                      └────────┬─────────┘                     │
│                               │                              │
│                               │ (ref)                        │
│                               │                              │
│              ┌────────────────┼────────────────┐              │
│              │                │                │              │
│              ▼                ▼                ▼              │
│  ┌──────────────────────────────────────┐                    │
│  │ CampaignRequest                      │                    │
│  ├──────────────────────────────────────┤                    │
│  │ _id                                  │                    │
│  │ requestCode (unique)                 │                    │
│  │ brandUserId ──┐                      │                    │
│  │ influencerUserId ──┐                 │                    │
│  │ brandProfileId ─┐  │                 │                    │
│  │ influencerProfileId ─┐               │                    │
│  │                      │               │                    │
│  │ campaignTitle        │               │                    │
│  │ campaignDescription  │               │                    │
│  │ deliverables         │               │                    │
│  │ requiredElements     │               │                    │
│  │ agreedPrice          │               │                    │
│  │ postingDeadline      │               │                    │
│  │                      │               │                    │
│  │ status               │               │                    │
│  │ sentAt               │               │                    │
│  │ viewedAt             │               │                    │
│  │ acceptedAt           │               │                    │
│  │ rejectedAt           │               │                    │
│  │ negotiationStartedAt │               │                    │
│  │ dealClosedAt         │               │                    │
│  │                      │               │                    │
│  │ counterOfferPrice    │               │                    │
│  │ counterOfferMessage  │               │                    │
│  │ rejectionReason      │               │                    │
│  │                      │               │                    │
│  │ # Denormalized Snapshots:            │                    │
│  │ brandName            │               │                    │
│  │ brandLogoUrl         │               │                    │
│  │ influencerName       │               │                    │
│  │ influencerUsername   │               │                    │
│  │ influencerProfilePic │               │                    │
│  │ ...                  │               │                    │
│  │                      │               │                    │
│  └──────────────────────────────────────┘                    │
│           ▲                                                   │
│           │ (ref to submissions)                             │
│           │                                                   │
│  ┌────────────────────────────────────┐  (❌ MISSING)       │
│  │ Verification                       │                     │
│  ├────────────────────────────────────┤                     │
│  │ _id                                │                     │
│  │ campaignRequestId                  │ (ref)              │
│  │ postUrl                            │                     │
│  │ status                             │                     │
│  │   'pending'|'verified'|'rejected'  │                     │
│  │ performance                        │                     │
│  │   { views, likes, comments, ... }  │                     │
│  │ adminNote                          │                     │
│  │ createdAt                          │                     │
│  │ ...                                │                     │
│  └────────────────────────────────────┘                     │
│           ▲                                                   │
│           │                                                   │
│  ┌────────────────────────────────────┐                     │
│  │ Notification                       │                     │
│  ├────────────────────────────────────┤                     │
│  │ _id                                │                     │
│  │ recipientUserId (ref to User)      │                     │
│  │ type                               │                     │
│  │   'collaboration_request'          │                     │
│  │   'request_viewed'                 │                     │
│  │   'request_accepted'               │                     │
│  │   'request_rejected'               │                     │
│  │   'negotiation'                    │                     │
│  │   'deal_closed'                    │                     │
│  │ campaignRequestId (ref)            │                     │
│  │ title, message                     │                     │
│  │ senderName, senderAvatar           │                     │
│  │ metadata                           │                     │
│  │ createdAt                          │                     │
│  │ ...                                │                     │
│  └────────────────────────────────────┘                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘

Indexes on CampaignRequest:
✅ { brandUserId: 1, status: 1 }
✅ { influencerUserId: 1, status: 1 }
✅ { status: 1, createdAt: -1 }

Could add:
- { status: 1 } for admin queue
- { dealClosedAt: 1 } for analytics
- { negotiationStartedAt: 1 } for stalled deals
```

---

## Socket.IO Event Flow

```
CLIENT (Frontend)          SOCKET.IO          SERVER (Backend)
──────────────────────────────────────────────────────────────

Brand Side:
└─ useCollaborationUpdates(callback)
   └─ socket.on('collaboration:received')
   └─ socket.on('collaboration:responded')
   └─ socket.on('collaboration:updated')
      │
      │ Waiting for events...
      │
      ├─ Event: 'collaboration:responded'
      │  └─ Influencer accepted/countered
      │  └─ Callback triggered
      │  └─ Page refetches data
      │
      ├─ Event: 'collaboration:updated'
      │  └─ Negotiation ongoing
      │
      └─ Event: 'collaboration:received'
         └─ (Not used by brand?)

Influencer Side:
└─ useCollaborationUpdates(callback)
   └─ socket.on('collaboration:received')
   └─ socket.on('collaboration:responded')
   └─ socket.on('collaboration:updated')
      │
      │ Waiting for events...
      │
      ├─ Event: 'collaboration:received'
      │  └─ Brand created/updated request
      │
      ├─ Event: 'collaboration:responded'
      │  └─ Brand responded to counter
      │
      └─ Event: 'collaboration:updated'
         └─ Deal status changed

BACKEND (NOT CURRENTLY EMITTING):
├─ respondToRequest() [influencer responds]
│  └─ SHOULD: socket.emit('collaboration:responded', ...)
│
├─ brandRespondToRequest() [brand responds]
│  └─ SHOULD: socket.emit('collaboration:responded', ...)
│
├─ createRequest() [brand creates]
│  └─ SHOULD: socket.emit('collaboration:received', ...)
│
└─ (Missing Verification endpoints)
   └─ SHOULD: socket.emit('collaboration:verified', ...)

FALLBACK POLLING:
└─ If Socket.IO disconnects → Polling every 30s
└─ If Socket.IO connects → Should disable polling
   (Currently both run simultaneously = redundant)
```

---

## Error & Validation Flow

```
REQUEST SUBMISSION
        │
        ▼
┌──────────────────────────────┐
│ Frontend Validation          │
├──────────────────────────────┤
│ • Required fields present?   │
│ • Valid date (posting ≥ now)? │
│ • Influencer selected?       │
│ • T&C checked? (influencer)  │
└──────────────────────────────┘
        │ Pass
        ▼
┌──────────────────────────────┐
│ HTTP Request with JWT        │
├──────────────────────────────┤
│ Authorization: Bearer token  │
└──────────────────────────────┘
        │
        ▼
┌──────────────────────────────┐
│ Backend Route Handler        │
├──────────────────────────────┤
│ • authMiddleware (verify JWT)│
│ • roleMiddleware (check role)│
└──────────────────────────────┘
        │ Pass
        ▼
┌──────────────────────────────┐
│ Controller Validation        │
├──────────────────────────────┤
│ • Required fields present?   │
│ • Valid ObjectId format?     │
│ • Influencer exists?         │
│ • Ownership check?           │
│ • Permission check?          │
└──────────────────────────────┘
        │ Pass
        ▼
┌──────────────────────────────┐
│ Database Operation           │
├──────────────────────────────┤
│ • Create record             │
│ • Denormalize snapshots     │
│ • Create notifications      │
└──────────────────────────────┘
        │
    Fail ├─ Try-catch block
        │ └─ next(error) → errorHandler middleware
        │
        ▼
┌──────────────────────────────┐
│ Error Handler                │
├──────────────────────────────┤
│ • Catch type: Validation?    │
│ • Catch type: NotFound?      │
│ • Catch type: Unauthorized?  │
│ • Catch type: Generic error? │
│                              │
│ ⚠️ Missing handlers:          │
│ • ECONNREFUSED               │
│ • ENOTFOUND                  │
│ • Network errors             │
└──────────────────────────────┘
        │
        ▼
┌──────────────────────────────┐
│ HTTP Response                │
├──────────────────────────────┤
│ 201: Success (POST)          │
│ 200: Success (GET/PATCH)     │
│ 400: Bad Request             │
│ 401: Unauthorized            │
│ 403: Forbidden               │
│ 404: Not Found               │
│ 500: Server Error            │
└──────────────────────────────┘
        │
        ▼
┌──────────────────────────────┐
│ Frontend Response Handler    │
├──────────────────────────────┤
│ • Interceptor catches 401?   │
│   └─ Redirect to login       │
│ • Check response.status?     │
│ • Parse error message?       │
│ • Show toast notification?   │
│                              │
│ ⚠️ Issue in CollaborationsPage:
│ • Error only shown if       │
│   loading === true          │
│ • Polling errors are silent │
└──────────────────────────────┘
```

---

Generated: April 22, 2026
