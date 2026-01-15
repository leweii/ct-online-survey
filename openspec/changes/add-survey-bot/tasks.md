# Tasks: Add Conversational Survey Bot

## 1. Project Setup
- [x] 1.1 Initialize Next.js 14+ project with App Router and TypeScript
- [x] 1.2 Configure Tailwind CSS
- [x] 1.3 Set up Supabase project and obtain credentials
- [x] 1.4 Install dependencies: `@ai-sdk/google`, `ai`, `@supabase/supabase-js`, `nanoid`
- [x] 1.5 Configure environment variables (GOOGLE_GENERATIVE_AI_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY)
- [x] 1.6 Set up Supabase client utility (`lib/supabase.ts`)

## 2. Database Setup
- [x] 2.1 Create `surveys` table with schema from design.md
- [x] 2.2 Create `responses` table with schema from design.md
- [x] 2.3 Add database indexes for performance
- [x] 2.4 Generate TypeScript types from Supabase schema

## 3. Core UI Components
- [x] 3.1 Create reusable `ChatInterface` component (message list, input, send button)
- [x] 3.2 Create `MessageBubble` component (user vs bot styling)
- [x] 3.3 Create `ModeSelector` component (Create Survey / Take Survey toggle)
- [x] 3.4 Create landing page with mode selector and survey link input

## 4. Survey Creator Mode
- [x] 4.1 Create `/create` page with chat interface
- [x] 4.2 Implement `/api/chat/creator` route with Gemini integration
- [x] 4.3 Design creator system prompt for survey building flow
- [x] 4.4 Implement action parsing from AI responses (`<ACTION>...</ACTION>`)
- [x] 4.5 Implement survey state management during conversation
- [x] 4.6 Add survey finalization and unique link generation
- [x] 4.7 Implement survey editing through conversation

## 5. Survey Responder Mode
- [x] 5.1 Create `/survey/[id]` page with chat interface
- [x] 5.2 Implement `/api/chat/responder` route with Gemini integration
- [x] 5.3 Design responder system prompt for question presentation
- [x] 5.4 Implement response validation per question type
- [x] 5.5 Add "go back to previous question" functionality
- [x] 5.6 Implement partial response saving (resume later)
- [x] 5.7 Add survey completion flow with thank you message

## 6. Survey CRUD API
- [x] 6.1 Implement `GET /api/surveys` (list by creator_code)
- [x] 6.2 Implement `POST /api/surveys` (create survey)
- [x] 6.3 Implement `GET /api/surveys/[id]` (get survey details)
- [x] 6.4 Implement `PATCH /api/surveys/[id]` (update survey)
- [x] 6.5 Implement `GET /api/surveys/[id]/responses` (list responses)

## 7. Response Management API
- [x] 7.1 Implement `POST /api/responses` (start new response session)
- [x] 7.2 Implement `PATCH /api/responses/[id]` (update response/save progress)

## 8. Data Export
- [x] 8.1 Create CSV export utility (`lib/csv.ts`)
- [x] 8.2 Implement `GET /api/surveys/[id]/export` (download CSV)
- [x] 8.3 Ensure proper column headers based on question text

## 9. Creator Dashboard
- [x] 9.1 Create `/dashboard` page
- [x] 9.2 Implement survey list view with response counts
- [x] 9.3 Add CSV export button per survey
- [x] 9.4 Add survey status management (draft/active/closed)

## 10. Polish & Testing
- [x] 10.1 Add loading states and error handling throughout
- [x] 10.2 Implement responsive design for mobile
- [x] 10.3 Add input validation on all forms
- [x] 10.4 Test complete creator flow end-to-end
- [x] 10.5 Test complete responder flow end-to-end
- [x] 10.6 Test CSV export with various question types

## 11. Deployment
- [x] 11.1 Configure Vercel project
- [x] 11.2 Set environment variables in Vercel
- [x] 11.3 Deploy and verify production functionality
