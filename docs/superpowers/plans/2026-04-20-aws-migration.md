# AWS Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate 畅谈问卷 from Supabase + Vercel to AWS DynamoDB + AWS Amplify, replace `creator_code` with email-OTP authentication via AWS SES.

**Architecture:** Custom 6-digit OTP flow using AWS SES for delivery, DynamoDB with TTL for OTP storage, bcrypt for hashing, custom JWT sessions in httpOnly cookies. 4 DynamoDB tables (users / otp / surveys / responses) mirror the current Supabase schema. All Google Gemini AI code stays unchanged.

**Tech Stack:** Next.js 14 (App Router), AWS Amplify Hosting, DynamoDB, AWS SES, jsonwebtoken, bcryptjs, AWS SDK v3, Google Gemini AI (unchanged)

**Spec:** `docs/superpowers/specs/2026-04-20-aws-migration-design.md`

---

## File Structure

**New files:**
- `src/lib/dynamodb.ts` — DynamoDB DocumentClient
- `src/lib/db/users.ts` — user CRUD
- `src/lib/db/otp.ts` — OTP CRUD
- `src/lib/db/surveys.ts` — survey CRUD
- `src/lib/db/responses.ts` — response CRUD
- `src/lib/auth/otp.ts` — generate + bcrypt hash + verify
- `src/lib/auth/jwt.ts` — sign + verify JWT
- `src/lib/auth/ses.ts` — send OTP email
- `src/lib/auth/session.ts` — cookie + getCurrentUser helpers
- `src/app/api/auth/request-otp/route.ts`
- `src/app/api/auth/verify-otp/route.ts`
- `src/app/api/auth/logout/route.ts`
- `src/app/api/auth/me/route.ts`
- `src/app/login/page.tsx`
- `src/middleware.ts` — JWT gate
- `scripts/create-dynamodb-tables.ts` — local + production table creation
- `amplify.yml` — Amplify build config
- `docker-compose.yml` — local DynamoDB

**Deleted files:**
- `src/lib/supabase.ts`
- `supabase/schema.sql`, `supabase/` dir
- `src/app/api/surveys/[id]/debug/route.ts`

**Modified files:**
- `src/types/database.ts` — new shape
- `src/lib/identifiers.ts` — shortCode uniqueness via DynamoDB
- All `src/app/api/surveys/**`, `src/app/api/responses/**`, `src/app/api/chat/**`
- `src/lib/analytics-tools.ts`
- `src/app/page.tsx`, `src/app/dashboard/**`, `src/app/create/page.tsx`
- `src/lib/translations.ts` — product name rebrand
- `package.json` — deps swap
- `.env.example`
- `CLAUDE.md`

---

## Phase 1 · Foundation

### Task 1: Swap dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Remove Supabase, add AWS SDK + auth libs**

```bash
npm uninstall @supabase/supabase-js
npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb @aws-sdk/client-ses jsonwebtoken bcryptjs
npm install -D @types/jsonwebtoken @types/bcryptjs
```

- [ ] **Step 2: Verify build still passes**

Run: `npm run build`
Expected: TypeScript errors ONLY in files that import `@/lib/supabase` (that is fine for now; we replace them below).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: swap supabase for aws-sdk + auth libs"
```

---

### Task 2: Environment variables

**Files:**
- Modify: `.env.example`
- Modify: `.env.local` (local, not committed — user does by hand)

- [ ] **Step 1: Update `.env.example`**

```bash
# Google Gemini
GOOGLE_GENERATIVE_AI_API_KEY=

# AWS
AWS_REGION=ap-northeast-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# AWS SES
AWS_SES_FROM_EMAIL=noreply@mysurvey.jakobhe.com

# Auth
JWT_SECRET=

# DynamoDB (local dev only — leave unset in production)
DYNAMODB_ENDPOINT=http://localhost:8000

# Cloudflare Turnstile (kept)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
```

- [ ] **Step 2: Manually create `.env.local` with real values**

Copy `GOOGLE_GENERATIVE_AI_API_KEY` and `JWT_SECRET` from `~/github/zhiyu-online/server/.env`. Fill in AWS creds.

- [ ] **Step 3: Commit**

```bash
git add .env.example
git commit -m "config: update env vars for AWS migration"
```

---

### Task 3: Local DynamoDB via docker-compose

**Files:**
- Create: `docker-compose.yml`

- [ ] **Step 1: Write docker-compose.yml**

```yaml
version: "3.8"
services:
  dynamodb:
    image: amazon/dynamodb-local:latest
    container_name: ct-survey-dynamodb
    ports:
      - "8000:8000"
    command: -jar DynamoDBLocal.jar -sharedDb -dbPath /data
    volumes:
      - ./.dynamodb-data:/data
    working_dir: /home/dynamodblocal
```

- [ ] **Step 2: Add `.dynamodb-data/` to `.gitignore`**

```bash
echo ".dynamodb-data/" >> .gitignore
```

- [ ] **Step 3: Start local DynamoDB**

Run: `docker compose up -d`
Expected: container `ct-survey-dynamodb` running on port 8000.
Verify: `curl http://localhost:8000` returns JSON error (server is up).

- [ ] **Step 4: Commit**

```bash
git add docker-compose.yml .gitignore
git commit -m "infra: add local DynamoDB via docker-compose"
```

---

### Task 4: DynamoDB table creation script

**Files:**
- Create: `scripts/create-dynamodb-tables.ts`
- Modify: `package.json` (add script)

- [ ] **Step 1: Write the table creation script**

```typescript
// scripts/create-dynamodb-tables.ts
import {
  DynamoDBClient,
  CreateTableCommand,
  UpdateTimeToLiveCommand,
  DescribeTableCommand,
  ResourceInUseException,
} from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-northeast-1",
  endpoint: process.env.DYNAMODB_ENDPOINT || undefined,
});

const PREFIX = process.env.DYNAMODB_TABLE_PREFIX || "ct-survey";

const tables = [
  {
    TableName: `${PREFIX}-users`,
    BillingMode: "PAY_PER_REQUEST" as const,
    AttributeDefinitions: [
      { AttributeName: "userId", AttributeType: "S" as const },
      { AttributeName: "email", AttributeType: "S" as const },
    ],
    KeySchema: [{ AttributeName: "userId", KeyType: "HASH" as const }],
    GlobalSecondaryIndexes: [
      {
        IndexName: "email-index",
        KeySchema: [{ AttributeName: "email", KeyType: "HASH" as const }],
        Projection: { ProjectionType: "ALL" as const },
      },
    ],
  },
  {
    TableName: `${PREFIX}-otp`,
    BillingMode: "PAY_PER_REQUEST" as const,
    AttributeDefinitions: [{ AttributeName: "email", AttributeType: "S" as const }],
    KeySchema: [{ AttributeName: "email", KeyType: "HASH" as const }],
  },
  {
    TableName: `${PREFIX}-surveys`,
    BillingMode: "PAY_PER_REQUEST" as const,
    AttributeDefinitions: [
      { AttributeName: "surveyId", AttributeType: "S" as const },
      { AttributeName: "userId", AttributeType: "S" as const },
      { AttributeName: "shortCode", AttributeType: "S" as const },
    ],
    KeySchema: [{ AttributeName: "surveyId", KeyType: "HASH" as const }],
    GlobalSecondaryIndexes: [
      {
        IndexName: "userId-index",
        KeySchema: [{ AttributeName: "userId", KeyType: "HASH" as const }],
        Projection: { ProjectionType: "ALL" as const },
      },
      {
        IndexName: "shortCode-index",
        KeySchema: [{ AttributeName: "shortCode", KeyType: "HASH" as const }],
        Projection: { ProjectionType: "ALL" as const },
      },
    ],
  },
  {
    TableName: `${PREFIX}-responses`,
    BillingMode: "PAY_PER_REQUEST" as const,
    AttributeDefinitions: [
      { AttributeName: "responseId", AttributeType: "S" as const },
      { AttributeName: "surveyId", AttributeType: "S" as const },
    ],
    KeySchema: [{ AttributeName: "responseId", KeyType: "HASH" as const }],
    GlobalSecondaryIndexes: [
      {
        IndexName: "surveyId-index",
        KeySchema: [{ AttributeName: "surveyId", KeyType: "HASH" as const }],
        Projection: { ProjectionType: "ALL" as const },
      },
    ],
  },
];

async function tableExists(name: string): Promise<boolean> {
  try {
    await client.send(new DescribeTableCommand({ TableName: name }));
    return true;
  } catch (err: any) {
    if (err.name === "ResourceNotFoundException") return false;
    throw err;
  }
}

async function main() {
  for (const t of tables) {
    if (await tableExists(t.TableName)) {
      console.log(`✓ ${t.TableName} already exists`);
      continue;
    }
    try {
      await client.send(new CreateTableCommand(t));
      console.log(`✓ created ${t.TableName}`);
    } catch (err) {
      if (err instanceof ResourceInUseException) {
        console.log(`✓ ${t.TableName} already exists`);
        continue;
      }
      throw err;
    }
  }

  // Enable TTL on otp table's expiresAt attribute
  const otpTable = `${PREFIX}-otp`;
  try {
    await client.send(
      new UpdateTimeToLiveCommand({
        TableName: otpTable,
        TimeToLiveSpecification: { Enabled: true, AttributeName: "expiresAt" },
      })
    );
    console.log(`✓ TTL enabled on ${otpTable}`);
  } catch (err: any) {
    if (err.message?.includes("TimeToLive is already enabled")) {
      console.log(`✓ TTL already enabled on ${otpTable}`);
    } else {
      throw err;
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Add npm script**

In `package.json` add:

```json
"scripts": {
  "db:setup": "tsx scripts/create-dynamodb-tables.ts"
}
```

- [ ] **Step 3: Install `tsx`**

Run: `npm install -D tsx`

- [ ] **Step 4: Run against local DynamoDB**

Run: `DYNAMODB_ENDPOINT=http://localhost:8000 npm run db:setup`
Expected output:
```
✓ created ct-survey-users
✓ created ct-survey-otp
✓ created ct-survey-surveys
✓ created ct-survey-responses
✓ TTL enabled on ct-survey-otp
```

Verify: re-run the same command — each line should now read "already exists".

- [ ] **Step 5: Commit**

```bash
git add scripts/create-dynamodb-tables.ts package.json package-lock.json
git commit -m "infra: add DynamoDB table creation script"
```

---

## Phase 2 · Data Access Layer

### Task 5: DynamoDB client

**Files:**
- Create: `src/lib/dynamodb.ts`
- Test: `src/__tests__/lib/dynamodb.test.ts`

- [ ] **Step 1: Write a small test proving the client is lazy and accepts a custom endpoint**

```typescript
// src/__tests__/lib/dynamodb.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";

describe("dynamodb client", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("exposes a tableName helper that prefixes with DYNAMODB_TABLE_PREFIX", async () => {
    vi.stubEnv("DYNAMODB_TABLE_PREFIX", "my-prefix");
    const mod = await import("@/lib/dynamodb");
    expect(mod.tableName("users")).toBe("my-prefix-users");
  });

  it("defaults prefix to ct-survey", async () => {
    vi.stubEnv("DYNAMODB_TABLE_PREFIX", "");
    const mod = await import("@/lib/dynamodb");
    expect(mod.tableName("surveys")).toBe("ct-survey-surveys");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run src/__tests__/lib/dynamodb.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the client**

```typescript
// src/lib/dynamodb.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

let client: DynamoDBDocumentClient | null = null;

export function getDocClient(): DynamoDBDocumentClient {
  if (client) return client;

  const raw = new DynamoDBClient({
    region: process.env.AWS_REGION || "ap-northeast-1",
    endpoint: process.env.DYNAMODB_ENDPOINT || undefined,
    ...(process.env.DYNAMODB_ENDPOINT
      ? {
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID || "local",
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "local",
          },
        }
      : {}),
  });

  client = DynamoDBDocumentClient.from(raw, {
    marshallOptions: { removeUndefinedValues: true },
  });
  return client;
}

