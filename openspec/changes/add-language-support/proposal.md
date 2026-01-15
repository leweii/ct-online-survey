# Change: Add Language Support for Surveys

## Why
Currently, the AI prompts are hardcoded in English. When a survey creator uses a different language (e.g., Chinese, Spanish), the AI should:
1. Detect the creator's language and respond in that language
2. Store the survey's language so responders know what language the survey is in
3. Allow responders to set their preferred language for AI interactions

This enables better international support without manual translation.

## What Changes
- **MODIFIED**: Creator prompt - detect language from user input and respond in same language
- **MODIFIED**: Responder prompt - use survey language by default, but allow responder language preference
- **MODIFIED**: Survey schema - add `language` field to store survey language
- **NEW**: Responder can specify preferred language for AI responses

## Impact
- Affected code: `src/app/api/chat/creator/route.ts`, `src/app/api/chat/responder/route.ts`
- Affected schema: `surveys` table (add `language` column)
- Affected types: `Survey`, `SurveySettings`

## Language Flow

### Creator Mode
1. Creator describes survey topic in any language (e.g., Chinese: "咖啡店客户满意度调查")
2. AI detects language and generates survey content in same language
3. Survey language is saved to database
4. All subsequent creator interactions are in detected language

### Responder Mode
1. Responder opens survey link
2. AI presents questions in survey's original language by default
3. If responder types in a different language, AI can respond in responder's language
4. Question text remains in original language (as created), but AI guidance adapts

## Scope

### In Scope
- Language detection from user input (creator)
- Store survey language in database
- Creator prompt responds in detected language
- Responder prompt adapts to responder's language preference
- Language stored in survey settings

### Out of Scope
- Translating survey questions (questions stay in original language)
- UI translation (remains English)
- Language selection dropdown (auto-detected from input)
