# Tasks: Update Creator Mode to Auto-Generate Questions

## 1. Update Creator System Prompt
- [x] 1.1 Rewrite CREATOR_SYSTEM_PROMPT to generate questions from topic
- [x] 1.2 Add `set_questions` action format for bulk question setting
- [x] 1.3 Add `remove_question` action format for deleting questions

## 2. Update Action Handlers
- [x] 2.1 Add handler for `set_questions` action in route.ts
- [x] 2.2 Add handler for `remove_question` action in route.ts

## 3. Update UI
- [x] 3.1 Update welcome message in create/page.tsx to reflect new flow

## 4. Testing
- [x] 4.1 Test topic-to-questions generation flow
- [x] 4.2 Test removing questions from generated list
- [x] 4.3 Test adding additional questions after generation
- [x] 4.4 Test finalizing survey with mixed generated/added questions
