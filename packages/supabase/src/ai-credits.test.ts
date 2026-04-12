import { describe, expect, it, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────────

const mockUser = { id: "user-1" };
let mockCreditRow: Record<string, unknown> | null = null;
let mockUpdateResult: { error: unknown } = { error: null };
let mockInsertResult: { error: unknown } = { error: null };

const mockSingle = vi.fn(() => ({
  data: mockCreditRow,
  error: mockCreditRow ? null : { message: "Not found" },
}));

const mockUpdateEq = vi.fn();
const mockUpdate = vi.fn();
const mockInsert = vi.fn(() => mockInsertResult);
const mockSelect = vi.fn(() => ({ single: mockSingle }));

vi.mock("./server", () => ({
  createServerClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => ({ data: { user: mockUser } })),
    },
    from: vi.fn((table: string) => {
      if (table === "ai_credit_transactions") {
        return { insert: mockInsert };
      }
      return {
        select: mockSelect,
        update: (...args: unknown[]) => {
          mockUpdate(...args);
          return {
            eq: (...eqArgs: unknown[]) => {
              mockUpdateEq(...eqArgs);
              return {
                eq: (...eq2Args: unknown[]) => {
                  mockUpdateEq(...eq2Args);
                  return mockUpdateResult;
                },
              };
            },
          };
        },
      };
    }),
  })),
}));

// Import after mocks
const { consumeCredits, addCredits, getCreditBalance } = await import(
  "./ai-credits"
);

// ── Tests ────────────────────────────────────────────────────────

describe("consumeCredits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreditRow = {
      id: "credit-1",
      tenant_id: "tenant-1",
      balance: 100,
      lifetime_used: 50,
    };
    mockUpdateResult = { error: null };
    mockInsertResult = { error: null };
  });

  it("rejects non-positive amounts", async () => {
    const result = await consumeCredits({ amount: 0, source: "test" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("positivt heltall");
    }
  });

  it("rejects non-integer amounts", async () => {
    const result = await consumeCredits({ amount: 2.5, source: "test" });
    expect(result.success).toBe(false);
  });

  it("rejects when balance is insufficient", async () => {
    mockCreditRow = { id: "c-1", tenant_id: "t-1", balance: 3, lifetime_used: 0 };
    const result = await consumeCredits({ amount: 5, source: "test" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Ikke nok credits");
    }
  });

  it("deducts credits and logs the transaction", async () => {
    const result = await consumeCredits({
      amount: 10,
      source: "estimate_generator",
      note: "Estimate for kitchen reno",
    });

    expect(result).toEqual({ success: true, balanceAfter: 90 });

    expect(mockUpdate).toHaveBeenCalledWith({
      balance: 90,
      lifetime_used: 60,
    });

    expect(mockInsert).toHaveBeenCalledWith({
      tenant_id: "tenant-1",
      credit_balance_id: "credit-1",
      kind: "usage",
      delta: -10,
      balance_after: 90,
      source: "estimate_generator",
      note: "Estimate for kitchen reno",
      created_by: "user-1",
    });
  });

  it("returns error when DB update fails", async () => {
    mockUpdateResult = { error: { message: "DB error" } };
    const result = await consumeCredits({ amount: 5, source: "test" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Prøv igjen");
    }
  });
});

describe("addCredits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreditRow = {
      id: "credit-1",
      tenant_id: "tenant-1",
      balance: 100,
      lifetime_purchased: 200,
    };
    mockUpdateResult = { error: null };
    mockInsertResult = { error: null };
    // For addCredits, the update chain only has one .eq()
    mockUpdateEq.mockReturnValue(mockUpdateResult);
  });

  it("rejects non-positive amounts", async () => {
    const result = await addCredits({
      amount: -1,
      kind: "purchase",
      source: "stripe",
    });
    expect(result.success).toBe(false);
  });

  it("adds credits for a purchase and updates lifetime_purchased", async () => {
    const result = await addCredits({
      amount: 50,
      kind: "purchase",
      source: "stripe_checkout",
    });

    expect(result).toEqual({ success: true, balanceAfter: 150 });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        balance: 150,
        lifetime_purchased: 250,
      }),
    );

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "purchase",
        delta: 50,
        balance_after: 150,
      }),
    );
  });

  it("does not update lifetime_purchased for refunds", async () => {
    const result = await addCredits({
      amount: 10,
      kind: "refund",
      source: "support",
    });

    expect(result).toEqual({ success: true, balanceAfter: 110 });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        balance: 110,
        lifetime_purchased: 200,
      }),
    );
  });
});

describe("getCreditBalance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreditRow = {
      balance: 42,
      lifetime_purchased: 100,
      lifetime_used: 58,
    };
  });

  it("returns the current balance", async () => {
    const result = await getCreditBalance();
    expect(result).toEqual({
      balance: 42,
      lifetimePurchased: 100,
      lifetimeUsed: 58,
    });
  });

  it("returns null when no credits exist", async () => {
    mockCreditRow = null;
    const result = await getCreditBalance();
    expect(result).toBeNull();
  });
});
