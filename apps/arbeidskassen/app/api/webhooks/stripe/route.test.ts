import { describe, expect, it, vi, beforeEach } from "vitest";
import type Stripe from "stripe";

// ── Mocks ────────────────────────────────────────────────────────

const mockUpdate = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockResolvedValue({ error: null });

vi.mock("@arbeidskassen/supabase", () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      update: (...args: unknown[]) => {
        mockUpdate(...args);
        return { eq: mockEq };
      },
    })),
  })),
}));

const mockConstructEvent = vi.fn();
vi.mock("stripe", () => {
  return {
    default: class StripeMock {
      webhooks = { constructEvent: mockConstructEvent };
    },
  };
});

// ── Import the handler after mocks are set up ────────────────────

const { POST } = await import(
  "../../../../app/api/webhooks/stripe/route"
);

// ── Helpers ──────────────────────────────────────────────────────

function makeRequest(body: string, signature: string | null) {
  const headers = new Headers();
  if (signature) headers.set("stripe-signature", signature);
  return new Request("https://example.com/api/webhooks/stripe", {
    method: "POST",
    body,
    headers,
  });
}

function makeStripeEvent(
  type: string,
  object: Record<string, unknown>,
): Stripe.Event {
  return {
    id: "evt_test",
    type,
    data: { object },
  } as unknown as Stripe.Event;
}

// ── Tests ────────────────────────────────────────────────────────

describe("Stripe webhook handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEq.mockResolvedValue({ error: null });
  });

  it("rejects requests without stripe-signature", async () => {
    const response = await POST(makeRequest("body", null));
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("Missing stripe-signature header");
  });

  it("rejects requests with invalid signature", async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    const response = await POST(makeRequest("body", "invalid-sig"));
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("Invalid signature");
  });

  it("handles checkout.session.completed — links Stripe to tenant", async () => {
    mockConstructEvent.mockReturnValue(
      makeStripeEvent("checkout.session.completed", {
        customer: "cus_123",
        subscription: "sub_456",
        metadata: { tenant_id: "tenant-abc" },
      }),
    );

    const response = await POST(makeRequest("body", "valid-sig"));
    expect(response.status).toBe(200);

    expect(mockUpdate).toHaveBeenCalledWith({
      stripe_customer_id: "cus_123",
      stripe_subscription_id: "sub_456",
      plan_status: "active",
    });
    expect(mockEq).toHaveBeenCalledWith("id", "tenant-abc");
  });

  it("handles checkout.session.completed — rejects missing tenant_id", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockConstructEvent.mockReturnValue(
      makeStripeEvent("checkout.session.completed", {
        customer: "cus_123",
        subscription: "sub_456",
        metadata: {},
      }),
    );

    const response = await POST(makeRequest("body", "valid-sig"));
    expect(response.status).toBe(200);
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("missing tenant_id"),
    );
    consoleSpy.mockRestore();
  });

  it("handles customer.subscription.updated — updates plan status", async () => {
    mockConstructEvent.mockReturnValue(
      makeStripeEvent("customer.subscription.updated", {
        id: "sub_456",
        status: "past_due",
        items: {
          data: [{ current_period_end: 1750000000 }],
        },
      }),
    );

    const response = await POST(makeRequest("body", "valid-sig"));
    expect(response.status).toBe(200);

    expect(mockUpdate).toHaveBeenCalledWith({
      plan_status: "past_due",
      current_period_end: new Date(1750000000 * 1000).toISOString(),
    });
    expect(mockEq).toHaveBeenCalledWith("stripe_subscription_id", "sub_456");
  });

  it("handles customer.subscription.deleted — downgrades to free", async () => {
    mockConstructEvent.mockReturnValue(
      makeStripeEvent("customer.subscription.deleted", {
        id: "sub_456",
        status: "canceled",
      }),
    );

    const response = await POST(makeRequest("body", "valid-sig"));
    expect(response.status).toBe(200);

    expect(mockUpdate).toHaveBeenCalledWith({
      plan: "free",
      plan_status: "canceled",
      stripe_subscription_id: null,
    });
    expect(mockEq).toHaveBeenCalledWith("stripe_subscription_id", "sub_456");
  });

  it("handles invoice.payment_failed — flags tenant as past_due", async () => {
    mockConstructEvent.mockReturnValue(
      makeStripeEvent("invoice.payment_failed", {
        customer: "cus_123",
      }),
    );

    const response = await POST(makeRequest("body", "valid-sig"));
    expect(response.status).toBe(200);

    expect(mockUpdate).toHaveBeenCalledWith({ plan_status: "past_due" });
    expect(mockEq).toHaveBeenCalledWith("stripe_customer_id", "cus_123");
  });

  it("handles invoice.payment_succeeded — acknowledges without DB writes", async () => {
    mockConstructEvent.mockReturnValue(
      makeStripeEvent("invoice.payment_succeeded", {
        customer: "cus_123",
      }),
    );

    const response = await POST(makeRequest("body", "valid-sig"));
    expect(response.status).toBe(200);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("acknowledges with 200 when a handler fails", async () => {
    mockEq.mockResolvedValue({ error: { message: "DB error" } });
    mockConstructEvent.mockReturnValue(
      makeStripeEvent("customer.subscription.deleted", {
        id: "sub_456",
        status: "canceled",
      }),
    );

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await POST(makeRequest("body", "valid-sig"));
    expect(response.status).toBe(200);
    consoleSpy.mockRestore();
  });

  it("acknowledges unknown event types with 200", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    mockConstructEvent.mockReturnValue(
      makeStripeEvent("some.unknown.event", {}),
    );

    const response = await POST(makeRequest("body", "valid-sig"));
    expect(response.status).toBe(200);
    expect(consoleSpy).toHaveBeenCalledWith(
      "Unhandled Stripe event: some.unknown.event",
    );
    consoleSpy.mockRestore();
  });
});
