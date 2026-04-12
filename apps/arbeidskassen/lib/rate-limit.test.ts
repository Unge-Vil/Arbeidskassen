import { describe, it, expect } from "vitest";
import { checkRateLimit } from "./rate-limit";

describe("rate limiter", () => {
  it("allows requests within the limit", () => {
    const config = { maxRequests: 3, windowMs: 60_000 };
    const key = "test-allow-" + Date.now();

    expect(checkRateLimit(key, config).allowed).toBe(true);
    expect(checkRateLimit(key, config).allowed).toBe(true);
    expect(checkRateLimit(key, config).allowed).toBe(true);
  });

  it("blocks requests exceeding the limit", () => {
    const config = { maxRequests: 2, windowMs: 60_000 };
    const key = "test-block-" + Date.now();

    expect(checkRateLimit(key, config).allowed).toBe(true);
    expect(checkRateLimit(key, config).allowed).toBe(true);

    const result = checkRateLimit(key, config);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it("tracks remaining count correctly", () => {
    const config = { maxRequests: 5, windowMs: 60_000 };
    const key = "test-remaining-" + Date.now();

    expect(checkRateLimit(key, config).remaining).toBe(4);
    expect(checkRateLimit(key, config).remaining).toBe(3);
    expect(checkRateLimit(key, config).remaining).toBe(2);
  });

  it("isolates different keys", () => {
    const config = { maxRequests: 1, windowMs: 60_000 };
    const keyA = "test-isolate-a-" + Date.now();
    const keyB = "test-isolate-b-" + Date.now();

    expect(checkRateLimit(keyA, config).allowed).toBe(true);
    expect(checkRateLimit(keyA, config).allowed).toBe(false);
    // keyB should still be allowed
    expect(checkRateLimit(keyB, config).allowed).toBe(true);
  });
});
