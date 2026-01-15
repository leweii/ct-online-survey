# Change: Improve UX Polish

## Why
Several UX issues affect user experience:
1. Action tags (`<ACTION>...</ACTION>`) flicker during streaming - partial tags appear/disappear as AI generates them
2. Dashboard window is too wide (`max-w-6xl` = 1152px)
3. Footer should prioritize blog with AI knowledge tagline
4. Data Analysis button is at user-level but should be survey-level

## What Changes

### 1. Fix Action Tag Flickering
- **Current**: Backend sends each chunk through `removeActionTags()`, but partial tags like `<ACTION>{"type":` are visible until complete
- **Solution**: Buffer content that might contain action tags on backend; only send clean text to frontend
- Files: `src/app/api/chat/creator/route.ts`, `src/app/api/chat/responder/route.ts`

### 2. Reduce Window Width
- Change dashboard from `max-w-6xl` to `max-w-4xl` (896px)
- Files: `src/app/dashboard/DashboardContent.tsx`

### 3. Improve Footer Layout
- Reorder: Blog first (with AI knowledge tagline), then email, then 小红书
- Keep it short and focused
- Files: `src/components/Footer.tsx`

### 4. Move Data Analysis to Survey Level
- Remove "Data Analysis" button from dashboard header
- Add "分析" / "Analyze" button to each SurveyCard
- Button navigates to `/dashboard/chat?code=X&survey=Y`
- Files: `src/app/dashboard/DashboardContent.tsx`, `src/components/SurveyCard.tsx`

## Impact
- Affected code:
  - `src/app/api/chat/creator/route.ts` - buffer action tags
  - `src/app/api/chat/responder/route.ts` - buffer action tags
  - `src/app/dashboard/DashboardContent.tsx` - width + remove header button
  - `src/components/SurveyCard.tsx` - add analyze button
  - `src/components/Footer.tsx` - reorder items
  - `src/lib/translations.ts` - add translation for "Analyze"
