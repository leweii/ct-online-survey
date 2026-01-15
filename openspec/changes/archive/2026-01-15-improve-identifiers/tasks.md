# Tasks: Improve Survey and Creator Identifiers

## 1. Database Schema Updates
- [x] 1.1 Update `supabase/schema.sql` to add `short_code` column (VARCHAR(8), UNIQUE) - supports 4-8 chars
- [x] 1.2 Update `supabase/schema.sql` to add `creator_name` column (VARCHAR(50))
- [x] 1.3 Add unique index on `short_code`
- [x] 1.4 Add index on `creator_name`

## 2. Identifier Generation Utilities
- [x] 2.1 Create `src/lib/identifiers.ts` with:
  - [x] `generateUniqueShortCode(db)` function with adaptive length:
    - Start at 4 characters
    - Retry up to 10 times on collision
    - Increase length by 1 if all retries fail
    - Maximum length: 8 characters
    - Excludes confusing chars (0, O, 1, I, L)
  - [x] `generateCreatorName(language: string)` function
  - [x] Chinese pet name pool (~50 names)
  - [x] English pet name pool (~50 names)

## 3. TypeScript Types
- [x] 3.1 Update `src/types/database.ts` Survey interface:
  - [x] Add `short_code: string`
  - [x] Add `creator_name: string`
  - [x] Keep `creator_code` for backward compatibility

## 4. API Updates
- [x] 4.1 Update `/api/surveys/route.ts` POST handler:
  - [x] Generate `short_code` with collision retry
  - [x] Generate `creator_name` based on survey language
- [x] 4.2 Update `/api/surveys/route.ts` GET handler:
  - [x] Support lookup by `creator_name`
- [x] 4.3 Update `/api/surveys/[id]/route.ts`:
  - [x] Support lookup by both UUID and short_code
- [x] 4.4 Update `/api/chat/creator/route.ts`:
  - [x] Use `creator_name` instead of `creator_code` in surveyState
  - [x] Update finalize action to use new identifiers

## 5. Survey Page Updates
- [x] 5.1 Update `/survey/[id]/page.tsx`:
  - [x] Modify API call to support short_code lookup
  - [x] Handle both UUID and short_code formats

## 6. UI Updates
- [x] 6.1 Update `/src/app/page.tsx` (Homepage):
  - [x] Change survey input placeholder to "问卷代码"
  - [x] Change creator input placeholder to "您的创建者名称"
  - [x] Update help text to explain new formats
- [x] 6.2 Update `/src/app/dashboard/DashboardContent.tsx`:
  - [x] Change lookup to use `creator_name`
  - [x] Update placeholder and labels
- [x] 6.3 Update `/src/app/create/page.tsx`:
  - [x] Display `short_code` in completion message
  - [x] Display `creator_name` instead of `creator_code`

## 7. Creator Chat Updates
- [x] 7.1 Update `/api/chat/creator/route.ts` completion message format:
  - [x] Show "问卷代码" instead of full URL
  - [x] Show "创建者名称" instead of "创建者代码"

## 8. Validation & Testing
- [x] 8.1 Verify short_code generation uniqueness
- [x] 8.2 Test survey access via short_code
- [x] 8.3 Test dashboard access via creator_name
- [x] 8.4 Test backward compatibility (UUID still works)
- [x] 8.5 Test collision handling for short_code

## Dependencies
- Task 2 must complete before Tasks 4-7 (utilities needed)
- Task 1 must complete before Task 4 (schema needed)
- Tasks 4-7 can be parallelized after dependencies met
