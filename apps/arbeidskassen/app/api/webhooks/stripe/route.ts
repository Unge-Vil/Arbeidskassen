import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@arbeidskassen/supabase";

let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-03-25.dahlia",
    });
  }
  return _stripe;
}

type PlanStatus = "active" | "trialing" | "past_due" | "canceled" | "unpaid";

function mapSubscriptionStatus(status: Stripe.Subscription.Status): PlanStatus {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    case "unpaid":
    case "incomplete":
    case "paused":
      return "unpaid";
    default:
      return "unpaid";
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const tenantId = session.metadata?.tenant_id;
  if (!tenantId) {
    console.error("checkout.session.completed: missing tenant_id in metadata");
    return;
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("tenants")
    .update({
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: session.subscription as string,
      plan_status: "active",
    })
    .eq("id", tenantId);

  if (error) {
    console.error("checkout.session.completed: failed to update tenant", error);
    return;
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const supabase = createAdminClient();

  const periodEnd = subscription.items?.data?.[0]?.current_period_end;
  const updatePayload: Record<string, unknown> = {
    plan_status: mapSubscriptionStatus(subscription.status),
  };

  if (periodEnd) {
    updatePayload.current_period_end = new Date(
      periodEnd * 1000,
    ).toISOString();
  }

  const { error } = await supabase
    .from("tenants")
    .update(updatePayload as never)
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    console.error(
      "customer.subscription.updated: failed to update tenant",
      error,
    );
    return;
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("tenants")
    .update({
      plan: "free",
      plan_status: "canceled",
      stripe_subscription_id: null,
    })
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    console.error(
      "customer.subscription.deleted: failed to update tenant",
      error,
    );
    return;
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer?.id;

  if (!customerId) return;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("tenants")
    .update({ plan_status: "past_due" })
    .eq("stripe_customer_id", customerId);

  if (error) {
    console.error("invoice.payment_failed: failed to update tenant", error);
    return;
  }
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(
          event.data.object as Stripe.Invoice,
        );
        break;

      case "invoice.payment_succeeded":
        // Acknowledged — no action needed beyond Stripe's own records
        break;

      default:
        console.log(`Unhandled Stripe event: ${event.type}`);
    }
  } catch (error) {
    console.error(`Stripe webhook handler error for ${event.type}:`, error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
