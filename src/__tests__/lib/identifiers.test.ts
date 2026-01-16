import { describe, it, expect } from "vitest";
import { isUUID, isShortCode } from "@/lib/identifiers";

describe("isUUID", () => {
  it("should return true for valid UUID v4 lowercase", () => {
    expect(isUUID("60f43ae3-0428-4474-bfb2-ad74d00727d1")).toBe(true);
    expect(isUUID("c8d706a6-1f55-4946-a04b-dc8701d07f85")).toBe(true);
    expect(isUUID("81668107-5916-4e26-a6d3-83624749e94a")).toBe(true);
  });

  it("should return true for valid UUID v4 uppercase", () => {
    expect(isUUID("60F43AE3-0428-4474-BFB2-AD74D00727D1")).toBe(true);
    expect(isUUID("C8D706A6-1F55-4946-A04B-DC8701D07F85")).toBe(true);
  });

  it("should return true for valid UUID v4 mixed case", () => {
    expect(isUUID("60f43AE3-0428-4474-BFB2-ad74d00727d1")).toBe(true);
  });

  it("should return false for short codes", () => {
    expect(isUUID("FKQN")).toBe(false);
    expect(isUUID("FJHT")).toBe(false);
    expect(isUUID("F6MQ")).toBe(false);
    expect(isUUID("ABCD1234")).toBe(false);
  });

  it("should return false for invalid UUIDs", () => {
    expect(isUUID("")).toBe(false);
    expect(isUUID("not-a-uuid")).toBe(false);
    expect(isUUID("60f43ae3-0428-4474-bfb2")).toBe(false); // Too short
    expect(isUUID("60f43ae3-0428-4474-bfb2-ad74d00727d1-extra")).toBe(false); // Too long
    expect(isUUID("60f43ae30428-4474-bfb2-ad74d00727d1")).toBe(false); // Wrong format
    expect(isUUID("60f43ae3-04284474-bfb2-ad74d00727d1")).toBe(false); // Wrong format
    expect(isUUID("60f43ae3-0428-4474bfb2-ad74d00727d1")).toBe(false); // Wrong format
    expect(isUUID("60f43ae3-0428-4474-bfb2ad74d00727d1")).toBe(false); // Wrong format
    expect(isUUID("zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz")).toBe(false); // Invalid hex chars
  });

  it("should return false for UUIDs without hyphens", () => {
    expect(isUUID("60f43ae304284474bfb2ad74d00727d1")).toBe(false);
  });

  it("should return false for null-like values", () => {
    expect(isUUID("null")).toBe(false);
    expect(isUUID("undefined")).toBe(false);
  });
});

describe("isShortCode", () => {
  it("should return true for valid 4-character short codes", () => {
    expect(isShortCode("FKQN")).toBe(true);
    expect(isShortCode("FJHT")).toBe(true);
    expect(isShortCode("F6MQ")).toBe(true);
    expect(isShortCode("ABCD")).toBe(true);
    expect(isShortCode("2345")).toBe(true);
  });

  it("should return true for valid 5-8 character short codes", () => {
    expect(isShortCode("ABCDE")).toBe(true);
    expect(isShortCode("ABCDEF")).toBe(true);
    expect(isShortCode("ABCDEFG")).toBe(true);
    expect(isShortCode("ABCDEFGH")).toBe(true);
  });

  it("should return true for lowercase short codes (case insensitive)", () => {
    expect(isShortCode("fkqn")).toBe(true);
    expect(isShortCode("fjht")).toBe(true);
    expect(isShortCode("abcdefgh")).toBe(true);
  });

  it("should return true for mixed case short codes", () => {
    expect(isShortCode("FkQn")).toBe(true);
    expect(isShortCode("AbCdEfGh")).toBe(true);
  });

  it("should return false for UUIDs", () => {
    expect(isShortCode("60f43ae3-0428-4474-bfb2-ad74d00727d1")).toBe(false);
    expect(isShortCode("c8d706a6-1f55-4946-a04b-dc8701d07f85")).toBe(false);
  });

  it("should return false for codes shorter than 4 characters", () => {
    expect(isShortCode("")).toBe(false);
    expect(isShortCode("A")).toBe(false);
    expect(isShortCode("AB")).toBe(false);
    expect(isShortCode("ABC")).toBe(false);
  });

  it("should return false for codes longer than 8 characters", () => {
    expect(isShortCode("ABCDEFGHI")).toBe(false);
    expect(isShortCode("ABCDEFGHIJ")).toBe(false);
  });

  it("should return false for codes with excluded characters (0, O, 1, I, L)", () => {
    // These characters are excluded from SHORT_CODE_CHARS
    expect(isShortCode("AB0D")).toBe(false); // Contains 0
    expect(isShortCode("ABOD")).toBe(false); // Contains O
    expect(isShortCode("AB1D")).toBe(false); // Contains 1
    expect(isShortCode("ABID")).toBe(false); // Contains I
    expect(isShortCode("ABLD")).toBe(false); // Contains L
  });

  it("should return false for codes with special characters", () => {
    expect(isShortCode("AB-D")).toBe(false);
    expect(isShortCode("AB_D")).toBe(false);
    expect(isShortCode("AB D")).toBe(false);
    expect(isShortCode("AB.D")).toBe(false);
  });

  it("should return false for codes with invalid characters", () => {
    expect(isShortCode("AB@D")).toBe(false);
    expect(isShortCode("AB#D")).toBe(false);
    expect(isShortCode("中文AB")).toBe(false);
  });
});

describe("isUUID vs isShortCode mutual exclusivity", () => {
  it("valid UUID should not be a valid short code", () => {
    const uuid = "60f43ae3-0428-4474-bfb2-ad74d00727d1";
    expect(isUUID(uuid)).toBe(true);
    expect(isShortCode(uuid)).toBe(false);
  });

  it("valid short code should not be a valid UUID", () => {
    const shortCode = "FKQN";
    expect(isShortCode(shortCode)).toBe(true);
    expect(isUUID(shortCode)).toBe(false);
  });

  it("should correctly identify real-world survey identifiers", () => {
    // Real survey IDs from the database
    const realUUIDs = [
      "60f43ae3-0428-4474-bfb2-ad74d00727d1",
      "c8d706a6-1f55-4946-a04b-dc8701d07f85",
      "81668107-5916-4e26-a6d3-83624749e94a",
    ];

    const realShortCodes = ["FKQN", "FJHT", "F6MQ"];

    for (const uuid of realUUIDs) {
      expect(isUUID(uuid)).toBe(true);
      expect(isShortCode(uuid)).toBe(false);
    }

    for (const code of realShortCodes) {
      expect(isShortCode(code)).toBe(true);
      expect(isUUID(code)).toBe(false);
    }
  });
});
