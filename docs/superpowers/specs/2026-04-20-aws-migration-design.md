# AWS Migration Design

**Product:** 畅谈问卷 · 我和AI共创一切  
**Date:** 2026-04-20  
**Scope:** Migrate from Supabase + Vercel to AWS DynamoDB + AWS Amplify, replace creator_code with email OTP auth via AWS SES

## Overview

Migrate the ct-online-survey app from Supabase (PostgreSQL) and Vercel hosting to AWS DynamoDB and AWS Amplify. Add email-based OTP authentication using AWS SES, replacing the current `creator_code` identifier system with real user accounts.

Keep Google Gemini AI unchanged.

## Architecture

```
Browser
    │
    ▼
AWS Amplify (Next.js 14 App Router)
    │
    ├─ /api/auth/*        ← OTP auth flow
    ├─ /api/surveys/*     ← Survey CRUD (JWT protected)
    ├─ /api/responses/*   ← Response CRUD
    └─ /api/chat/*        ← Gemini AI (unchanged)
    │
    ├─── AWS DynamoDB      ← Data storage (replaces Supabase)
    ├─── AWS SES           ← OTP email delivery
    └─── Google Gemini     ← AI (unchanged)
```

**Removed:** `@supabase/supabase-js`  
**Added:** `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`, `@aws-sdk/client-ses`, `jsonwebtoken`

## DynamoDB Data Model

### `ct-survey-users`
| Field | Type | Notes |
|-------|------|-------|
| `userId` (PK) | String | UUID |
| `email` | String | GSI: `email-index` |
| `createdAt` | String | ISO timestamp |

### `ct-survey-otp`
| Field | Type | Notes |
|-------|------|-------|
| `email` (PK) | String | |
| `otpHash` | String | bcrypt hash, never store plaintext |
| `expiresAt` | Number | Unix timestamp, DynamoDB TTL auto-deletes |

### `ct-survey-surveys`
| Field | Type | Notes |
|-------|------|-------|
| `surveyId` (PK) | String | UUID |
| `userId` | String | GSI: `userId-index` — replaces `creator_code` |
| `shortCode` | String | GSI: `shortCode-index` |
| `title` | String | |
| `description` | String | |
| `questions` | String | JSON serialized |
| `settings` | String | JSON serialized |
| `status` | String | draft / active / closed |
| `createdAt` | String | ISO timestamp |
| `updatedAt` | String | ISO timestamp |

### `ct-survey-responses`
| Field | Type | Notes |
|-------|------|-------|
| `responseId` (PK) | String | UUID |
| `surveyId` | String | GSI: `surveyId-index` |
| `respondentId` | String | |
| `answers` | String | JSON serialized |
| `status` | String | in_progress / completed |
| `currentQuestionIndex` | Number | |
| `startedAt` | String | ISO timestamp |
| `completedAt` | String | ISO timestamp (nullable) |

## Auth Flow

### Request OTP — `POST /api/auth/request-otp`
1. Validate email format
2. Generate 6-digit numeric OTP
3. bcrypt hash the OTP, store in `ct-survey-otp` with 10-minute TTL
4. Send email via SES: "Your verification code is 123456"
5. Return `{ success: true }` (do not reveal if email exists)

### Verify OTP — `POST /api/auth/verify-otp`
1. Fetch OTP record by email from `ct-survey-otp`
2. Check TTL not expired, bcrypt compare OTP
3. Delete OTP record (prevent replay)
4. If user does not exist in `ct-survey-users`, create new account
5. Sign JWT: `{ userId, email }`, 7-day expiry, signed with `JWT_SECRET`
6. Set JWT in httpOnly cookie
7. Return `{ success: true }`

### Logout — `POST /api/auth/logout`
- Clear the httpOnly cookie

### Middleware (`middleware.ts`)
- Intercepts requests to `/dashboard`, `/create`, `/api/surveys/*`
- Validates JWT from cookie, injects `userId` into request headers
- Redirects unauthenticated users to `/login`
- Public routes: `/survey/[id]`, `/api/responses/*`, `/api/auth/*`

## New Pages

### `/login`
- Step 1: Email input form → calls `request-otp`
- Step 2: 6-digit OTP input → calls `verify-otp`
- On success: redirect to `/dashboard`

## Code Changes

| File | Change |
|------|--------|
| `lib/supabase.ts` | Replace with `lib/dynamodb.ts` (AWS SDK v3 DocumentClient) |
| `lib/auth.ts` | New: OTP generation, JWT sign/verify, SES send |
| `app/api/auth/request-otp/route.ts` | New |
| `app/api/auth/verify-otp/route.ts` | New |
| `app/api/auth/logout/route.ts` | New |
| `app/api/surveys/*` | Replace `creator_code` query param with `userId` from JWT |
| `app/api/responses/*` | Replace Supabase calls with DynamoDB |
| `app/login/page.tsx` | New login page |
| `middleware.ts` | New JWT auth middleware |
| `app/dashboard/*` | Remove creator_code input, use authenticated userId |

**Unchanged:** All `/api/chat/*` routes, `/survey/[id]` page, all UI components except dashboard

## Environment Variables

```bash
# Reused from zhiyu-online/.env
GOOGLE_GENERATIVE_AI_API_KEY=
JWT_SECRET=

# New AWS
AWS_REGION=ap-northeast-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_SES_FROM_EMAIL=noreply@mysurvey.jakobhe.com

# Local dev (optional)
DYNAMODB_ENDPOINT=http://localhost:8000

# Removed
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## Infrastructure Prerequisites

- AWS Route 53: `mysurvey.jakobhe.com` DNS already managed ✓
- AWS SES: `mysurvey.jakobhe.com` domain already verified ✓
- SES from address: `noreply@mysurvey.jakobhe.com`
- Amplify custom domain: bind `mysurvey.jakobhe.com` after deployment

## Security Notes

- OTP is bcrypt-hashed before storage, never stored plaintext
- OTP records are deleted immediately after successful verification (replay prevention)
- JWT stored in httpOnly cookie (not accessible to JavaScript)
- DynamoDB TTL auto-expires stale OTP records
- SES response does not reveal whether email is registered (prevents user enumeration)
