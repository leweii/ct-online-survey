# Proposal: Fix UX Issues

## Problem Statement

4 user experience issues need to be addressed:

### Issue 1: Analytics is User-Level, Not Survey-Level
**Current**: The analytics chat page (`/dashboard/chat`) shows combined stats for ALL surveys under a creator.
**Problem**: Users expect to analyze responses for a SPECIFIC survey, not aggregated data.
**Solution**: Add survey selector to analytics page, default to analyzing one survey at a time.

### Issue 2: CSV Export Chinese Characters Garbled
**Current**: CSV export doesn't include UTF-8 BOM.
**Problem**: When opening in Excel, Chinese characters appear as garbled text.
**Solution**: Add UTF-8 BOM (`\uFEFF`) at the start of CSV file.

### Issue 3: Allow Custom Creator Name Input
**Current**: Creator name is randomly generated (e.g., "胖墩墩").
**Problem**: Users can't remember random names, hard to find their surveys later.
**Solution**:
- Add creator name input at top of homepage (above mode selector)
- When creating survey, pass the entered creator name
- When viewing dashboard, pre-fill from the input
- Store in localStorage for persistence

### Issue 4: Dashboard "首页" Button Style Inconsistent
**Current**: Dashboard uses a bordered button for "首页", but other pages use a back arrow icon.
**Problem**: Inconsistent navigation patterns across the app.
**Solution**: Replace the "首页" button with a back arrow icon like other pages (create page, analytics chat).

## Scope

1. Add survey selector dropdown to analytics page
2. Fix CSV export encoding
3. Add persistent creator name input to homepage
4. Unify navigation button styles

## Out of Scope

- Changing the random name generation logic
- Adding user authentication
