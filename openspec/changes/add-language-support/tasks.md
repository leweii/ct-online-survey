# Tasks: Add Language Support

## 1. Update Database Schema
- [x] 1.1 Add `language` field to `SurveySettings` type in `database.ts`
- [x] 1.2 Update Supabase schema with `language` column on surveys table (optional, stored in settings JSONB)

## 2. Update Creator Prompt
- [x] 2.1 Add language detection instruction to CREATOR_SYSTEM_PROMPT
- [x] 2.2 Add `set_language` action to store detected language
- [x] 2.3 Add handler for `set_language` action in route.ts
- [x] 2.4 Pass language to state and save with survey

## 3. Update Responder Prompt
- [x] 3.1 Read survey language from survey settings
- [x] 3.2 Add language instruction to buildResponderPrompt
- [x] 3.3 Instruct AI to adapt to responder's language if different
- [x] 3.4 Keep question text in original language

## 4. Testing
- [x] 4.1 Test creating survey in Chinese
- [x] 4.2 Test creating survey in English
- [x] 4.3 Test responder using different language than survey
- [x] 4.4 Verify questions remain in original language
