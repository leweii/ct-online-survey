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
