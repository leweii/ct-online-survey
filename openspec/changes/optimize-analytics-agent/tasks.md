## 1. Backend - Analytics Agent API

- [x] 1.1 Redesign system prompt with domain expertise capabilities
- [x] 1.2 Add proactive analysis endpoint (`POST /api/chat/analytics/init`)
- [x] 1.3 Implement survey topic detection and domain knowledge injection
- [x] 1.4 Implement "no rejection" logic - always provide helpful guidance
- [x] 1.5 Add language parameter support for bilingual responses

## 2. Frontend - Chat Page Integration

- [x] 2.1 Add auto-fetch for initial analysis when survey is selected
- [x] 2.2 Replace static welcome message with AI-generated insights
- [x] 2.3 Handle loading state for initial analysis
- [x] 2.4 Pass language preference to API calls

## 3. Translations

- [x] 3.1 Add new translation keys for analytics agent messages
- [x] 3.2 Update existing analytics translations if needed

## 4. Testing & Verification

- [x] 4.1 Test with survey containing responses
- [x] 4.2 Test with survey containing zero responses (no rejection behavior)
- [x] 4.3 Test language switching (English/Chinese)
- [x] 4.4 Run build to verify no TypeScript errors
