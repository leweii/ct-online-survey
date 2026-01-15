# Change: Update Creator Mode to Auto-Generate Questions

## Why
The current creator flow requires users to manually specify each question one at a time, which is slow and tedious. Users want to simply describe their survey topic and have the AI automatically generate a relevant set of questions that they can then review, remove, or add to.

## What Changes
- **MODIFIED**: Creator system prompt - AI now generates a full question list from the topic
- **MODIFIED**: Creator conversation flow - simplified to: topic → review generated questions → edit/finalize
- **NEW**: Actions for removing questions and replacing the entire question list

## Impact
- Affected specs: `survey-management` (Survey Creation requirement)
- Affected code: `src/app/api/chat/creator/route.ts`, `src/app/create/page.tsx`

## New Flow

### Before (Current)
1. User provides title
2. User provides description
3. User adds question 1 (type, text, options, required...)
4. User adds question 2...
5. Repeat until done
6. Finalize

### After (Proposed)
1. User describes survey topic (e.g., "customer satisfaction for a restaurant")
2. AI generates title, description, and 5-8 relevant questions automatically
3. User reviews the generated questions
4. User can: remove questions, add more questions, or edit existing ones
5. Finalize when satisfied

## Scope

### In Scope
- New prompt that generates questions from topic
- New `set_questions` action to replace entire question list
- New `remove_question` action to delete a question by index
- Updated UI welcome message

### Out of Scope
- Changing question types or validation rules
- Changing the responder mode
- Adding question reordering (can be future enhancement)
