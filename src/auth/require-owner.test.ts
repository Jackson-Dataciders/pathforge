import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "./index";
import {
  requireOwner,
  UnauthorizedError,
  withOwner,
} from "./require-owner";

vi.mock("./index", () => ({ auth: vi.fn() }));

const mockedAuth = vi.mocked(auth as unknown as () => Promise<Session | null>);

function ownerSession(): Session {
  return {
    expires: "2099-01-01T00:00:00.000Z",
    user: { githubId: "12345", login: "owner" },
  };
}

describe("requireOwner", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the signed-in owner session", async () => {
    const session = ownerSession();
    mockedAuth.mockResolvedValue(session);

    await expect(requireOwner()).resolves.toBe(session);
  });

  it("throws UnauthorizedError without a session", async () => {
    mockedAuth.mockResolvedValue(null);

    await expect(requireOwner()).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("returns a 401 JSON response without a session", async () => {
    mockedAuth.mockResolvedValue(null);
    const handler = vi.fn(async () => new Response("ok"));

    const response = await withOwner(handler)();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "unauthorized" });
    expect(handler).not.toHaveBeenCalled();
  });
});