# AI Model Integration with Oracle Cloud - Implementation Plan

## Requirements
- AI model that has access to all pages of individual users differently (personalized per user)
- Oracle Cloud as the deployment model
- Oracle Cloud API for access control

## Architecture Overview

```
User -> Page (analytics/tax/onboarding/etc) -> AIWidget Component

                                              v
                              /api/ai/chat (route.ts)
                                   |
                      +------------+------------+
                      |                         |
            Access Control Check      Context Building
        (oracle-access-control)    (ai-context.service)
                      |                         |
              +-------+-------+       +---------+---------+
              |               |       |                   |
         Page-Level      Rate Limit   Profile  Transactions Tax ML-Clusters
         Permissions     Check
              |
         PostgreSQL DB
         (ai_access_policies, ai_chat_logs)
```

## Implementation Status

### Phase 1: Enhance AI Context Service for Page-Level Access Control ✅ COMPLETED
- ✅ Created page-specific context builders for each page (dashboard, analytics, tax, onboarding, settings, upload, calculators)
- ✅ Added page-specific permissions/access control layer
- ✅ Integrated Oracle Cloud access control verification
- ✅ Added page-level context enrichment
- **Files:** `server/services/ai-context.service.ts`

### Phase 2: Oracle Cloud Access Control Integration ✅ COMPLETED
- ✅ Created Oracle Cloud Access Control Service (`server/services/oracle-access-control.service.ts`)
- ✅ Oracle Cloud IAM/OCI configuration ready (with env var placeholders)
- ✅ User-level page access policies managed in PostgreSQL via Drizzle ORM
- ✅ Per-page access verification (verifyPageAccess)
- ✅ AI model access verification with context type + token limits (verifyAIModelAccess)
- ✅ Rate limiting based on ai_chat_logs usage history
- ✅ Audit logging for access denials
- ✅ AI usage tracking to ai_chat_logs table
- **Files:** `server/services/oracle-access-control.service.ts`

### Phase 3: Enhance AI Chat API with Page-Level Context ✅ COMPLETED
- ✅ Extended `/api/ai/chat` to accept page-specific context requests
- ✅ Page-level access control verification via Oracle Cloud service
- ✅ Per-page context enrichment with access control checks
- ✅ Streaming response with page-specific context
- **Files:** `app/api/ai/chat/route.ts`

### Phase 4: Create Page-Specific AI Components ✅ COMPLETED
- ✅ Created AIWidget component (`components/ai-sidebar.tsx`)
- ✅ Added AIWidget to analytics page (`app/analytics/page.tsx`)
- ✅ Added AIWidget to tax page (`app/tax/page.tsx`)
- ✅ Added AIWidget to onboarding page (`app/onboarding/page.tsx`)
- ✅ Added AIWidget to calculators page (`app/calculators/page.tsx`)
- ✅ Added AIWidget to upload page (`app/upload/page.tsx`)
- ✅ AIWidget passes current page path for context-aware responses
- **Files:** `components/ai-sidebar.tsx`

### Phase 5: Database Schema & Infrastructure ✅ COMPLETED
- ✅ Created database schema for AI tables (`server/db/schema/ai.ts`)
  - `ai_access_policies` - Per-user AI access policies
  - `ai_chat_logs` - AI chat conversation logs with usage tracking
- ✅ Registered new schema in `server/db/schema/index.ts`
- ✅ Created database migration SQL script (`scripts/migration-ai-tables.sql`)
- ✅ Updated `.env.local` with Oracle Cloud environment variables

## Key Components

### 1. `server/services/oracle-access-control.service.ts`
Oracle Cloud Access Control Service that manages:
- User-specific page access policies
- AI model access with context type permissions
- Token and request rate limiting
- Audit logging
- Uses Drizzle ORM with PostgreSQL (ai_access_policies, ai_chat_logs tables)

### 2. `server/services/ai-context.service.ts`
AI Context Service:
- Builds per-user, per-page context for AI model
- Integrates with Oracle access control for context gating
- Fetches user profile, transactions, tax data, ML clusters based on page
- Context types vary by page (accounting for tax, finance for calculators, etc.)

### 3. `app/api/ai/chat/route.ts`
AI Chat API Route:
- Secured with NextAuth JWT session
- Validates access via Oracle Access Control before responding
- Uses page-specific context from ai-context.service
- Streams responses using AI SDK (Verax AI with Oracle Cloud, Groq fallback)

### 4. `components/ai-sidebar.tsx`
AIChatSidebar / AIWidget Component:
- Reusable sidebar chat widget
- Passes current page path for context-aware AI
- 4 preset questions tailored per page
- Collapsible sidebar panel with chat interface

### 5. `server/db/schema/ai.ts`
Database Tables:
- `ai_access_policies` - Stores per-user page access, token limits, context permissions
- `ai_chat_logs` - Tracks every AI interaction for rate limiting and audit

## Oracle Cloud Environment Variables (.env.local)
```
ORACLE_AI_ENDPOINT       - Oracle Cloud AI inference endpoint
ORACLE_AI_API_KEY        - API key for Oracle Cloud AI
ORACLE_AI_MODEL          - Model name (default: oracle-llama-3-8b)
OCI_TENANCY_ID           - Oracle Cloud tenancy OCID
OCI_USER_ID              - Oracle Cloud user OCID
OCI_FINGERPRINT          - API signing key fingerprint
OCI_PRIVATE_KEY          - API signing private key
OCI_REGION               - Oracle Cloud region (ap-mumbai-1)
OCI_COMPARTMENT_ID       - Oracle Cloud compartment OCID
```

## How Page-Level Access Works

1. User navigates to a page (e.g., `/analytics`)
2. AIWidget component sends `pagePath` to `/api/ai/chat`
3. Chat API calls `oracleAccessControl.getUserAccessContext(userId, email, pagePath)`
4. Access control service:
   - Looks up policies in `ai_access_policies` table (PostgreSQL)
   - Falls back to default policies if no DB record
   - Normalizes path (e.g., `/analytics/clusters` -> `/analytics`)
   - Returns page access policy + AI model config
5. Chat API calls `aiContextService.buildContext(userId, role, pagePath)`
6. Context service:
   - Queries DB for user-specific data (profile, transactions, tax, clusters)
   - Applies access policy data scope (full/summary/restricted)
   - Returns context tailored to the page and user
7. AI model (Oracle Cloud) responds with contextualized answers
8. Usage logged to `ai_chat_logs` for rate limiting and audit

## Database Migration
Run the migration script to create AI tables:
```bash
psql "$DATABASE_URL" -f scripts/migration-ai-tables.sql