export function tableName(suffix: "users" | "otp" | "surveys" | "responses"): string {
  const prefix = process.env.DYNAMODB_TABLE_PREFIX || "ct-survey";
  return `${prefix}-${suffix}`;
}
```

- [ ] **Step 4: Run test — it should pass**

Run: `npm run test:run src/__tests__/lib/dynamodb.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/dynamodb.ts src/__tests__/lib/dynamodb.test.ts
git commit -m "feat: add DynamoDB DocumentClient with table prefix helper"
```

---

### Task 6: Users repository

**Files:**
- Create: `src/lib/db/users.ts`
- Test: `src/__tests__/lib/db/users.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/__tests__/lib/db/users.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSend = vi.fn();
vi.mock("@/lib/dynamodb", () => ({
  getDocClient: () => ({ send: mockSend }),
  tableName: (s: string) => `ct-survey-${s}`,
}));

import { findUserByEmail, createUser, getUserById } from "@/lib/db/users";

describe("users repo", () => {
  beforeEach(() => {
    mockSend.mockReset();
  });

  it("findUserByEmail queries email-index GSI", async () => {
    mockSend.mockResolvedValueOnce({ Items: [{ userId: "u1", email: "a@b.com" }] });
    const user = await findUserByEmail("a@b.com");
    expect(user?.userId).toBe("u1");
    expect(mockSend).toHaveBeenCalledOnce();
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.input.TableName).toBe("ct-survey-users");
    expect(cmd.input.IndexName).toBe("email-index");
    expect(cmd.input.KeyConditionExpression).toContain("email");
  });

  it("findUserByEmail returns null when no match", async () => {
    mockSend.mockResolvedValueOnce({ Items: [] });
    expect(await findUserByEmail("nobody@x.com")).toBeNull();
  });

  it("createUser inserts a new user with generated userId", async () => {
    mockSend.mockResolvedValueOnce({});
    const user = await createUser("new@x.com");
    expect(user.userId).toMatch(/.+/);
    expect(user.email).toBe("new@x.com");
    expect(user.createdAt).toBeDefined();
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.input.TableName).toBe("ct-survey-users");
    expect(cmd.input.Item.email).toBe("new@x.com");
  });

  it("getUserById returns null when not found", async () => {
    mockSend.mockResolvedValueOnce({ Item: undefined });
    expect(await getUserById("missing")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test — FAIL (module missing)**

Run: `npm run test:run src/__tests__/lib/db/users.test.ts`

- [ ] **Step 3: Implement**

```typescript
// src/lib/db/users.ts
import { GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { getDocClient, tableName } from "@/lib/dynamodb";

export interface UserRecord {
  userId: string;
  email: string;
  createdAt: string;
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const res = await getDocClient().send(
    new QueryCommand({
      TableName: tableName("users"),
      IndexName: "email-index",
      KeyConditionExpression: "email = :e",
      ExpressionAttributeValues: { ":e": email },
      Limit: 1,
    })
  );
  const item = res.Items?.[0];
  return item ? (item as UserRecord) : null;
}

export async function getUserById(userId: string): Promise<UserRecord | null> {
  const res = await getDocClient().send(
    new GetCommand({
      TableName: tableName("users"),
      Key: { userId },
    })
  );
  return (res.Item as UserRecord) ?? null;
}

export async function createUser(email: string): Promise<UserRecord> {
  const user: UserRecord = {
    userId: randomUUID(),
    email,
    createdAt: new Date().toISOString(),
  };
  await getDocClient().send(
    new PutCommand({ TableName: tableName("users"), Item: user })
  );
  return user;
}
```

- [ ] **Step 4: Run test — PASS**

Run: `npm run test:run src/__tests__/lib/db/users.test.ts`

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/users.ts src/__tests__/lib/db/users.test.ts
git commit -m "feat: add users repository backed by DynamoDB"
```

---

### Task 7: OTP repository

**Files:**
- Create: `src/lib/db/otp.ts`
- Test: `src/__tests__/lib/db/otp.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/__tests__/lib/db/otp.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSend = vi.fn();
vi.mock("@/lib/dynamodb", () => ({
  getDocClient: () => ({ send: mockSend }),
  tableName: (s: string) => `ct-survey-${s}`,
}));

import { putOtp, getOtp, deleteOtp } from "@/lib/db/otp";

describe("otp repo", () => {
  beforeEach(() => {
    mockSend.mockReset();
  });

  it("putOtp stores email, otpHash, expiresAt", async () => {
    mockSend.mockResolvedValueOnce({});
    await putOtp({ email: "a@b.com", otpHash: "$2b$...", expiresAt: 1234567890 });
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.input.TableName).toBe("ct-survey-otp");
    expect(cmd.input.Item.email).toBe("a@b.com");
    expect(cmd.input.Item.expiresAt).toBe(1234567890);
  });

  it("getOtp returns null when not present", async () => {
    mockSend.mockResolvedValueOnce({ Item: undefined });
    expect(await getOtp("nobody@x.com")).toBeNull();
  });

  it("deleteOtp issues a DeleteCommand", async () => {
    mockSend.mockResolvedValueOnce({});
    await deleteOtp("a@b.com");
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.input.Key.email).toBe("a@b.com");
  });
});
```

- [ ] **Step 2: Run test — FAIL**

- [ ] **Step 3: Implement**

```typescript
// src/lib/db/otp.ts
import { GetCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { getDocClient, tableName } from "@/lib/dynamodb";

export interface OtpRecord {
  email: string;
  otpHash: string;
  expiresAt: number; // Unix seconds, used by DynamoDB TTL
}

export async function putOtp(rec: OtpRecord): Promise<void> {
  await getDocClient().send(
    new PutCommand({ TableName: tableName("otp"), Item: rec })
  );
}

export async function getOtp(email: string): Promise<OtpRecord | null> {
  const res = await getDocClient().send(
    new GetCommand({ TableName: tableName("otp"), Key: { email } })
  );
  return (res.Item as OtpRecord) ?? null;
}

export async function deleteOtp(email: string): Promise<void> {
  await getDocClient().send(
    new DeleteCommand({ TableName: tableName("otp"), Key: { email } })
  );
}
```

- [ ] **Step 4: Run test — PASS**

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/otp.ts src/__tests__/lib/db/otp.test.ts
git commit -m "feat: add OTP repository with TTL-backed storage"
```

---

### Task 8: Surveys repository

**Files:**
- Create: `src/lib/db/surveys.ts`
- Test: `src/__tests__/lib/db/surveys.test.ts`

**Schema mapping (old → new):** `id` → `surveyId`, `creator_code` → removed, `creator_name` → removed, `short_code` → `shortCode`, `created_at` → `createdAt`, `updated_at` → `updatedAt`. `userId` is new.

- [ ] **Step 1: Write the failing tests**

```typescript
// src/__tests__/lib/db/surveys.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSend = vi.fn();
vi.mock("@/lib/dynamodb", () => ({
  getDocClient: () => ({ send: mockSend }),
  tableName: (s: string) => `ct-survey-${s}`,
}));

import {
  createSurvey,
  getSurveyById,
  getSurveyByShortCode,
  updateSurvey,
  listSurveysByUserId,
} from "@/lib/db/surveys";

describe("surveys repo", () => {
  beforeEach(() => mockSend.mockReset());

  it("createSurvey assigns surveyId, timestamps, and stores on the surveys table", async () => {
    mockSend.mockResolvedValueOnce({});
    const s = await createSurvey({
      userId: "u1",
      shortCode: "AB12",
      title: "T",
      description: null,
      questions: [],
      settings: {},
      status: "draft",
    });
    expect(s.surveyId).toMatch(/.+/);
    expect(s.createdAt).toBeDefined();
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.input.TableName).toBe("ct-survey-surveys");
    expect(cmd.input.Item.userId).toBe("u1");
  });

  it("getSurveyById returns null when missing", async () => {
    mockSend.mockResolvedValueOnce({ Item: undefined });
    expect(await getSurveyById("x")).toBeNull();
  });

  it("getSurveyByShortCode uses shortCode-index GSI", async () => {
    mockSend.mockResolvedValueOnce({
      Items: [{ surveyId: "s1", shortCode: "AB12", userId: "u1" }],
    });
    const s = await getSurveyByShortCode("AB12");
    expect(s?.surveyId).toBe("s1");
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.input.IndexName).toBe("shortCode-index");
  });

  it("listSurveysByUserId uses userId-index GSI", async () => {
    mockSend.mockResolvedValueOnce({
      Items: [{ surveyId: "s1", userId: "u1" }, { surveyId: "s2", userId: "u1" }],
    });
    const list = await listSurveysByUserId("u1");
    expect(list).toHaveLength(2);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.input.IndexName).toBe("userId-index");
  });

  it("updateSurvey builds a partial UpdateCommand and bumps updatedAt", async () => {
    mockSend.mockResolvedValueOnce({
      Attributes: { surveyId: "s1", title: "new", updatedAt: "2026-04-20T00:00:00Z" },
    });
    const res = await updateSurvey("s1", { title: "new" });
    expect(res?.title).toBe("new");
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.input.UpdateExpression).toContain("title");
    expect(cmd.input.UpdateExpression).toContain("updatedAt");
  });
});
```

- [ ] **Step 2: Run test — FAIL**

- [ ] **Step 3: Implement**

```typescript
// src/lib/db/surveys.ts
import {
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { getDocClient, tableName } from "@/lib/dynamodb";
import type { Question, SurveySettings, SurveyStatus } from "@/types/database";

export interface SurveyRecord {
  surveyId: string;
  userId: string;
  shortCode: string;
  title: string;
  description: string | null;
  questions: Question[];
  settings: SurveySettings;
  status: SurveyStatus;
  createdAt: string;
  updatedAt: string;
}

export type CreateSurveyInput = Omit<SurveyRecord, "surveyId" | "createdAt" | "updatedAt">;

export async function createSurvey(input: CreateSurveyInput): Promise<SurveyRecord> {
  const now = new Date().toISOString();
  const rec: SurveyRecord = {
    ...input,
    surveyId: randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  await getDocClient().send(
    new PutCommand({ TableName: tableName("surveys"), Item: rec })
  );
  return rec;
}

export async function getSurveyById(surveyId: string): Promise<SurveyRecord | null> {
  const res = await getDocClient().send(
    new GetCommand({ TableName: tableName("surveys"), Key: { surveyId } })
  );
  return (res.Item as SurveyRecord) ?? null;
}

export async function getSurveyByShortCode(shortCode: string): Promise<SurveyRecord | null> {
  const res = await getDocClient().send(
    new QueryCommand({
      TableName: tableName("surveys"),
      IndexName: "shortCode-index",
      KeyConditionExpression: "shortCode = :c",
      ExpressionAttributeValues: { ":c": shortCode.toUpperCase() },
      Limit: 1,
    })
  );
  return (res.Items?.[0] as SurveyRecord) ?? null;
}

export async function listSurveysByUserId(userId: string): Promise<SurveyRecord[]> {
  const res = await getDocClient().send(
    new QueryCommand({
      TableName: tableName("surveys"),
      IndexName: "userId-index",
      KeyConditionExpression: "userId = :u",
      ExpressionAttributeValues: { ":u": userId },
    })
  );
  return (res.Items ?? []) as SurveyRecord[];
}

const UPDATABLE: (keyof SurveyRecord)[] = [
  "title",
  "description",
  "questions",
  "settings",
  "status",
];

export async function updateSurvey(
  surveyId: string,
  patch: Partial<SurveyRecord>
): Promise<SurveyRecord | null> {
  const names: Record<string, string> = { "#updatedAt": "updatedAt" };
  const values: Record<string, unknown> = { ":updatedAt": new Date().toISOString() };
  const sets: string[] = ["#updatedAt = :updatedAt"];

  for (const key of UPDATABLE) {
    if (patch[key] === undefined) continue;
    names[`#${key}`] = key;
    values[`:${key}`] = patch[key];
    sets.push(`#${key} = :${key}`);
  }

  const res = await getDocClient().send(
    new UpdateCommand({
      TableName: tableName("surveys"),
      Key: { surveyId },
      UpdateExpression: `SET ${sets.join(", ")}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: "ALL_NEW",
    })
  );
  return (res.Attributes as SurveyRecord) ?? null;
}
```

- [ ] **Step 4: Run test — PASS**

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/surveys.ts src/__tests__/lib/db/surveys.test.ts
git commit -m "feat: add surveys repository backed by DynamoDB"
```

---

### Task 9: Responses repository

**Files:**
- Create: `src/lib/db/responses.ts`
- Test: `src/__tests__/lib/db/responses.test.ts`

**Schema mapping:** `id` → `responseId`, `survey_id` → `surveyId`, `respondent_id` → `respondentId`, `started_at` → `startedAt`, `completed_at` → `completedAt`, `current_question_index` → `currentQuestionIndex`.

- [ ] **Step 1: Write the failing tests**

```typescript
// src/__tests__/lib/db/responses.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSend = vi.fn();
vi.mock("@/lib/dynamodb", () => ({
  getDocClient: () => ({ send: mockSend }),
  tableName: (s: string) => `ct-survey-${s}`,
}));

import {
  createResponse,
  getResponseById,
  listResponsesBySurveyId,
  updateResponse,
} from "@/lib/db/responses";

describe("responses repo", () => {
  beforeEach(() => mockSend.mockReset());

  it("createResponse assigns responseId and startedAt", async () => {
    mockSend.mockResolvedValueOnce({});
    const r = await createResponse({
      surveyId: "s1",
      respondentId: "rid",
      answers: {},
      status: "in_progress",
      currentQuestionIndex: 0,
    });
    expect(r.responseId).toMatch(/.+/);
    expect(r.startedAt).toBeDefined();
  });

  it("listResponsesBySurveyId uses surveyId-index GSI", async () => {
    mockSend.mockResolvedValueOnce({ Items: [{ responseId: "r1" }] });
    const rs = await listResponsesBySurveyId("s1");
    expect(rs).toHaveLength(1);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.input.IndexName).toBe("surveyId-index");
  });

  it("updateResponse builds SET expression for provided fields", async () => {
    mockSend.mockResolvedValueOnce({
      Attributes: { responseId: "r1", status: "completed" },
    });
    const r = await updateResponse("r1", { status: "completed", completedAt: "x" });
    expect(r?.status).toBe("completed");
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.input.UpdateExpression).toContain("status");
    expect(cmd.input.UpdateExpression).toContain("completedAt");
  });
});
```

- [ ] **Step 2: Run test — FAIL**

- [ ] **Step 3: Implement**

```typescript
// src/lib/db/responses.ts
import {
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { getDocClient, tableName } from "@/lib/dynamodb";
import type { ResponseStatus } from "@/types/database";

export interface ResponseRecord {
  responseId: string;
  surveyId: string;
  respondentId: string | null;
  answers: Record<string, unknown>;
  status: ResponseStatus;
  currentQuestionIndex: number;
  startedAt: string;
  completedAt?: string | null;
}

export type CreateResponseInput = Omit<ResponseRecord, "responseId" | "startedAt">;

export async function createResponse(input: CreateResponseInput): Promise<ResponseRecord> {
  const rec: ResponseRecord = {
    ...input,
    responseId: randomUUID(),
    startedAt: new Date().toISOString(),
  };
  await getDocClient().send(
    new PutCommand({ TableName: tableName("responses"), Item: rec })
  );
  return rec;
}

export async function getResponseById(responseId: string): Promise<ResponseRecord | null> {
  const res = await getDocClient().send(
    new GetCommand({ TableName: tableName("responses"), Key: { responseId } })
  );
  return (res.Item as ResponseRecord) ?? null;
}

export async function listResponsesBySurveyId(
  surveyId: string
): Promise<ResponseRecord[]> {
  const res = await getDocClient().send(
    new QueryCommand({
      TableName: tableName("responses"),
      IndexName: "surveyId-index",
      KeyConditionExpression: "surveyId = :s",
      ExpressionAttributeValues: { ":s": surveyId },
    })
  );
  return (res.Items ?? []) as ResponseRecord[];
}

const UPDATABLE: (keyof ResponseRecord)[] = [
  "answers",
  "status",
  "currentQuestionIndex",
  "completedAt",
];

export async function updateResponse(
  responseId: string,
  patch: Partial<ResponseRecord>
): Promise<ResponseRecord | null> {
  const names: Record<string, string> = {};
  const values: Record<string, unknown> = {};
  const sets: string[] = [];

  for (const key of UPDATABLE) {
    if (patch[key] === undefined) continue;
    names[`#${key}`] = key;
    values[`:${key}`] = patch[key];
    sets.push(`#${key} = :${key}`);
  }
  if (sets.length === 0) return getResponseById(responseId);

  const res = await getDocClient().send(
    new UpdateCommand({
      TableName: tableName("responses"),
      Key: { responseId },
      UpdateExpression: `SET ${sets.join(", ")}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: "ALL_NEW",
    })
  );
  return (res.Attributes as ResponseRecord) ?? null;
}
```

- [ ] **Step 4: Run test — PASS**

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/responses.ts src/__tests__/lib/db/responses.test.ts
git commit -m "feat: add responses repository backed by DynamoDB"
```

---

### Task 10: Rewrite `identifiers.ts` shortCode uniqueness

**Files:**
- Modify: `src/lib/identifiers.ts`
- Modify: `src/__tests__/lib/identifiers.test.ts`

The current `generateUniqueShortCode(db)` takes a Supabase client. We'll replace it with a version that calls `getSurveyByShortCode`. We also **drop `generateUniqueCreatorName`** entirely (spec removes `creator_name`).

- [ ] **Step 1: Update test imports and expectations**

Read the existing `src/__tests__/lib/identifiers.test.ts` and adjust so `generateUniqueShortCode` takes no arguments and mocks `@/lib/db/surveys`:

```typescript
// at top of file, replace existing mock
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetByShortCode = vi.fn();
vi.mock("@/lib/db/surveys", () => ({
  getSurveyByShortCode: mockGetByShortCode,
}));

import { generateUniqueShortCode, isUUID, isShortCode } from "@/lib/identifiers";

describe("generateUniqueShortCode", () => {
  beforeEach(() => mockGetByShortCode.mockReset());

  it("returns a 4-char code when no collision", async () => {
    mockGetByShortCode.mockResolvedValue(null);
    const code = await generateUniqueShortCode();
    expect(code).toMatch(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/);
  });

  it("retries on collision", async () => {
    mockGetByShortCode
      .mockResolvedValueOnce({ surveyId: "s" })
      .mockResolvedValueOnce(null);
    const code = await generateUniqueShortCode();
    expect(code).toMatch(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/);
    expect(mockGetByShortCode).toHaveBeenCalledTimes(2);
  });
});

// keep existing isUUID / isShortCode tests unchanged
```

- [ ] **Step 2: Rewrite identifiers.ts**

Replace `generateUniqueShortCode` and remove `generateUniqueCreatorName`, `CHINESE_PET_NAMES`, `ENGLISH_PET_NAMES`, `getRandomPetName`:

```typescript
// src/lib/identifiers.ts
import { getSurveyByShortCode } from "@/lib/db/surveys";

const SHORT_CODE_CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

function generateShortCode(length: number): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += SHORT_CODE_CHARS[Math.floor(Math.random() * SHORT_CODE_CHARS.length)];
  }
  return code;
}

export async function generateUniqueShortCode(): Promise<string> {
  const maxLength = 8;
  const maxRetries = 10;

  for (let length = 4; length <= maxLength; length++) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const code = generateShortCode(length);
      const existing = await getSurveyByShortCode(code);
      if (!existing) return code;
    }
  }
  throw new Error("Unable to generate unique short code");
}

export function isUUID(str: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

export function isShortCode(str: string): boolean {
  const shortCodeRegex = /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4,8}$/i;
  return shortCodeRegex.test(str);
}
```

- [ ] **Step 3: Run test — PASS**

Run: `npm run test:run src/__tests__/lib/identifiers.test.ts`

- [ ] **Step 4: Commit**

```bash
git add src/lib/identifiers.ts src/__tests__/lib/identifiers.test.ts
git commit -m "refactor: rewrite shortCode uniqueness check against DynamoDB"
```

---

### Task 11: Replace `types/database.ts`

**Files:**
- Modify: `src/types/database.ts`

- [ ] **Step 1: Replace with DynamoDB-shaped types**

```typescript
// src/types/database.ts
export type QuestionType =
  | "text"
  | "multiple_choice"
  | "multi_select"
  | "dropdown"
  | "rating"
  | "slider"
  | "yes_no"
  | "date"
  | "number"
  | "email"
  | "phone";

export interface QuestionValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  required: boolean;
  options?: string[];
  validation?: QuestionValidation;
}

export interface SurveySettings {
  allowAnonymous?: boolean;
  showProgress?: boolean;
  language?: string;
}

export type SurveyStatus = "draft" | "active" | "closed";
export type ResponseStatus = "in_progress" | "partial" | "completed";

// DynamoDB record shapes are exported from src/lib/db/{surveys,responses,users}.
// This file keeps only the shared domain types used by UI + AI prompts.
```

- [ ] **Step 2: Build — confirm everything importing the old `Survey`/`Response`/`Database` types is still listed in the following API/UI tasks**

Run: `npm run build`
Expected: many TS errors referencing `Survey`, `Response`, `Database`. Keep a mental list — all are addressed in Phase 4+ tasks.

- [ ] **Step 3: Commit**

```bash
git add src/types/database.ts
git commit -m "refactor: slim types/database.ts to shared domain types only"
```

---

## Phase 3 · Auth Module

### Task 12: OTP generation and hashing

**Files:**
- Create: `src/lib/auth/otp.ts`
- Test: `src/__tests__/lib/auth/otp.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/__tests__/lib/auth/otp.test.ts
import { describe, it, expect } from "vitest";
import { generateOtp, hashOtp, verifyOtp } from "@/lib/auth/otp";

describe("otp", () => {
  it("generateOtp returns a 6-digit numeric string", () => {
    const code = generateOtp();
    expect(code).toMatch(/^\d{6}$/);
  });

  it("hashOtp + verifyOtp round-trip works", async () => {
    const code = "123456";
    const hash = await hashOtp(code);
    expect(hash).not.toBe(code);
    expect(await verifyOtp(code, hash)).toBe(true);
    expect(await verifyOtp("000000", hash)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test — FAIL**

- [ ] **Step 3: Implement**

```typescript
// src/lib/auth/otp.ts
import bcrypt from "bcryptjs";
import { randomInt } from "crypto";

const OTP_TTL_SECONDS = 10 * 60; // 10 minutes

export function generateOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export async function hashOtp(code: string): Promise<string> {
  return bcrypt.hash(code, 10);
}

export async function verifyOtp(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash);
}

export function otpExpiresAtUnix(): number {
  return Math.floor(Date.now() / 1000) + OTP_TTL_SECONDS;
}
```

- [ ] **Step 4: Run test — PASS**

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth/otp.ts src/__tests__/lib/auth/otp.test.ts
git commit -m "feat: add OTP generation and bcrypt hashing"
```

---

### Task 13: JWT sign/verify

**Files:**
- Create: `src/lib/auth/jwt.ts`
- Test: `src/__tests__/lib/auth/jwt.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/__tests__/lib/auth/jwt.test.ts
import { describe, it, expect, beforeAll } from "vitest";

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret-that-is-long-enough-32chars";
});

import { signSessionToken, verifySessionToken } from "@/lib/auth/jwt";

describe("jwt", () => {
  it("signs and verifies a valid token", () => {
    const token = signSessionToken({ userId: "u1", email: "a@b.com" });
    const payload = verifySessionToken(token);
    expect(payload?.userId).toBe("u1");
    expect(payload?.email).toBe("a@b.com");
  });

  it("returns null for tampered token", () => {
    const token = signSessionToken({ userId: "u1", email: "a@b.com" });
    expect(verifySessionToken(token + "x")).toBeNull();
  });

  it("returns null for token signed with wrong secret", () => {
    const token = signSessionToken({ userId: "u1", email: "a@b.com" });
    process.env.JWT_SECRET = "different-secret";
    expect(verifySessionToken(token)).toBeNull();
    process.env.JWT_SECRET = "test-secret-that-is-long-enough-32chars";
  });
});
```

- [ ] **Step 2: Run test — FAIL**

- [ ] **Step 3: Implement**

```typescript
// src/lib/auth/jwt.ts
import jwt from "jsonwebtoken";

export interface SessionPayload {
  userId: string;
  email: string;
}

const SESSION_TTL = "7d";

function getSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET not set");
  return s;
}

export function signSessionToken(payload: SessionPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: SESSION_TTL });
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const decoded = jwt.verify(token, getSecret()) as jwt.JwtPayload;
    if (typeof decoded === "object" && decoded.userId && decoded.email) {
      return { userId: decoded.userId, email: decoded.email };
    }
    return null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run test — PASS**

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth/jwt.ts src/__tests__/lib/auth/jwt.test.ts
git commit -m "feat: add JWT session signing and verification"
```

---

### Task 14: SES email sender

**Files:**
- Create: `src/lib/auth/ses.ts`
- Test: `src/__tests__/lib/auth/ses.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/__tests__/lib/auth/ses.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSend = vi.fn();
vi.mock("@aws-sdk/client-ses", () => ({
  SESClient: vi.fn(() => ({ send: mockSend })),
  SendEmailCommand: vi.fn((input) => ({ input })),
}));

beforeEach(() => {
  process.env.AWS_SES_FROM_EMAIL = "noreply@mysurvey.jakobhe.com";
  mockSend.mockReset();
  mockSend.mockResolvedValue({ MessageId: "abc" });
});

import { sendOtpEmail } from "@/lib/auth/ses";

describe("ses", () => {
  it("sends an OTP email to the given address", async () => {
    await sendOtpEmail("user@example.com", "123456");
    expect(mockSend).toHaveBeenCalledOnce();
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.input.Destination.ToAddresses).toEqual(["user@example.com"]);
    expect(cmd.input.Source).toBe("noreply@mysurvey.jakobhe.com");
    expect(cmd.input.Message.Body.Html.Data).toContain("123456");
    expect(cmd.input.Message.Subject.Data).toContain("畅谈问卷");
  });
});
```

- [ ] **Step 2: Run test — FAIL**

- [ ] **Step 3: Implement**

```typescript
// src/lib/auth/ses.ts
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

let client: SESClient | null = null;

function getClient(): SESClient {
  if (client) return client;
  client = new SESClient({
    region: process.env.AWS_REGION || "ap-northeast-1",
  });
  return client;
}

function buildHtmlBody(code: string): string {
  return `
<!doctype html>
<html>
  <body style="font-family: -apple-system, Segoe UI, sans-serif; padding: 32px; background: #f7f7f7;">
    <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px;">
      <h1 style="margin: 0 0 8px; font-size: 22px;">畅谈问卷</h1>
      <p style="margin: 0 0 24px; color: #666;">我和AI共创一切</p>
      <p>你的登录验证码是：</p>
      <div style="font-size: 32px; font-weight: 700; letter-spacing: 6px; padding: 16px; background: #f0f0f0; border-radius: 8px; text-align: center; margin: 16px 0;">${code}</div>
      <p style="color: #666; font-size: 14px;">验证码 10 分钟内有效，请勿转发给他人。</p>
    </div>
  </body>
</html>`;
}

export async function sendOtpEmail(toEmail: string, code: string): Promise<void> {
  const from = process.env.AWS_SES_FROM_EMAIL;
  if (!from) throw new Error("AWS_SES_FROM_EMAIL not set");

  await getClient().send(
    new SendEmailCommand({
      Source: from,
      Destination: { ToAddresses: [toEmail] },
      Message: {
        Subject: { Data: "畅谈问卷 登录验证码", Charset: "UTF-8" },
        Body: {
          Html: { Data: buildHtmlBody(code), Charset: "UTF-8" },
          Text: { Data: `你的登录验证码是 ${code}，10 分钟内有效。`, Charset: "UTF-8" },
        },
      },
    })
  );
}
```

- [ ] **Step 4: Run test — PASS**

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth/ses.ts src/__tests__/lib/auth/ses.test.ts
git commit -m "feat: add SES OTP email sender"
```

---

### Task 15: Session cookie helpers

**Files:**
- Create: `src/lib/auth/session.ts`

- [ ] **Step 1: Implement**

```typescript
// src/lib/auth/session.ts
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { signSessionToken, verifySessionToken, type SessionPayload } from "./jwt";

export const SESSION_COOKIE = "ct_survey_session";
const SEVEN_DAYS = 7 * 24 * 60 * 60;

export async function setSessionCookie(payload: SessionPayload): Promise<void> {
  const token = signSessionToken(payload);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SEVEN_DAYS,
    path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

// For Route Handlers: read session from cookies()
export async function getCurrentUser(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

// For middleware: read session from the incoming request
export function getCurrentUserFromRequest(req: NextRequest): SessionPayload | null {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/auth/session.ts
git commit -m "feat: add session cookie + getCurrentUser helpers"
```

---

### Task 16: Next.js middleware

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: Implement**

```typescript
// src/middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth/session";

const PROTECTED_PAGES = ["/dashboard", "/create"];
const PROTECTED_API_PREFIXES = ["/api/surveys"];

// Paths under /api that do NOT require auth even if they start with a protected prefix
// (None for now. Exception: GET /api/surveys/[id] — handled inside the route itself because
// the take-survey page must load the survey without auth.)
const PUBLIC_API_EXACT: RegExp[] = [
  /^\/api\/surveys\/[^/]+$/, // GET survey by id/shortCode — public for taking surveys
  /^\/api\/surveys\/[^/]+\/responses$/, // public? NO — see below
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const user = getCurrentUserFromRequest(req);

  // Protected pages: redirect to /login
  if (PROTECTED_PAGES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    if (!user) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Protected APIs: return 401 JSON
  if (PROTECTED_API_PREFIXES.some((p) => pathname.startsWith(p))) {
    // GET /api/surveys/[id] is public (survey takers load by shortCode)
    const isPublicApi = PUBLIC_API_EXACT.some((re) => re.test(pathname));
    const isGet = req.method === "GET";

    // Allow only GET on exact-match public survey paths
    if (!(isGet && isPublicApi) && !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Attach userId header for downstream route handlers
    if (user) {
      const res = NextResponse.next();
      res.headers.set("x-user-id", user.userId);
      res.headers.set("x-user-email", user.email);
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/create/:path*", "/api/surveys/:path*"],
};
```

- [ ] **Step 2: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: add Next.js middleware for JWT-gated routes"
```

---

## Phase 4 · Auth API Routes

### Task 17: `POST /api/auth/request-otp`

**Files:**
- Create: `src/app/api/auth/request-otp/route.ts`
- Test: `src/__tests__/api/auth/request-otp.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/__tests__/api/auth/request-otp.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPutOtp = vi.fn();
const mockSendOtp = vi.fn();

vi.mock("@/lib/db/otp", () => ({ putOtp: mockPutOtp }));
vi.mock("@/lib/auth/ses", () => ({ sendOtpEmail: mockSendOtp }));

import { POST } from "@/app/api/auth/request-otp/route";
import { NextRequest } from "next/server";

function req(body: unknown) {
  return new NextRequest("http://localhost/api/auth/request-otp", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/request-otp", () => {
  beforeEach(() => {
    mockPutOtp.mockReset();
    mockSendOtp.mockReset();
    mockPutOtp.mockResolvedValue(undefined);
    mockSendOtp.mockResolvedValue(undefined);
  });

  it("stores bcrypt hash and sends email for a valid email", async () => {
    const res = await POST(req({ email: "user@example.com" }));
    expect(res.status).toBe(200);
    expect(mockPutOtp).toHaveBeenCalledOnce();
    expect(mockSendOtp).toHaveBeenCalledWith(
      "user@example.com",
      expect.stringMatching(/^\d{6}$/)
    );
  });

  it("returns 400 for invalid email format", async () => {
    const res = await POST(req({ email: "not-an-email" }));
    expect(res.status).toBe(400);
    expect(mockSendOtp).not.toHaveBeenCalled();
  });

  it("normalizes email to lowercase before storage", async () => {
    await POST(req({ email: "User@Example.COM" }));
    expect(mockPutOtp.mock.calls[0][0].email).toBe("user@example.com");
  });
});
```

- [ ] **Step 2: Run test — FAIL**

- [ ] **Step 3: Implement**

```typescript
// src/app/api/auth/request-otp/route.ts
import { NextRequest, NextResponse } from "next/server";
import { putOtp } from "@/lib/db/otp";
import { generateOtp, hashOtp, otpExpiresAtUnix } from "@/lib/auth/otp";
import { sendOtpEmail } from "@/lib/auth/ses";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const { email: rawEmail } = await request.json();
    if (typeof rawEmail !== "string" || !EMAIL_RE.test(rawEmail)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    const email = rawEmail.trim().toLowerCase();

    const code = generateOtp();
    const otpHash = await hashOtp(code);
    await putOtp({ email, otpHash, expiresAt: otpExpiresAtUnix() });
    await sendOtpEmail(email, code);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("request-otp error:", err);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
```

- [ ] **Step 4: Run test — PASS**

- [ ] **Step 5: Commit**

```bash
git add src/app/api/auth/request-otp/route.ts src/__tests__/api/auth/request-otp.test.ts
git commit -m "feat: add POST /api/auth/request-otp"
```

---

### Task 18: `POST /api/auth/verify-otp`

**Files:**
- Create: `src/app/api/auth/verify-otp/route.ts`
- Test: `src/__tests__/api/auth/verify-otp.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/__tests__/api/auth/verify-otp.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetOtp = vi.fn();
const mockDeleteOtp = vi.fn();
const mockFindUser = vi.fn();
const mockCreateUser = vi.fn();
const mockSetSession = vi.fn();
const mockVerifyOtp = vi.fn();

vi.mock("@/lib/db/otp", () => ({ getOtp: mockGetOtp, deleteOtp: mockDeleteOtp }));
vi.mock("@/lib/db/users", () => ({
  findUserByEmail: mockFindUser,
  createUser: mockCreateUser,
}));
vi.mock("@/lib/auth/session", () => ({ setSessionCookie: mockSetSession }));
vi.mock("@/lib/auth/otp", async (orig) => {
  const mod: any = await orig();
  return { ...mod, verifyOtp: mockVerifyOtp };
});

import { POST } from "@/app/api/auth/verify-otp/route";
import { NextRequest } from "next/server";

function req(body: unknown) {
  return new NextRequest("http://localhost/api/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/verify-otp", () => {
  const NOW = Math.floor(Date.now() / 1000);

  beforeEach(() => {
    [mockGetOtp, mockDeleteOtp, mockFindUser, mockCreateUser, mockSetSession, mockVerifyOtp].forEach((m) => m.mockReset());
  });

  it("returns 400 when no OTP record", async () => {
    mockGetOtp.mockResolvedValue(null);
    const res = await POST(req({ email: "a@b.com", code: "123456" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when OTP expired", async () => {
    mockGetOtp.mockResolvedValue({ email: "a@b.com", otpHash: "x", expiresAt: NOW - 10 });
    const res = await POST(req({ email: "a@b.com", code: "123456" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when hash mismatch", async () => {
    mockGetOtp.mockResolvedValue({ email: "a@b.com", otpHash: "x", expiresAt: NOW + 500 });
    mockVerifyOtp.mockResolvedValue(false);
    const res = await POST(req({ email: "a@b.com", code: "000000" }));
    expect(res.status).toBe(400);
  });

  it("creates a user on first login, deletes OTP, sets cookie", async () => {
    mockGetOtp.mockResolvedValue({ email: "a@b.com", otpHash: "x", expiresAt: NOW + 500 });
    mockVerifyOtp.mockResolvedValue(true);
    mockFindUser.mockResolvedValue(null);
    mockCreateUser.mockResolvedValue({ userId: "u1", email: "a@b.com", createdAt: "t" });

    const res = await POST(req({ email: "a@b.com", code: "123456" }));
    expect(res.status).toBe(200);
    expect(mockCreateUser).toHaveBeenCalledWith("a@b.com");
    expect(mockDeleteOtp).toHaveBeenCalledWith("a@b.com");
    expect(mockSetSession).toHaveBeenCalledWith({ userId: "u1", email: "a@b.com" });
  });

  it("re-uses existing user on subsequent login", async () => {
    mockGetOtp.mockResolvedValue({ email: "a@b.com", otpHash: "x", expiresAt: NOW + 500 });
    mockVerifyOtp.mockResolvedValue(true);
    mockFindUser.mockResolvedValue({ userId: "u1", email: "a@b.com", createdAt: "t" });

    const res = await POST(req({ email: "a@b.com", code: "123456" }));
    expect(res.status).toBe(200);
    expect(mockCreateUser).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test — FAIL**

- [ ] **Step 3: Implement**

```typescript
// src/app/api/auth/verify-otp/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getOtp, deleteOtp } from "@/lib/db/otp";
import { findUserByEmail, createUser } from "@/lib/db/users";
import { verifyOtp } from "@/lib/auth/otp";
import { setSessionCookie } from "@/lib/auth/session";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_RE = /^\d{6}$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawEmail = body?.email;
    const code = body?.code;

    if (typeof rawEmail !== "string" || !EMAIL_RE.test(rawEmail)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    if (typeof code !== "string" || !CODE_RE.test(code)) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }
    const email = rawEmail.trim().toLowerCase();

    const record = await getOtp(email);
    if (!record) {
      return NextResponse.json({ error: "No OTP requested" }, { status: 400 });
    }

    const nowSec = Math.floor(Date.now() / 1000);
    if (record.expiresAt < nowSec) {
      await deleteOtp(email);
      return NextResponse.json({ error: "OTP expired" }, { status: 400 });
    }

    const ok = await verifyOtp(code, record.otpHash);
    if (!ok) {
      return NextResponse.json({ error: "Incorrect code" }, { status: 400 });
    }

    // Delete OTP (prevent replay)
    await deleteOtp(email);

    // Find or create user
    let user = await findUserByEmail(email);
    if (!user) user = await createUser(email);

    await setSessionCookie({ userId: user.userId, email: user.email });

    return NextResponse.json({ success: true, userId: user.userId, email: user.email });
  } catch (err) {
    console.error("verify-otp error:", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
```

- [ ] **Step 4: Run test — PASS**

- [ ] **Step 5: Commit**

```bash
git add src/app/api/auth/verify-otp/route.ts src/__tests__/api/auth/verify-otp.test.ts
git commit -m "feat: add POST /api/auth/verify-otp"
```

---

### Task 19: `/api/auth/logout` and `/api/auth/me`

**Files:**
- Create: `src/app/api/auth/logout/route.ts`
- Create: `src/app/api/auth/me/route.ts`

- [ ] **Step 1: Implement logout**

```typescript
// src/app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/session";

export async function POST() {
  await clearSessionCookie();
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Implement me**

```typescript
// src/app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null }, { status: 200 });
  return NextResponse.json({ user });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/auth/logout/route.ts src/app/api/auth/me/route.ts
git commit -m "feat: add logout and me auth endpoints"
```

---

## Phase 5 · Login Page

### Task 20: `/login` page

**Files:**
- Create: `src/app/login/page.tsx`

- [ ] **Step 1: Implement the two-step form**

```tsx
// src/app/login/page.tsx
"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";

  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "发送失败");
      setStep("otp");
    } catch (err: any) {
      setError(err.message || "发送失败");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "验证失败");
      router.push(next);
    } catch (err: any) {
      setError(err.message || "验证失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">畅谈问卷</h1>
          <p className="text-gray-600">我和AI共创一切</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          {step === "email" ? (
            <form onSubmit={requestOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  邮箱地址
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "发送中…" : "发送验证码"}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="space-y-4">
              <p className="text-sm text-gray-600">
                验证码已发送至 <b>{email}</b>
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  6位验证码
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest"
                />
              </div>
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "验证中…" : "登录"}
              </button>
              <button
                type="button"
                onClick={() => setStep("email")}
                className="w-full py-3 text-gray-600 hover:text-gray-900"
              >
                ← 修改邮箱
              </button>
            </form>
          )}

          {error && (
            <p className="mt-4 text-red-500 text-sm text-center">{error}</p>
          )}
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
```

- [ ] **Step 2: Manual smoke test**

Run: `npm run dev`. Open `http://localhost:3000/login`. Request OTP with your email, check SES sandbox inbox (or console if SES logs to stderr in dev), then enter the code. Confirm you are redirected to `/dashboard`.

- [ ] **Step 3: Commit**

```bash
git add src/app/login/page.tsx
git commit -m "feat: add /login page with two-step OTP form"
```

---

## Phase 6 · Migrate Survey APIs

### Task 21: `GET /api/surveys` + `POST /api/surveys`

**Files:**
- Modify: `src/app/api/surveys/route.ts`
- Modify: `src/__tests__/api/surveys.test.ts` (if it covers these)

**Behavior:**
- `GET /api/surveys` — list surveys for the authenticated user only. `userId` is read from the `x-user-id` header injected by middleware. Accepts `?include=counts` which fetches response counts per survey (N+1 → one Query per survey, still reasonable).
- `POST /api/surveys` — create survey owned by the authenticated user.
- No more `creator_code` / `creator_name` — remove those fields from the body.

- [ ] **Step 1: Rewrite route**

```typescript
// src/app/api/surveys/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  createSurvey,
  listSurveysByUserId,
  type SurveyRecord,
} from "@/lib/db/surveys";
import { listResponsesBySurveyId } from "@/lib/db/responses";
import { generateUniqueShortCode } from "@/lib/identifiers";

function getUserId(req: NextRequest): string | null {
  return req.headers.get("x-user-id");
}

// GET /api/surveys[?include=counts]
export async function GET(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const includeCounts = request.nextUrl.searchParams.get("include") === "counts";
  const surveys = (await listSurveysByUserId(userId)).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );

  if (!includeCounts) return NextResponse.json(surveys);

  const withCounts = await Promise.all(
    surveys.map(async (s: SurveyRecord) => {
      const rs = await listResponsesBySurveyId(s.surveyId);
      const counts = {
        total: rs.length,
        completed: rs.filter((r) => r.status === "completed").length,
        partial: rs.filter((r) => r.status === "partial").length,
        inProgress: rs.filter((r) => r.status === "in_progress").length,
      };
      return { ...s, responseCounts: counts };
    })
  );
  return NextResponse.json(withCounts);
}

// POST /api/surveys
export async function POST(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { title, description, questions, settings, status, shortCode } = body;
    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const finalShortCode = shortCode || (await generateUniqueShortCode());
    const survey = await createSurvey({
      userId,
      shortCode: finalShortCode,
      title,
      description: description ?? null,
      questions: questions ?? [],
      settings: settings ?? {},
      status: status ?? "draft",
    });
    return NextResponse.json(survey, { status: 201 });
  } catch (err) {
    console.error("POST /api/surveys error:", err);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

// PUT /api/surveys - legacy combined update (used by create flow)
export async function PUT(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { id, title, description, questions } = body;
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });

    const { getSurveyById, updateSurvey } = await import("@/lib/db/surveys");
    const existing = await getSurveyById(id);
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 });
    }
    const updated = await updateSurvey(id, {
      title,
      description: description ?? null,
      questions: questions ?? [],
      status: "active",
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("PUT /api/surveys error:", err);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
```

- [ ] **Step 2: Delete the Supabase-based survey tests in `src/__tests__/api/surveys.test.ts`**

These covered the old `creator_code` + Supabase query pattern; we will re-test against the DynamoDB repo in a follow-up. Delete the file to unblock the build. (Note: `src/__tests__/api/analytics-data-flow.test.ts` and `src/__tests__/api/chat-responder.test.ts` are rewritten in Phase 8.)

Run: `rm src/__tests__/api/surveys.test.ts src/__tests__/api/responses.test.ts`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/surveys/route.ts src/__tests__/api/surveys.test.ts src/__tests__/api/responses.test.ts
git commit -m "refactor: migrate /api/surveys to DynamoDB + JWT auth"
```

---

### Task 22: `GET/PATCH /api/surveys/[id]`

**Files:**
- Modify: `src/app/api/surveys/[id]/route.ts`

**Behavior:**
- `GET` is **public** for taking surveys: accepts UUID or shortCode.
- `PATCH` requires authenticated owner.

- [ ] **Step 1: Rewrite**

```typescript
// src/app/api/surveys/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSurveyById, getSurveyByShortCode, updateSurvey } from "@/lib/db/surveys";
import { isUUID, isShortCode } from "@/lib/identifiers";

async function resolveSurvey(idOrCode: string) {
  if (isUUID(idOrCode)) return getSurveyById(idOrCode);
  if (isShortCode(idOrCode)) return getSurveyByShortCode(idOrCode.toUpperCase());
  const byId = await getSurveyById(idOrCode);
  return byId ?? (await getSurveyByShortCode(idOrCode.toUpperCase()));
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const survey = await resolveSurvey(id);
  if (!survey) return NextResponse.json({ error: "Survey not found" }, { status: 404 });
  return NextResponse.json(survey);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = request.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { title, description, questions, settings, status } = body;

    const existing = await getSurveyById(id);
    if (!existing) return NextResponse.json({ error: "Survey not found" }, { status: 404 });
    if (existing.userId !== userId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const patch: Record<string, unknown> = {};
    if (title !== undefined) patch.title = title;
    if (description !== undefined) patch.description = description;
    if (questions !== undefined) patch.questions = questions;
    if (settings !== undefined) patch.settings = settings;
    if (status !== undefined) patch.status = status;

    const updated = await updateSurvey(id, patch);
    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH survey error:", err);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
```

- [ ] **Step 2: Delete debug endpoint**

Run: `rm -r src/app/api/surveys/\[id\]/debug`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/surveys/\[id\]/route.ts src/app/api/surveys/\[id\]/debug
git commit -m "refactor: migrate /api/surveys/[id] to DynamoDB, drop debug endpoint"
```

---

### Task 23: `GET /api/surveys/[id]/responses` and `/export`

**Files:**
- Modify: `src/app/api/surveys/[id]/responses/route.ts`
- Modify: `src/app/api/surveys/[id]/export/route.ts`

- [ ] **Step 1: Rewrite `responses/route.ts`**

```typescript
// src/app/api/surveys/[id]/responses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSurveyById } from "@/lib/db/surveys";
import { listResponsesBySurveyId } from "@/lib/db/responses";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = request.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const survey = await getSurveyById(id);
  if (!survey) return NextResponse.json({ error: "Survey not found" }, { status: 404 });
  if (survey.userId !== userId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const responses = (await listResponsesBySurveyId(id)).sort((a, b) =>
    b.startedAt.localeCompare(a.startedAt)
  );
  return NextResponse.json(responses);
}
```

- [ ] **Step 2: Rewrite `export/route.ts`**

```typescript
// src/app/api/surveys/[id]/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSurveyById } from "@/lib/db/surveys";
import { listResponsesBySurveyId, type ResponseRecord } from "@/lib/db/responses";
import { generateCSV } from "@/lib/csv";
import type { Question } from "@/types/database";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = request.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const survey = await getSurveyById(id);
  if (!survey) return NextResponse.json({ error: "Survey not found" }, { status: 404 });
  if (survey.userId !== userId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const all = await listResponsesBySurveyId(id);
  const completed = all.filter((r) => r.status === "completed");

  const csv = generateCSV(
    survey.questions as Question[],
    completed.map((r: ResponseRecord) => ({
      id: r.responseId,
      survey_id: r.surveyId,
      respondent_id: r.respondentId,
      answers: r.answers,
      status: r.status,
      started_at: r.startedAt,
      completed_at: r.completedAt ?? null,
      current_question_index: r.currentQuestionIndex,
    }))
  );

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${survey.title.replace(/[^a-z0-9]/gi, "_")}_responses.csv"`,
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
```

- [ ] **Step 3: Inspect `src/lib/csv.ts` — if `generateCSV` expects the legacy `Response` type, widen its parameter**

Read: `src/lib/csv.ts`. If the second parameter is typed as `Response[]` (the Supabase shape) the adapter object above matches it. If any stricter typing breaks, change the parameter type to `Array<{ answers: Record<string, unknown> }>` — the CSV only touches `answers`.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/surveys/\[id\]/responses/route.ts src/app/api/surveys/\[id\]/export/route.ts
git commit -m "refactor: migrate survey responses and export to DynamoDB"
```

---

## Phase 7 · Migrate Response APIs

### Task 24: `POST /api/responses`

**Files:**
- Modify: `src/app/api/responses/route.ts`

**Public endpoint** — survey takers are not authenticated.

- [ ] **Step 1: Rewrite**

```typescript
// src/app/api/responses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getSurveyById, getSurveyByShortCode } from "@/lib/db/surveys";
import { createResponse } from "@/lib/db/responses";
import { isUUID, isShortCode } from "@/lib/identifiers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { survey_id, respondent_id, answers, status: responseStatus } = body;

    if (!survey_id) {
      return NextResponse.json({ error: "survey_id is required" }, { status: 400 });
    }

    const survey = isUUID(survey_id)
      ? await getSurveyById(survey_id)
      : isShortCode(survey_id)
      ? await getSurveyByShortCode(survey_id.toUpperCase())
      : (await getSurveyById(survey_id)) ?? (await getSurveyByShortCode(survey_id.toUpperCase()));

    if (!survey) return NextResponse.json({ error: "Survey not found" }, { status: 404 });
    if (survey.status !== "active") {
      return NextResponse.json(
        { error: "Survey is not accepting responses" },
        { status: 400 }
      );
    }

    if (answers && (responseStatus === "completed" || responseStatus === "partial")) {
      const saved = await createResponse({
        surveyId: survey.surveyId,
        respondentId: respondent_id || nanoid(12),
        answers,
        status: responseStatus,
        currentQuestionIndex: 0,
        completedAt: new Date().toISOString(),
      });
      return NextResponse.json(saved, { status: 201 });
    }

    const saved = await createResponse({
      surveyId: survey.surveyId,
      respondentId: respondent_id || nanoid(12),
      answers: {},
      status: "in_progress",
      currentQuestionIndex: 0,
    });
    return NextResponse.json(saved, { status: 201 });
  } catch (err) {
    console.error("POST /api/responses error:", err);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/responses/route.ts
git commit -m "refactor: migrate POST /api/responses to DynamoDB"
```

---

### Task 25: `GET/PATCH /api/responses/[id]`

**Files:**
- Modify: `src/app/api/responses/[id]/route.ts`

- [ ] **Step 1: Rewrite**

```typescript
// src/app/api/responses/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getResponseById, updateResponse } from "@/lib/db/responses";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const r = await getResponseById(id);
  if (!r) return NextResponse.json({ error: "Response not found" }, { status: 404 });
  return NextResponse.json(r);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const patch: Record<string, unknown> = {};
    if (body.answers !== undefined) patch.answers = body.answers;
    if (body.status !== undefined) patch.status = body.status;
    if (body.current_question_index !== undefined)
      patch.currentQuestionIndex = body.current_question_index;
    if (body.completed_at !== undefined) patch.completedAt = body.completed_at;

    const updated = await updateResponse(id, patch);
    if (!updated) return NextResponse.json({ error: "Response not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/responses/\[id\]/route.ts
git commit -m "refactor: migrate GET/PATCH /api/responses/[id] to DynamoDB"
```

---

## Phase 8 · Migrate Chat APIs

### Task 26: `/api/chat/creator`

**Files:**
- Modify: `src/app/api/chat/creator/route.ts`

**Key changes:**
- Remove `creator_code`, `creator_name`, `customCreatorName` from the body and state.
- Require authenticated user; attach `userId` from `x-user-id`.
- On `finalize`, call `createSurvey` instead of `db.from("surveys").insert(...)`.

- [ ] **Step 1: Rewrite**

```typescript
// src/app/api/chat/creator/route.ts
import { streamText } from "ai";
import { geminiPro, StreamActionBuffer } from "@/lib/ai";
import { nanoid } from "nanoid";
import type { Question, QuestionType } from "@/types/database";
import { generateUniqueShortCode } from "@/lib/identifiers";
import { createSurvey } from "@/lib/db/surveys";
import { NextRequest, NextResponse } from "next/server";

interface SurveyState {
  id?: string;
  shortCode?: string;
  title?: string;
  description?: string;
  questions: Question[];
  isFinalized: boolean;
  language?: string;
}

// ---- CREATOR_SYSTEM_PROMPT is unchanged — keep the existing constant verbatim. ----
// (Copy the full string from the pre-migration file; only the runtime code below changes.)
const CREATOR_SYSTEM_PROMPT = `/* PASTE EXISTING PROMPT STRING HERE */`;

export async function POST(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { messages, surveyState: incomingState } = await request.json();

    const surveyState: SurveyState = incomingState || { questions: [], isFinalized: false };

    let stateContext = "\n\n## IMPORTANT: Current Survey State (User Edited)\n";
    stateContext += "The user can edit the survey directly in the preview panel. The state below reflects their latest edits.\n";
    stateContext += "**You MUST preserve this state exactly unless the user explicitly asks for changes.**\n\n";
    if (surveyState.title) stateContext += `Title: ${surveyState.title}\n`;
    if (surveyState.description) stateContext += `Description: ${surveyState.description}\n`;
    if (surveyState.questions.length > 0) {
      stateContext += `\nQuestions (${surveyState.questions.length}):\n`;
      surveyState.questions.forEach((q, i) => {
        stateContext += `  ${i + 1}. [${q.type}${q.required ? ", required" : ""}] ${q.text}`;
        if (q.options && q.options.length > 0) stateContext += ` | Options: ${q.options.join(", ")}`;
        stateContext += `\n`;
      });
      stateContext += "\n**DO NOT use set_questions to replace all questions unless the user asks to regenerate the entire survey.**\n";
      stateContext += "**Use add_question to add new questions, remove_question to delete specific questions.**\n";
    }

    const result = streamText({
      model: geminiPro,
      system: CREATOR_SYSTEM_PROMPT + stateContext,
      messages,
    });

    const encoder = new TextEncoder();
    const actionBuffer = new StreamActionBuffer();
    const updatedState = { ...surveyState };

    const processAction = (action: Record<string, any>): boolean => {
      let changed = false;
      switch (action.type) {
        case "set_language":
          updatedState.language = action.language;
          changed = true;
          break;
        case "set_title":
          updatedState.title = action.title;
          changed = true;
          break;
        case "set_description":
          updatedState.description = action.description;
          changed = true;
          break;
        case "add_question": {
          const q = action.question || {};
          updatedState.questions = [
            ...updatedState.questions,
            {
              id: nanoid(8),
              type: (q.type as QuestionType) || "text",
              text: q.text || "",
              required: q.required ?? true,
              options: q.options,
              validation: q.validation,
            },
          ];
          changed = true;
          break;
        }
        case "set_questions": {
          const qs = action.questions || [];
          updatedState.questions = qs.map((q: Partial<Question>) => ({
            id: nanoid(8),
            type: (q.type as QuestionType) || "text",
            text: q.text || "",
            required: q.required ?? true,
            options: q.options,
            validation: q.validation,
          }));
          changed = true;
          break;
        }
        case "remove_question": {
          const i = typeof action.index === "number" ? action.index : parseInt(action.index, 10);
          if (!isNaN(i) && i >= 0 && i < updatedState.questions.length) {
            updatedState.questions = updatedState.questions.filter((_, idx) => idx !== i);
            changed = true;
          }
          break;
        }
        case "update_question": {
          const i = typeof action.index === "number" ? action.index : parseInt(action.index, 10);
          if (!isNaN(i) && i >= 0 && i < updatedState.questions.length) {
            const u = action.updates || {};
            updatedState.questions = updatedState.questions.map((q, idx) =>
              idx === i ? { ...q, ...u } : q
            );
            changed = true;
          }
          break;
        }
      }
      return changed;
    };

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let pendingFinalizeAction: Record<string, any> | null = null;

          for await (const chunk of result.textStream) {
            const { text: safeText, actions } = actionBuffer.push(chunk);
            if (safeText) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: safeText })}\n\n`));
            }
            for (const action of actions) {
              if (action.type === "finalize") pendingFinalizeAction = action;
              else if (processAction(action)) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ surveyState: updatedState })}\n\n`));
              }
            }
          }

          const { text: remaining, actions: remainingActions } = actionBuffer.flush();
          if (remaining) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: remaining })}\n\n`));
          for (const action of remainingActions) {
            if (action.type === "finalize") pendingFinalizeAction = action;
            else if (processAction(action)) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ surveyState: updatedState })}\n\n`));
            }
          }

          if (pendingFinalizeAction && updatedState.title) {
            const shortCode = await generateUniqueShortCode();
            const language = updatedState.language || "zh";
            const saved = await createSurvey({
              userId,
              shortCode,
              title: updatedState.title,
              description: updatedState.description || null,
              questions: updatedState.questions,
              settings: { language },
              status: "active",
            });
            updatedState.id = saved.surveyId;
            updatedState.shortCode = saved.shortCode;
            updatedState.isFinalized = true;
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ done: true, surveyState: updatedState })}\n\n`)
          );
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Creator chat error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
```

**Note on `CREATOR_SYSTEM_PROMPT`:** before running, paste the full string value from the previous version of this file (unchanged). The only behavior change is the runtime code.

- [ ] **Step 2: Extend middleware to cover `/api/chat/creator`**

Open `src/middleware.ts`, add `"/api/chat/creator"` to `PROTECTED_API_PREFIXES` and to the `matcher` list:

```typescript
const PROTECTED_API_PREFIXES = ["/api/surveys", "/api/chat/creator"];
// ...
export const config = {
  matcher: ["/dashboard/:path*", "/create/:path*", "/api/surveys/:path*", "/api/chat/creator"],
};
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/chat/creator/route.ts src/middleware.ts
git commit -m "refactor: migrate /api/chat/creator to DynamoDB + auth"
```

---

### Task 27: `/api/chat/responder`

**Files:**
- Modify: `src/app/api/chat/responder/route.ts`

**Public endpoint** (survey takers). Replace Supabase reads/writes with `getSurveyById` / `getSurveyByShortCode` / `createResponse` / `updateResponse`.

- [ ] **Step 1: Rewrite data access portions**

Keep `buildResponderPrompt` and streaming logic unchanged. Replace only:

1. Top of POST — survey lookup:

```typescript
import { getSurveyById, getSurveyByShortCode } from "@/lib/db/surveys";
import { createResponse, updateResponse } from "@/lib/db/responses";
import { isUUID, isShortCode } from "@/lib/identifiers";
// remove: import { supabase } from "@/lib/supabase"; and const db = ...;

// inside POST:
const survey = isUUID(surveyId)
  ? await getSurveyById(surveyId)
  : isShortCode(surveyId)
  ? await getSurveyByShortCode(surveyId.toUpperCase())
  : (await getSurveyById(surveyId)) ?? (await getSurveyByShortCode(surveyId.toUpperCase()));

if (!survey) {
  return new Response(JSON.stringify({ error: "Survey not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
}
const actualSurveyId = survey.surveyId;
```

2. Response creation (was `db.from("responses").insert({...})`):

```typescript
if (!responseState.responseId) {
  const newResp = await createResponse({
    surveyId: actualSurveyId,
    respondentId: null,
    answers: {},
    status: "in_progress",
    currentQuestionIndex: 0,
  });
  responseState.responseId = newResp.responseId;
}
```

3. Inside action handlers:

- `save_answer`:
  ```typescript
  await updateResponse(updatedState.responseId, {
    answers: updatedState.answers,
    currentQuestionIndex: updatedState.currentQuestionIndex,
  });
  ```
- `go_back`:
  ```typescript
  await updateResponse(updatedState.responseId, {
    currentQuestionIndex: updatedState.currentQuestionIndex,
  });
  ```
- `complete`:
  ```typescript
  await updateResponse(updatedState.responseId, {
    answers: updatedState.answers,
    status: "completed",
    completedAt: new Date().toISOString(),
  });
  ```

4. At the top of the file, **remove**: `import { supabase } from "@/lib/supabase";` and `const db = supabase as any;`.

5. Update the `survey as Survey` cast inside `buildResponderPrompt`: the new `SurveyRecord` shape from `@/lib/db/surveys` already exposes `title`, `questions`, `settings` — pass it directly. Change the function signature's type to `SurveyRecord` (import it) or keep a local structural type.

- [ ] **Step 2: Delete the stale responder test**

Run: `rm src/__tests__/api/chat-responder.test.ts` (it was written against Supabase mocks; add DynamoDB-based tests after the migration is working end-to-end).

- [ ] **Step 3: Commit**

```bash
git add src/app/api/chat/responder/route.ts src/__tests__/api/chat-responder.test.ts
git commit -m "refactor: migrate /api/chat/responder to DynamoDB"
```

---

### Task 28: `/api/chat/analytics` and `lib/analytics-tools.ts`

**Files:**
- Modify: `src/lib/analytics-tools.ts`
- Modify: `src/app/api/chat/analytics/route.ts` (only if it imports supabase — it doesn't; no change needed)

- [ ] **Step 1: Rewrite analytics tools**

```typescript
// src/lib/analytics-tools.ts
import { tool } from "ai";
import { z } from "zod";
import { getSurveyById } from "@/lib/db/surveys";
import { listResponsesBySurveyId } from "@/lib/db/responses";

export const getSurveyOverview = tool({
  description: "Get survey metadata including title, questions, and response statistics. Call this first to understand the survey structure.",
  parameters: z.object({
    surveyId: z.string().describe("The survey ID to get overview for"),
  }),
  execute: async ({ surveyId }) => {
    const survey = await getSurveyById(surveyId);
    if (!survey) return { error: "Survey not found" };

    const responses = await listResponsesBySurveyId(surveyId);
    const total = responses.length;
    const completed = responses.filter((r) => r.status === "completed").length;
    const partial = responses.filter((r) => r.status === "partial").length;

    return {
      id: survey.surveyId,
      title: survey.title,
      description: survey.description,
      status: survey.status,
      questions: survey.questions.map((q) => ({
        id: q.id,
        text: q.text,
        type: q.type,
        options: q.options,
        required: q.required,
      })),
      stats: {
        totalResponses: total,
        completedResponses: completed,
        partialResponses: partial,
        inProgressResponses: total - completed - partial,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      },
    };
  },
});

export const getQuestionStats = tool({
  description: "Get aggregated statistics for a specific question. Returns distribution for choice questions, average/min/max for numeric questions, or sample responses for text questions.",
  parameters: z.object({
    surveyId: z.string(),
    questionId: z.string(),
    completedOnly: z.boolean().optional().default(true),
  }),
  execute: async ({ surveyId, questionId, completedOnly }) => {
    const survey = await getSurveyById(surveyId);
    if (!survey) return { error: "Survey not found" };

    const question = survey.questions.find((q) => q.id === questionId);
    if (!question) return { error: "Question not found" };

    let responses = await listResponsesBySurveyId(surveyId);
    if (completedOnly) responses = responses.filter((r) => r.status === "completed");

    const answers = responses
      .map((r) => r.answers[questionId])
      .filter((a) => a !== undefined && a !== null && a !== "");

    const totalAnswers = answers.length;

    if (question.type === "multiple_choice" || question.type === "dropdown" || question.type === "yes_no") {
      const distribution: Record<string, number> = {};
      answers.forEach((a) => {
        const key = String(a);
        distribution[key] = (distribution[key] || 0) + 1;
      });
      return { questionId, questionText: question.text, questionType: question.type, totalAnswers, distribution };
    }

    if (question.type === "rating" || question.type === "number" || question.type === "slider") {
      const nums = (answers as unknown[]).map((a) => Number(a)).filter((n) => !isNaN(n));
      if (nums.length === 0) {
        return { questionId, questionText: question.text, questionType: question.type, totalAnswers: 0 };
      }
      const sum = nums.reduce((a, b) => a + b, 0);
      const distribution: Record<string, number> = {};
      nums.forEach((n) => {
        const key = String(n);
        distribution[key] = (distribution[key] || 0) + 1;
      });
      return {
        questionId,
        questionText: question.text,
        questionType: question.type,
        totalAnswers: nums.length,
        average: Number((sum / nums.length).toFixed(2)),
        min: Math.min(...nums),
        max: Math.max(...nums),
        distribution,
      };
    }

    if (question.type === "multi_select") {
      const distribution: Record<string, number> = {};
      answers.forEach((a) => {
        const selections = Array.isArray(a) ? a : [a];
        selections.forEach((s) => {
          const key = String(s);
          distribution[key] = (distribution[key] || 0) + 1;
        });
      });
      return { questionId, questionText: question.text, questionType: question.type, totalAnswers, distribution };
    }

    return {
      questionId,
      questionText: question.text,
      questionType: question.type,
      totalAnswers,
      sampleResponses: answers.slice(0, 5).map((a) => String(a).slice(0, 200)),
    };
  },
});

const FilterOperatorSchema = z.enum(["eq", "neq", "gt", "gte", "lt", "lte", "contains"]);

export const getFilteredResponses = tool({
  description: "Fetch responses matching specific filters.",
  parameters: z.object({
    surveyId: z.string(),
    filters: z
      .array(
        z.object({
          questionId: z.string(),
          operator: FilterOperatorSchema,
          value: z.string(),
        })
      )
      .optional(),
    completedOnly: z.boolean().optional().default(true),
    limit: z.number().optional().default(50),
  }),
  execute: async ({ surveyId, filters, completedOnly, limit }) => {
    let responses = await listResponsesBySurveyId(surveyId);
    if (completedOnly) responses = responses.filter((r) => r.status === "completed");

    let filtered = responses;
    if (filters && filters.length > 0) {
      filtered = filtered.filter((r) =>
        filters.every((f) => {
          const answer = r.answers[f.questionId];
          if (answer === undefined || answer === null) return false;
          switch (f.operator) {
            case "eq": return answer === f.value || String(answer) === String(f.value);
            case "neq": return answer !== f.value && String(answer) !== String(f.value);
            case "gt": return Number(answer) > Number(f.value);
            case "gte": return Number(answer) >= Number(f.value);
            case "lt": return Number(answer) < Number(f.value);
            case "lte": return Number(answer) <= Number(f.value);
            case "contains": return String(answer).toLowerCase().includes(String(f.value).toLowerCase());
            default: return true;
          }
        })
      );
    }
    const limited = filtered.slice(0, limit);
    return {
      total: filtered.length,
      returned: limited.length,
      responses: limited.map((r) => ({
        id: r.responseId,
        answers: r.answers,
        status: r.status,
        completedAt: r.completedAt,
      })),
    };
  },
});

export const crossTabulate = tool({
  description: "Analyze the relationship between two questions.",
  parameters: z.object({
    surveyId: z.string(),
    questionId1: z.string(),
    questionId2: z.string(),
    completedOnly: z.boolean().optional().default(true),
  }),
  execute: async ({ surveyId, questionId1, questionId2, completedOnly }) => {
    const survey = await getSurveyById(surveyId);
    if (!survey) return { error: "Survey not found" };
    const q1 = survey.questions.find((q) => q.id === questionId1);
    const q2 = survey.questions.find((q) => q.id === questionId2);
    if (!q1 || !q2) return { error: "One or both questions not found" };

    let responses = await listResponsesBySurveyId(surveyId);
    if (completedOnly) responses = responses.filter((r) => r.status === "completed");

    const matrix: Record<string, Record<string, number>> = {};
    let total = 0;
    responses.forEach((r) => {
      const a1 = r.answers[questionId1];
      const a2 = r.answers[questionId2];
      if (a1 !== undefined && a1 !== null && a2 !== undefined && a2 !== null) {
        const k1 = String(a1);
        const k2 = String(a2);
        if (!matrix[k1]) matrix[k1] = {};
        matrix[k1][k2] = (matrix[k1][k2] || 0) + 1;
        total++;
      }
    });
    return { question1: { id: q1.id, text: q1.text }, question2: { id: q2.id, text: q2.text }, matrix, total };
  },
});

export const analyticsTools = {
  getSurveyOverview,
  getQuestionStats,
  getFilteredResponses,
  crossTabulate,
};
```

- [ ] **Step 2: Delete the stale analytics-data-flow test**

Run: `rm src/__tests__/api/analytics-data-flow.test.ts` (mocked Supabase; retest after migration).

- [ ] **Step 3: Commit**

```bash
git add src/lib/analytics-tools.ts src/__tests__/api/analytics-data-flow.test.ts
git commit -m "refactor: migrate analytics tools to DynamoDB"
```

---

## Phase 9 · UI Updates

### Task 29: Update translations — product rebrand

**Files:**
- Modify: `src/lib/translations.ts`

- [ ] **Step 1: Find and replace branding strings**

Only for the top-level product name keys. Keep all other copy intact.

- `en.home.title`: `"ChatSurvey"` → `"ChatSurvey"` (English keeps ChatSurvey as a marketing name — confirm with user before changing). Change subtitle to `"Co-create everything with AI"`.
- `zh.home.title`: `"畅聊问卷"` (or whatever currently there) → `"畅谈问卷"`
- `zh.home.subtitle`: → `"我和AI共创一切"`
- `zh.home.footer`: → `"畅谈问卷 · 我和AI共创一切"`

Apply the same title change in:
- `en.dashboard.title` / `zh.dashboard.title` → keep "Dashboard" / "管理中心" (distinct from brand)

- [ ] **Step 2: Remove `creator_code`-era strings**

Remove `home.creatorNameLabel`, `home.creatorNamePlaceholder`, `home.creatorNameHint`, `home.enterNameError`, `dashboard.enterNameLabel`, `dashboard.namePlaceholder`, `dashboard.name` — all the "enter creator name" copy is now defunct. Add replacements:

```typescript
// in both en and zh:
login: {
  title: "Sign in",  // zh: "登录"
  emailLabel: "Email",  // zh: "邮箱"
  sendCode: "Send code",  // zh: "发送验证码"
  codeLabel: "6-digit code",  // zh: "6位验证码"
  verify: "Sign in",  // zh: "登录"
  back: "Change email",  // zh: "修改邮箱"
  codeSentTo: "Code sent to {email}",  // zh: "验证码已发送至 {email}"
},
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/translations.ts
git commit -m "refactor: rebrand to 畅谈问卷 + remove creator_code copy"
```

---

### Task 30: Home page rewrite

**Files:**
- Modify: `src/app/page.tsx`

**New home flow:**
- Landing: brand + "创建问卷 / 填写问卷" mode selector
- "创建问卷" button → if not logged in, redirect to `/login?next=/create`; else go to `/create`
- "管理中心" button → same, redirect to `/login?next=/dashboard`
- Take survey flow unchanged (public)

- [ ] **Step 1: Rewrite**

```tsx
// src/app/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ModeSelector } from "@/components/ModeSelector";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Home() {
  const router = useRouter();
  const { t } = useLanguage();
  const [mode, setMode] = useState<"create" | "take">("create");
  const [surveyId, setSurveyId] = useState("");
  const [error, setError] = useState("");

  const handleCreateSurvey = () => {
    router.push("/login?next=/create");
  };
  const handleViewDashboard = () => {
    router.push("/login?next=/dashboard");
  };

  const handleTakeSurvey = () => {
    if (!surveyId.trim()) {
      setError(t.home.enterCodeError);
      return;
    }
    let id = surveyId.trim();
    if (id.includes("/survey/")) id = id.split("/survey/").pop() || "";
    if (id) router.push(`/survey/${id}`);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{t.home.title}</h1>
          <p className="text-gray-600">{t.home.subtitle}</p>
        </div>

        <div className="mb-6">
          <ModeSelector mode={mode} onModeChange={setMode} />
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 min-h-[280px]">
          {mode === "create" ? (
            <div className="space-y-4">
              <p className="text-gray-600 text-center">{t.home.createDescription}</p>
              <button
                onClick={handleCreateSurvey}
                className="w-full py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
              >
                {t.home.startCreate}
              </button>
              <button
                onClick={handleViewDashboard}
                className="w-full py-3 border border-gray-300 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition-colors"
              >
                {t.home.viewDashboard}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600 text-center">{t.home.takeDescription}</p>
              <input
                type="text"
                value={surveyId}
                onChange={(e) => {
                  setSurveyId(e.target.value);
                  setError("");
                }}
                placeholder={t.home.surveyCodePlaceholder}
                className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleTakeSurvey}
                className="w-full py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
              >
                {t.home.startFill}
              </button>
            </div>
          )}
          {error && <p className="mt-4 text-red-500 text-sm text-center">{error}</p>}
        </div>

        <p className="text-center text-gray-400 text-sm mt-8">{t.home.footer}</p>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "refactor: home page uses email login instead of creator_code"
```

---

### Task 31: Dashboard rewrite

**Files:**
- Modify: `src/app/dashboard/DashboardContent.tsx`
- Modify: `src/app/dashboard/page.tsx` (if imports change)

**New behavior:** no `?code=` query param, no `creator_code` — dashboard calls `/api/surveys` which reads `userId` from the JWT cookie via middleware. Also add a logout button in the header.

- [ ] **Step 1: Rewrite DashboardContent**

```tsx
// src/app/dashboard/DashboardContent.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SurveyCard } from "@/components/SurveyCard";
import { useLanguage } from "@/contexts/LanguageContext";

interface SurveyWithCount {
  surveyId: string;
  shortCode: string;
  userId: string;
  title: string;
  description: string | null;
  status: "draft" | "active" | "closed";
  questions: unknown[];
  createdAt: string;
  updatedAt: string;
  responseCount: number;
  completedCount: number;
  partialCount: number;
  inProgressCount: number;
}

export function DashboardContent() {
  const router = useRouter();
  const { t } = useLanguage();

  const [email, setEmail] = useState<string | null>(null);
  const [surveys, setSurveys] = useState<SurveyWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hideClosed, setHideClosed] = useState(true);

  // Get current user's email for display
  useEffect(() => {
    fetch("/api/auth/me").then(async (r) => {
      const data = await r.json();
      setEmail(data?.user?.email ?? null);
    });
  }, []);

  const fetchSurveys = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/surveys?include=counts`);
      if (res.status === 401) {
        router.push("/login?next=/dashboard");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch surveys");
      const data = await res.json();
      setSurveys(
        data.map((s: any) => ({
          ...s,
          responseCount: s.responseCounts?.total ?? 0,
          completedCount: s.responseCounts?.completed ?? 0,
          partialCount: s.responseCounts?.partial ?? 0,
          inProgressCount: s.responseCounts?.inProgress ?? 0,
        }))
      );
    } catch {
      setError(t.survey.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [router, t.survey.loadFailed]);

  useEffect(() => {
    fetchSurveys();
  }, [fetchSurveys]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  const handleExport = (surveyId: string) => {
    window.open(`/api/surveys/${surveyId}/export`, "_blank");
  };

  const handleStatusChange = async (
    surveyId: string,
    newStatus: "draft" | "active" | "closed"
  ) => {
    try {
      const res = await fetch(`/api/surveys/${surveyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setSurveys((prev) =>
          prev.map((s) => (s.surveyId === surveyId ? { ...s, status: newStatus } : s))
        );
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white border-b px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/")} className="text-gray-600 hover:text-gray-800" aria-label="home">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-semibold">{t.dashboard.title}</h1>
              <p className="text-sm text-gray-500">{email ?? ""}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/create")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t.dashboard.createSurvey}
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              {t.dashboard.logout}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">{t.dashboard.loadingSurveys}</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
            <button
              onClick={fetchSurveys}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {t.retry}
            </button>
          </div>
        ) : surveys.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">{t.dashboard.noSurveysFound}</p>
            <button
              onClick={() => router.push("/create")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {t.dashboard.createFirst}
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-end mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hideClosed}
                  onChange={(e) => setHideClosed(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">{t.dashboard.hideClosed}</span>
              </label>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              {surveys
                .filter((s) => !hideClosed || s.status !== "closed")
                .map((s) => (
                  <SurveyCard
                    key={s.surveyId}
                    survey={{
                      id: s.surveyId,
                      short_code: s.shortCode,
                      title: s.title,
                      description: s.description,
                      status: s.status,
                      questions: s.questions as any,
                      creator_name: "",
                      creator_code: "",
                      settings: {},
                      created_at: s.createdAt,
                      updated_at: s.updatedAt,
                    }}
                    responseCount={s.responseCount}
                    completedCount={s.completedCount}
                    partialCount={s.partialCount}
                    inProgressCount={s.inProgressCount}
                    onExport={() => handleExport(s.surveyId)}
                    onStatusChange={(status) => handleStatusChange(s.surveyId, status)}
                    onAnalyze={() => router.push(`/dashboard/chat?survey=${s.surveyId}`)}
                    onEdit={() => router.push(`/create?edit=${s.surveyId}`)}
                  />
                ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Update `SurveyCard` prop type**

Open `src/components/SurveyCard.tsx`. If its `survey` prop is typed as the old `Survey`, update it to match the new shape (or accept `Partial<Survey>` — the adapter above passes empty strings for the old creator_* fields).

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/DashboardContent.tsx src/components/SurveyCard.tsx
git commit -m "refactor: dashboard uses JWT auth, removes creator_code UI"
```

---

### Task 32: Create page + edit flow

**Files:**
- Modify: `src/app/create/page.tsx`

- [ ] **Step 1: Read the current create page and remove creator_code wiring**

Open `src/app/create/page.tsx`. Delete:
- Any `localStorage.getItem("survey_creator_name")` / `searchParams.get("creator")` logic
- Any `creator_code` or `customCreatorName` passed to `/api/chat/creator`
- Pet-name display code

Keep the chat UI and the `edit=` query parameter (it looks up the existing survey). When saving after edit, the API routes now read `userId` from the cookie.

- [ ] **Step 2: Run the dev server and manually test**

Run: `npm run dev`
Login → create survey from chat → finalize → verify redirect to `/survey/[shortCode]` works → check survey appears in `/dashboard`.

- [ ] **Step 3: Commit**

```bash
git add src/app/create/page.tsx
git commit -m "refactor: create page uses JWT auth"
```

---

### Task 33: Layout — add auth state to header/layout

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Update metadata**

Update `metadata.title` and `metadata.description` to use "畅谈问卷" branding. Keep rest of layout unchanged.

```typescript
export const metadata: Metadata = {
  title: "畅谈问卷 · 我和AI共创一切",
  description: "智能问卷设计与分析平台",
};
```

- [ ] **Step 2: Commit**

```bash
git add src/app/layout.tsx
git commit -m "refactor: update root metadata with new product name"
```

---

## Phase 10 · Cleanup and Deploy

### Task 34: Delete Supabase artifacts

**Files:**
- Delete: `src/lib/supabase.ts`
- Delete: `supabase/schema.sql`, entire `supabase/` directory if empty after

- [ ] **Step 1: Verify no imports remain**

Run: use the Grep tool with `pattern: "supabase"` across `src/`. Expected: zero hits (all have been migrated in earlier tasks).

- [ ] **Step 2: Delete**

Run: `rm src/lib/supabase.ts && rm -rf supabase/`

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Run tests**

Run: `npm run test:run`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove Supabase client and schema"
```

---

### Task 35: Amplify build configuration

**Files:**
- Create: `amplify.yml`

- [ ] **Step 1: Write build spec**

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

- [ ] **Step 2: Document required environment variables in README**

Add the following block to `README.md` (or `CLAUDE.md` in the Environment Variables section), listing exactly which variables must be set in the Amplify console:
- `GOOGLE_GENERATIVE_AI_API_KEY`
- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` *(or use an IAM service role attached to Amplify)*
- `AWS_SES_FROM_EMAIL`
- `JWT_SECRET`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`

Do NOT set `DYNAMODB_ENDPOINT` in production — the default AWS endpoint is used when unset.

- [ ] **Step 3: Document required IAM policy**

Add to `CLAUDE.md` under a new "AWS IAM Policy" section:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:ap-northeast-1:*:table/ct-survey-*",
        "arn:aws:dynamodb:ap-northeast-1:*:table/ct-survey-*/index/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": ["ses:SendEmail", "ses:SendRawEmail"],
      "Resource": "*"
    }
  ]
}
```

- [ ] **Step 4: Commit**

```bash
git add amplify.yml README.md CLAUDE.md
git commit -m "infra: add Amplify build config and document AWS IAM policy"
```

---

### Task 36: Run production DB setup + smoke test

- [ ] **Step 1: Create production DynamoDB tables**

Unset `DYNAMODB_ENDPOINT` in your shell so the script talks to real AWS:

Run: `unset DYNAMODB_ENDPOINT && AWS_REGION=ap-northeast-1 npm run db:setup`
Expected: four tables created with TTL enabled on `ct-survey-otp`.

- [ ] **Step 2: Deploy to Amplify**

In the AWS Amplify console:
1. Connect the GitHub repo
2. Use the `amplify.yml` build spec (auto-detected)
3. Paste the environment variables listed above
4. Attach the IAM policy (or service role) from Task 35
5. Bind the custom domain `mysurvey.jakobhe.com` (Route 53 CNAME auto-configured)

- [ ] **Step 3: End-to-end smoke test on production**

1. Visit `https://mysurvey.jakobhe.com/login`
2. Request an OTP to your own email — verify SES delivers
3. Enter the code — verify redirect to `/dashboard`
4. Create a survey via the chat — verify it saves to DynamoDB
5. Open the survey link in an incognito window — verify the take-survey flow works
6. Back in dashboard — verify the response count increments and CSV export downloads

- [ ] **Step 4: Write smoke-test log in `docs/superpowers/plans/aws-migration-smoke-test.md`**

Record what worked, what broke, any follow-ups. Commit.

```bash
git add docs/superpowers/plans/aws-migration-smoke-test.md
git commit -m "docs: record AWS migration smoke-test results"
```

---

### Task 37: Update `CLAUDE.md`

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Rewrite the "Architecture" section**

Replace the current architecture section with:

```markdown
## Architecture

This is 畅谈问卷 (ChatSurvey) — a conversational survey platform: **Next.js 14** (App Router) hosted on **AWS Amplify**, backed by **AWS DynamoDB**, with **Google Gemini AI** for conversational flows and **AWS SES** for email OTP authentication.

### Two Modes
- **Creator Mode** (`/create`): AI guides users through survey design via chat (authenticated)
- **Responder Mode** (`/survey/[id]`): AI presents questions conversationally, one at a time (public)

### Authentication
- Email + 6-digit OTP via AWS SES; OTPs stored bcrypt-hashed in DynamoDB with 10-min TTL
- JWT in httpOnly cookie, 7-day expiry, signed with `JWT_SECRET`
- `src/middleware.ts` gates `/dashboard/*`, `/create/*`, `/api/surveys/*`, `/api/chat/creator`

### Data Model — DynamoDB
Four tables, prefixed `ct-survey-`:
- `users`: userId (PK), email (GSI `email-index`), createdAt
- `otp`: email (PK), otpHash, expiresAt (TTL attribute)
- `surveys`: surveyId (PK), userId (GSI), shortCode (GSI), title, description, questions, settings, status, timestamps
- `responses`: responseId (PK), surveyId (GSI), answers, status, currentQuestionIndex, timestamps

Accessor modules in `src/lib/db/{users,otp,surveys,responses}.ts`.

### AI Action Pattern
The AI chat endpoints use `<ACTION>{...}</ACTION>` tags embedded in responses to trigger state changes. The `parseActions()` function in `lib/ai.ts` extracts these.
```

- [ ] **Step 2: Update Commands section**

Add `npm run db:setup` to the commands block.

- [ ] **Step 3: Replace Environment Variables section**

Use the block from Task 35.

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: rewrite CLAUDE.md for AWS architecture"
```

---

## Self-Review Summary

**Spec coverage:**
- AWS Amplify hosting → Task 35 (amplify.yml)
- DynamoDB 4 tables → Tasks 4, 5–9
- SES OTP → Tasks 12, 14, 17
- JWT sessions → Tasks 13, 15, 16
- `creator_code` removal → Tasks 10, 21, 22, 29, 30, 31, 32
- Google Gemini unchanged → verified (only surrounding data access changed in Tasks 26–28)
- Product rebrand 畅谈问卷 → Tasks 29, 33
- Domain mysurvey.jakobhe.com + SES verified → Task 36 (deploy step)

**Risks / follow-ups not in scope:**
- No automated e2e test for the auth flow — manual smoke test only (Task 36)
- Supabase tests were deleted, not rewritten for DynamoDB — add back post-migration
- Cloudflare Turnstile is preserved but unverified in the new flow; smoke-test covers manually
- No data migration script — we assume the current Supabase data is throwaway (design said "完全替换"). If production data exists and needs to carry over, add a separate migration plan.
