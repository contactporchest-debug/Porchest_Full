# Demo Seed Templates

Use these templates when generating presentation data for the Porchest demo environment.

## Files

- `demo-seed-template.json` - nested sample records for every main collection.
- `README.md` - quick CSV header reference for flat imports.

## Recommended demo roles

- 1 owner/admin
- 1 brand
- 3 to 5 influencers
- 1 software client

## CSV headers

Use these as column headers if you prefer CSV imports.

### users
```csv
userCode,role,email,password,status,isVerified,loginProvider,profileCompletionStatus,instagramConnected,lastLoginAt,tokenVersion,failedLoginAttempts,firstFailedLoginAt,lockUntil,influencerProfileId,brandProfileId,softwareClientProfileId,otp,otpExpires,createdAt,updatedAt
```

### brand_profiles
```csv
brandProfileId,userId,businessName,representerName,logo,industry,website,instagramLink,linkedinLink,googleMapLink,contactEmail,country,bio,marketingGoals,targetAudience.ageRange,targetAudience.genders,targetAudience.countries,preferredNiches,budgetRange.min,budgetRange.max,typicalBudget,assignedEmployee,assignedEmployeeFK,profileComplete,verified,brandName,companyName,category,description,logoUrl,contactDetails.officialEmail,contactDetails.contactPersonName,profileCompletionStatus,verificationStatus,isActive,approxBudgetUSD,createdAt,updatedAt
```

### influencer_profiles
```csv
influencerProfileId,userId,fullName,bio,country,city,niche,languages,contentStyleTags,contactEmail,phoneNumber,igUserId,igUsername,igProfileUrl,igBio,igWebsite,igAccountType,igFollowersCount,igFollowingCount,igMediaCount,igLastSyncedAt,avgReachPerPost,avgImpressionsPerPost,avgSavesPerPost,avgSharesPerPost,postingFrequency,totalReach90d,totalImpressions90d,totalProfileViews90d,totalWebsiteClicks90d,followerGrowth90d,avgEngagementRate,followerTier,porchestScore,authenticityScore,audience.ageGender,audience.topCountries,audience.topCities,totalCampaigns,totalEarnings,avgCampaignRating,preferredRate,rates.reelPrice,rates.postPrice,profileComplete,verified,suspended,fraudDetection.score,fraudDetection.level,fraudDetection.status,fraudDetection.flags,fraudDetection.analyzedAt,fraudDetection.verificationRequestedAt,fraudDetection.flaggedAt,username,profilePictureUrl,profileUrl,instagramAccountId,instagramUsername,instagramAccountType,isVerified,isActive,isSearchable,followersCount,followingCount,mediaCount,postsCount,reelsCount,profileViews,websiteClicks,accountReach,accountImpressions,engagementRate,avgLikes,avgComments,avgShares,avgViews,avgReach,avgImpressions,avgLikesPerPost,avgCommentsPerPost,avgEngagementPerPost,averageEngagement,averageReach,viewRate,likeToCommentRatio,postsAnalyzed,influencerEfficiencyRate,totalReach,totalImpressions,totalPlays,totalShares,totalSaved,totalEngagements,postingFrequency7d,postingFrequency30d,consistencyRatio,consistencyScore,costPerView,costPerEngagement,authenticityScoreLegacy,engagementQualityScore,viralityScore,influencerScore,topPerformingContentType,avgPostPrice,avgReelPrice,currency,profileScore,fitScore,qualityScore,topPostScore,topReelScore,credibilityScore,scoreLabel,scoreBreakdown,sync.source,sync.lastRawFetchAt,sync.lastMetricsCalculationAt,sync.lastDemographicsCalculationAt,sync.refreshStatus,sync.refreshError,sync.retryCount,sync.oauthState,sync.accessToken,sync.longLivedToken,sync.tokenExpiresAt,recentMediaSummary,createdAt,updatedAt
```

### software_client_profiles
```csv
softwareClientProfileId,userId,fullName,companyName,roleTitle,email,phone,country,city,avatarUrl,clientSince,preferredContact,workingHours,companyWebsite,companyStage,industry,teamSize,overview.projectName,overview.currentStatus,overview.simpleDescription,overview.deadline,overview.nextProjectProposal,overview.currentPhase,overview.completionPercent,currentRequirements,productGoals,technologyScope,deliverablesSummary,activeProject,projects,createdAt,updatedAt
```

