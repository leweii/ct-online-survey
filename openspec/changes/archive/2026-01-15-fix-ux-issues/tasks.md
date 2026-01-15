# Tasks: Fix UX Issues

## 1. CSV Export UTF-8 BOM Fix
- [x] 1.1 Update `src/lib/csv.ts` to prepend UTF-8 BOM (`\uFEFF`) to CSV output
- [x] 1.2 Verify Chinese characters display correctly in Excel

## 2. Survey-Level Analytics
- [x] 2.1 Add survey selector dropdown to `/dashboard/chat/page.tsx`
- [x] 2.2 Filter responses based on selected survey
- [x] 2.3 Update stats card to show selected survey stats
- [x] 2.4 Update welcome message to mention selected survey
- [x] 2.5 Pass selected survey context to analytics API

## 3. Custom Creator Name Input
- [x] 3.1 Add creator name input field to homepage (above mode selector)
- [x] 3.2 Save creator name to localStorage on input
- [x] 3.3 Load creator name from localStorage on page load
- [x] 3.4 Pass creator name to `/create` page via URL params or state
- [x] 3.5 Update `/create/page.tsx` to use custom creator name if provided
- [x] 3.6 Update `/api/chat/creator/route.ts` to accept custom creator_name
- [x] 3.7 Pre-fill dashboard code input from localStorage

## 4. Consistent Navigation Styling
- [x] 4.1 Update `/dashboard/DashboardContent.tsx` header:
  - [x] Replace "首页" button with back arrow icon
  - [x] Match style with create page and analytics chat page
- [x] 4.2 Verify navigation consistency across all pages

## 5. Testing
- [x] 5.1 Test CSV export with Chinese content in Excel
- [x] 5.2 Test survey-level analytics with multiple surveys
- [x] 5.3 Test creator name persistence across sessions
- [x] 5.4 Test navigation flow from all pages

## Dependencies
- Tasks 1-4 can be done in parallel
- Task 5 depends on all others
