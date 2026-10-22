import { afterEach, describe, expect, it, vi } from "vitest";
import { authConfig } from "./config";

const signIn = authConfig.callbacks.signIn;

describe("GitHub sign-in allowlist", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("allows the configured GitHub user id", () => {
    vi.stubEnv("ALLOWED_GITHUB_USER_ID", "12345");

    expect(signIn({ profile: { id: 12345 } } as never)).toBe(true);
  });

  it("rejects a different GitHub user id", () => {
    vi.stubEnv("ALLOWED_GITHUB_USER_ID", "12345");

    expect(signIn({ profile: { id: 67890 } } as never)).toBe(false);
  });

  it("rejects every user when the allowlist is not configured", () => {
    vi.stubEnv("ALLOWED_GITHUB_USER_ID", undefined);

    expect(signIn({ profile: { id: 12345 } } as never)).toBe(false);
  });
});