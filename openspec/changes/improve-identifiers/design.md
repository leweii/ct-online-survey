# Design: Improved Identifiers

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     surveys table                            │
├─────────────────────────────────────────────────────────────┤
│ id (UUID)          - Internal primary key (unchanged)        │
│ short_code (4char) - NEW: User-facing survey identifier      │
│ creator_name       - NEW: Fun pet name for creator           │
│ creator_code       - DEPRECATED: Keep for migration          │
└─────────────────────────────────────────────────────────────┘
```

## Short Code Generation

### Format
- 4 characters: mix of uppercase letters (A-Z) and digits (0-9)
- Excludes confusing characters: `0`, `O`, `1`, `I`, `L` to avoid misreading
- Allowed characters: `23456789ABCDEFGHJKMNPQRSTUVWXYZ` (32 chars)
- Total combinations: 32^4 = 1,048,576 (over 1 million unique codes)

### Generation Algorithm
```typescript
function generateShortCode(): string {
  const chars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
```

### Collision Handling
- Check if code exists before inserting
- Retry with new code if collision (up to 10 attempts)
- If 10 retries fail at current length, increase code length by 1
- Add unique constraint on `short_code` column

### Adaptive Length Algorithm
```typescript
async function generateUniqueShortCode(db: any): Promise<string> {
  const chars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  let length = 4; // Start with 4 characters
  const maxLength = 8; // Safety limit
  const maxRetries = 10;

  while (length <= maxLength) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      let code = '';
      for (let i = 0; i < length; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }

      // Check if code exists
      const { data } = await db
        .from('surveys')
        .select('id')
        .eq('short_code', code.toUpperCase())
        .single();

      if (!data) {
        return code; // Unique code found
      }
    }
    // All retries failed at this length, increase length
    length++;
  }

  throw new Error('Unable to generate unique short code');
}
```

### Capacity Planning
| Length | Combinations | Sufficient For |
|--------|--------------|----------------|
| 4 chars | 1,048,576 | ~1M surveys |
| 5 chars | 33,554,432 | ~33M surveys |
| 6 chars | 1,073,741,824 | ~1B surveys |

The system automatically scales as needed.

## Pet Name Generation

### Name Pool Structure
```typescript
const petNames = {
  zh: [
    // 叠词类 (Reduplication)
    '胖墩墩', '毛球球', '咕噜噜', '嘟嘟', '团团', '圆圆',
    // 食物类 (Food-themed)
    '小土豆', '皮蛋', '年糕', '汤圆', '小笼包', '馒头',
    // 动物昵称 (Animal nicknames)
    '小肥猪', '懒羊羊', '呆萌鸡', '二哈', '橘猫', '奶牛',
    // 拟声词 (Onomatopoeia)
    '喵喵', '汪汪', '叽叽', '咩咩', '哞哞',
    // 可爱形容词+名词 (Cute adj+noun)
    '小胖子', '肉肉', '糯米糍', '小泡芙', '棉花糖',
    // ... more names (50+ total)
  ],
  en: [
    // Food names
    'Nugget', 'Biscuit', 'Pudding', 'Muffin', 'Pickle',
    // Silly titles
    'Mr.Wobbles', 'Sir.Fluffington', 'Captain.Snuggles',
    // Texture/appearance
    'Fluffkins', 'Fuzzbucket', 'Butterball', 'Chonkers',
    // Sound-based
    'Squeaky', 'Snorty', 'Grunty',
    // ... more names (50+ total)
  ]
};
```

### Selection Algorithm
- Random selection from pool
- Each creator gets a unique name
- Check for uniqueness before assigning
- If collision after N retries, append random digits

### Language Detection
- Use survey's language setting (already captured)
- Default to Chinese names if language is `zh`
- Use English names for other languages

## Database Changes

### New Columns
```sql
ALTER TABLE surveys
ADD COLUMN short_code VARCHAR(8) UNIQUE,  -- Supports 4-8 chars with adaptive length
ADD COLUMN creator_name VARCHAR(50) NOT NULL DEFAULT '';

CREATE UNIQUE INDEX idx_surveys_short_code ON surveys(short_code);
CREATE INDEX idx_surveys_creator_name ON surveys(creator_name);
```

### Migration Strategy
For existing surveys (if any):
1. Generate short_code for each existing survey
2. Generate creator_name based on existing creator_code mapping
3. Keep creator_code for backward compatibility temporarily

## API Changes

### Survey Lookup
- `/survey/[id]` - Accept both UUID and short_code
- Try short_code first (4 chars), fall back to UUID

### Dashboard Access
- `/dashboard?code=胖墩墩` - Use creator_name
- Keep backward compatibility with old creator_code

### Survey Creation Response
```json
{
  "id": "uuid-here",
  "short_code": "A7B2",
  "creator_name": "胖墩墩",
  "title": "...",
  ...
}
```

## UI Updates

### Survey Creation Complete Message
```
问卷已创建成功！

问卷代码：A7B2
问卷链接：example.com/survey/A7B2

创建者名称：胖墩墩
（用于查看数据仪表盘，请妥善保存）
```

### Dashboard Login
```
输入您的创建者名称
[胖墩墩          ]
[查看问卷]
```

### Take Survey Input
```
输入问卷代码
[A7B2            ]
[开始填写]
```

## Security Considerations

1. **Short code brute-force**:
   - 1M+ combinations makes guessing impractical
   - Rate limiting on survey access can mitigate

2. **Creator name enumeration**:
   - Names are unique but not secret
   - Dashboard only shows surveys, no sensitive data
   - Could add rate limiting if needed

## Trade-offs

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| Code length | 4 chars | Balance between brevity and collision avoidance |
| Name pool | ~100 names | Enough variety, easy to maintain |
| Migration | Keep old fields | Backward compatibility, gradual transition |
| Case sensitivity | Case-insensitive | Better UX for manual input |
