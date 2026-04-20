import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetByShortCode } = vi.hoisted(() => ({
  mockGetByShortCode: vi.fn(),
}));

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

  it("retries on collision and eventually finds a unique code", async () => {
    mockGetByShortCode
      .mockResolvedValueOnce({ surveyId: "existing" })
      .mockResolvedValueOnce(null);
    const code = await generateUniqueShortCode();
    expect(code).toMatch(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/);
    expect(mockGetByShortCode).toHaveBeenCalledTimes(2);
  });
});

describe("isUUID", () => {
  it("recognizes valid UUID", () => {
    expect(isUUID("60f43ae3-0428-4474-bfb2-ad74d00727d1")).toBe(true);
  });
  it("rejects non-UUID", () => {
    expect(isUUID("ABC123")).toBe(false);
  });
});

describe("isShortCode", () => {
  it("recognizes valid short code", () => {
    expect(isShortCode("AB23")).toBe(true);
  });
  it("rejects short code with invalid chars", () => {
    expect(isShortCode("ABC0")).toBe(false); // 0 is excluded
  });
});
