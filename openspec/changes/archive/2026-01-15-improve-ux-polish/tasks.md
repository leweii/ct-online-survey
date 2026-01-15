## 1. Fix Action Tag Flickering

- [x] 1.1 Update `creator/route.ts` - buffer chunks that may contain partial action tags before sending
- [x] 1.2 Update `responder/route.ts` - same buffering logic
- [x] 1.3 Test streaming output shows no flickering of action tags

## 2. Reduce Window Width

- [x] 2.1 Change dashboard header from `max-w-6xl` to `max-w-4xl`
- [x] 2.2 Change dashboard main content from `max-w-6xl` to `max-w-4xl`

## 3. Improve Footer Layout

- [x] 3.1 Reorder footer: blog first with AI tagline, then email, then 小红书
- [x] 3.2 Add short tagline like "AI insights" / "AI洞察"

## 4. Move Data Analysis to Survey Level

- [x] 4.1 Remove "Data Analysis" button from dashboard header
- [x] 4.2 Add `onAnalyze` prop to SurveyCard component
- [x] 4.3 Add "分析/Analyze" button to SurveyCard
- [x] 4.4 Add translation key for "Analyze"
- [x] 4.5 Connect button to navigate to `/dashboard/chat?code=X&survey=Y`

## 5. Verification

- [x] 5.1 Run build to verify no TypeScript errors
- [x] 5.2 Test streaming in create page - no action tag flickering
- [x] 5.3 Test streaming in survey chat - no action tag flickering
- [x] 5.4 Verify dashboard width is narrower
- [x] 5.5 Verify footer shows blog first with tagline
- [x] 5.6 Verify analyze button appears on each survey card
