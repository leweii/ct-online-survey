import { describe, it, expect, beforeEach, vi } from "vitest";

describe("dynamodb client", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("tableName defaults prefix to ct-survey", async () => {
    vi.stubEnv("DYNAMODB_TABLE_PREFIX", "");
    const mod = await import("@/lib/dynamodb");
    expect(mod.tableName("surveys")).toBe("ct-survey-surveys");
  });

  it("tableName uses DYNAMODB_TABLE_PREFIX env var", async () => {
    vi.stubEnv("DYNAMODB_TABLE_PREFIX", "my-prefix");
    const mod = await import("@/lib/dynamodb");
    expect(mod.tableName("users")).toBe("my-prefix-users");
  });
});
