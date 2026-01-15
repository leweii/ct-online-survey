# Proposal: Improve Survey and Creator Identifiers

## Problem Statement

Currently, the system uses:
- **Survey ID**: Full UUID (e.g., `550e8400-e29b-41d4-a716-446655440000`)
- **Creator Code**: 12-character nanoid (e.g., `V1StGXR8_Z5j`)

This creates confusion because:
1. The UUID is too long and not user-friendly for sharing
2. Both identifiers look like random strings - easy to mix them up
3. Neither is memorable or distinctive

## Proposed Solution

### 1. Survey ID → Short Code (4 characters, alphanumeric)
- Format: 4 characters mixing digits and uppercase letters
- Examples: `A7B2`, `3XK9`, `P4M1`
- Used in URLs: `/survey/A7B2`
- Easier to share verbally and type manually

### 2. Creator Code → Fun Pet Name (Chinese/English)
- Format: Random whimsical pet-style name
- Examples:
  - Chinese: `胖墩墩`, `小土豆`, `咕噜噜`, `皮蛋`, `毛球球`, `嘟嘟`
  - English: `Fluffkins`, `Mr.Wobbles`, `Nugget`, `Biscuit`, `Pudding`
- Memorable and clearly different from survey IDs
- Fun and playful, not like real human names

## User Experience Improvements

### Before
```
问卷链接: /survey/550e8400-e29b-41d4-a716-446655440000
创建者代码: V1StGXR8_Z5j
```

### After
```
问卷链接: /survey/A7B2
创建者代码: 胖墩墩
```

## Scope

1. Add new `short_code` column to surveys table
2. Add new `creator_name` column to surveys table (replacing `creator_code` usage)
3. Generate short codes and pet names on survey creation
4. Update URL routing to use short codes
5. Update all UI references
6. Keep UUID as internal primary key for database integrity
7. Migration strategy for existing data (if any)

## Out of Scope

- Changing the internal UUID primary key (keep for referential integrity)
- User authentication or accounts
