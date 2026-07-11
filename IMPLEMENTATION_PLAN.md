# AI Model Integration with Oracle Cloud - Implementation Plan

## Requirements Analysis
The user wants to add an AI model that:
1. Has access to all pages of individual users differently (personalized per user)
2. Uses Oracle Cloud as the deployment model
3. Uses Oracle Cloud API for access control

## Current State Analysis
- ✅ Oracle Cloud AI endpoint configured (ORACLE_AI_ENDPOINT, ORACLE_AI_API_KEY, ORACLE_AI_MODEL)
- ✅ AI Chat API exists at `/api/ai/chat/route.ts` using Oracle Cloud (with Groq fallback)
- ✅ AI Context Service builds user-specific context from DB (profile, transactions, tax, ML clusters)
- ✅ AI Chat page exists at `/ai-ca` page
- ✅ NextAuth authentication with JWT session
- ✅ User context built per-user with strict userId filtering
- ✅ Context varies by current page path (tax, analytics, settings, dashboard)

## Implementation Plan

### Phase 1: Enhance AI Context Service for Page-Level Access Control
- [ ] Create page-specific context builders for each page (dashboard, analytics, tax, onboarding, settings, upload, calculators)
- [ ] Add page-specific permissions/access control layer
- [ ] Implement Oracle Cloud API integration for access control verification
- [ ] Add page-level context enrichment

### Phase 2: Oracle Cloud Access Control Integration
- [ ] Create Oracle Cloud Access Control Service
- [ ] Add Oracle Cloud IAM/OCI integration for access policies
- [ ] Implement user-level page access policies in Oracle Cloud
- [ ] Add API route for Oracle Cloud access verification

### Phase 3: Enhance AI Chat API with Page-Level Context
- [ ] Extend `/api/ai/chat` to accept page-specific context requests
- [ ] Add page-level access control verification via Oracle Cloud
- [ ] Implement per-page context enrichment
- [ ] Add streaming response with page-specific context

### Phase 4: Create Page-Specific AI Components
- [ ] Create AI sidebar/widget component for each page
- [ ] Add page-specific AI chat interfaces
- [ ] Implement context-aware AI responses per page

### Phase 5: Testing & Integration
- [ ] Test Oracle Cloud API integration
- [ ] Test page-level access control
- [ ] Test user isolation
- [ ] Test Oracle Cloud deployment model integration