### campaign_requests / collaborations
```csv
requestCode,brandId,influencerId,assignedEmployeeFK,status,brief.brandIntro,brief.campaignObjective,brief.productDetails,brief.targetAudience,brief.targetAudienceDesc,brief.keyMessage,brief.contentTypes,brief.contentType,brief.creativeDirection,brief.mandatoryTalkingPoints,brief.mandatoryPoints,brief.dos,brief.donts,brief.dosAndDonts,brief.captionGuidelines,brief.requiredHashtags,brief.hashtags,brief.requiredTags,brief.callToAction,brief.trackingLink,brief.promoCode,brief.visualRequirements,brief.postingSchedule,brief.postingDeadline,brief.revisionRounds,brief.approvalProcess,brief.deliverables,brief.usageRights,brief.usageRightsText,brief.disclosureRequired,brief.disclosureRequirements,brief.porchestContact,pricing.brandOffer,pricing.agreedFee,pricing.currency,financials.brandOfferedFee,financials.agreedFee,financials.porchestCommission,financials.influencerPayable,campaignStartDate,campaignEndDate,gracePeriodDays,draftDriveLink,draftSubmittedAt,draftApprovedAt,brandFeedback,revisionsUsed,postLink,postSubmittedAt,brandVerifiedPost,brandVerifiedAt,adminVerifiedPost,adminVerifiedAt,adminVerifiedByFK,content.driveLink,content.driveSubmittedAt,content.brandApprovedDrive,content.brandApprovedAt,content.revisionsUsed,content.postLink,content.postSubmittedAt,content.brandVerifiedPost,content.brandVerifiedAt,content.adminVerified,content.adminVerifiedAt,content.adminVerifiedBy,payment.status,payment.portion1.amount,payment.portion1.releasedAt,payment.portion1.status,payment.portion2.amount,payment.portion2.releasedAt,payment.portion2.status,brandPaymentStatus,brandPaymentIntentId,brandPaymentReceivedAt,payment_status,payment_proof,payment_amount,payment_method,payment_timestamp,platformFeePercent,platformFeeAmount,influencerNetAmount,firstPayoutAmount,secondPayoutAmount,firstTransferId,secondTransferId,firstPayoutReleasedAt,secondPayoutReleasedAt,verifiedLiveAt,campaignStartAt,campaignEndAt,campaignActiveAt,campaignCompletedAt,trackingEnabledForCampaign,trackingAcceptedByInfluencer,trackingDetails,metrics.clicks,metrics.visits,metrics.conversions,metrics.revenue,metrics.reach,metrics.impressions,metrics.engagementRate,metrics.roas,metrics.cpa,metrics.lastUpdatedAt,followerSnapshot.baseline.count,followerSnapshot.baseline.timestamp,followerSnapshot.dailyReadings,followerSnapshot.currentCount,followerSnapshot.netNewFollowers,followerSnapshot.growthRate,followerSnapshot.lastPolledAt,brandUserId,influencerUserId,brandProfileId,influencerProfileId,campaignTitle,campaignDescription,campaignType,deliverables,requiredElements,videoLength,contentGuidelines,hashtags,disclosureRequirements,agreedPrice,budgetRangeMin,budgetRangeMax,paymentTerms,currency,postingDeadline,brandMessage,rejectionReason,sentAt,viewedAt,acceptedAt,rejectedAt,dealClosedAt,expiredAt,cancelledAt,brandName,brandLogoUrl,brandCategory,influencerName,influencerUsername,influencerProfilePic,influencerNiche,createdAt,updatedAt
```

### cashouts
```csv
cashoutCode,influencerUserId,influencerProfileId,amount,currency,status,requestedAt,reviewedAt,processedAt,reviewedByFK,transactionId,payoutMethod,notes,rejectionReason,balanceSnapshot.totalPaid,balanceSnapshot.availableBalance,createdAt,updatedAt
```

### notifications
```csv
recipientUserId,type,title,message,campaignRequestId,senderName,senderAvatar,isRead,readAt,metadata,createdAt,updatedAt
```

### analytics
```csv
influencerId,userId,platform,period,metrics,charts,metadata,createdAt,updatedAt
```

### brand_tracking_connections
```csv
brandId,platform,status,linksStatus,salesStatus,pixelStatus,webhookStatus,trackingKey,webhookSecret,storeUrl,lastEventReceivedAt,lastVerifiedAt,lastError,metadata,createdAt,updatedAt
```

### click_events
```csv
collaborationId,influencerId,brandId,timestamp,ip,userAgent,referrer,sessionId,isUnique,createdAt,updatedAt
```

### purchase_events
```csv
collaborationId,influencerId,brandId,promoCode,orderId,orderValue,currency,source,timestamp,withinWindow,createdAt,updatedAt
```

### users_raw
```csv
userId,platform,source,payload,fetchedAt,createdAt,updatedAt
```

### media_raw
```csv
userId,influencerProfileId,platform,mediaId,payload,fetchedAt,createdAt,updatedAt
```

### insights_raw
```csv
userId,influencerProfileId,platform,targetType,targetId,payload,fetchedAt,createdAt,updatedAt
```

## Notes

- For nested fields in CSV, use dot notation in the header.
- For JSON, keep nested objects and arrays as shown in the template file.
- Use the placeholder IDs consistently across records so relations stay connected.

