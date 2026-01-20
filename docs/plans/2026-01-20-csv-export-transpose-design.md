# CSV Export Transposed Format Design

**Date:** 2026-01-20
**Status:** Approved

## Overview

Optimize CSV export functionality to transpose the data format from response-centric (rows = responses, columns = questions) to question-centric (rows = questions, columns = responses).

## Requirements

- Questions as rows, responses as columns
- Response columns numbered: "Response 1", "Response 2", etc.
- No metadata (respondent ID, timestamps) - questions and answers only
- Replace current format entirely (not an additional option)

## Current State

**File:** `src/lib/csv.ts`

Current format:
```csv
response_id,respondent_id,completed_at,Question 1,Question 2,...
resp-123,user-1,2026-01-20T10:00:00Z,Answer A,Answer B,...
resp-456,user-2,2026-01-20T11:00:00Z,Answer C,Answer D,...
```

## Proposed Format

New format:
```csv
Question,Response 1,Response 2,Response 3
"What is your name?",Alice,Bob,Charlie
"How satisfied are you?",Very satisfied,Satisfied,Very satisfied
"Would you recommend us?",Yes,Yes,No
```

## Implementation Approach

### Data Transformation

1. **Filter completed responses** (unchanged)
2. **Build header row:**
   - First column: `"Question"`
   - Remaining columns: `"Response 1"`, `"Response 2"`, ... (count-based)

3. **Build question rows:**
   - Outer loop: iterate through `questions` array
   - For each question:
     - First cell: `question.text`
     - Inner loop: iterate through `responses`, extract `response.answers[question.id]`
   - Handle multi-select (arrays): join with `"; "` separator

4. **Escape CSV values** (existing `escapeCSV` helper, unchanged)
5. **Add UTF-8 BOM** (unchanged, for Excel Chinese character support)

### Code Changes

**Modified file:** `src/lib/csv.ts` - rewrite `generateCSV()` function

**No changes needed:**
- `/api/surveys/[id]/export/route.ts` (route handler)
- Type definitions
- Database queries

## Edge Cases

1. **No responses:** Export CSV with question column only, no response columns
2. **Array answers (multi-select):** Join array values with `"; "` separator
3. **Missing answers:** Empty string for unanswered optional questions
4. **Special characters:** Handled by existing `escapeCSV` (quotes, commas, newlines)
5. **Empty questions:** Return minimal CSV (shouldn't occur in practice)

## Testing Plan

Manual testing checklist:
- Export with 0 responses
- Export with 1 response
- Export with multiple responses
- Multi-select question answers
- Questions containing commas, quotes, newlines
- Chinese characters (verify UTF-8 BOM works)
- Open in Excel and Google Sheets

## Benefits

- Better for data analysis tools (questions as variables)
- Cleaner format for surveys with many questions, few responses
- Easier to compare responses side-by-side

## Risks

- Breaking change for users expecting old format
- Wide CSV files if many responses (mitigated: typically surveys have more questions than responses)
