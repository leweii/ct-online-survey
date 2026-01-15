# Change: Optimize Analytics as Intelligent Agent

## Why
The current analytics chat is a passive Q&A system that waits for user questions and may refuse to help when data is limited. Users expect an intelligent agent that proactively provides insights, becomes a domain expert based on survey topic, and always offers constructive guidance regardless of data volume.

## What Changes
- **Agent Initialization**: On page load, agent automatically analyzes survey topic and data to generate proactive insights
- **Domain Expertise**: Agent adopts domain knowledge based on survey subject matter (e.g., customer satisfaction, employee engagement, market research)
- **Strong Data Perception**: Enhanced data analysis capabilities including trend detection, pattern recognition, and cross-question correlation
- **Proactive First Message**: Replace static welcome message with immediate, actionable insights and suggestions
- **No Rejection Policy**: Agent SHALL always provide helpful guidance, even with zero or minimal data (suggests data collection strategies, benchmarks, best practices)
- **i18n Support**: All new prompts support both English and Chinese based on user's language preference

## Impact
- Affected specs: new `analytics-agent` capability
- Affected code:
  - `src/app/api/chat/analytics/route.ts` - Redesign system prompt and add proactive analysis endpoint
  - `src/app/dashboard/chat/page.tsx` - Add initial analysis request on survey selection
  - `src/lib/translations.ts` - Add new translation keys for agent messages
