import { createServerClient } from "./server";
import type { Database } from "./types";

type CreditTransactionKind =
  Database["public"]["Enums"]["credit_transaction_kind"];

type AiCreditRow = Database["public"]["Tables"]["ai_credits"]["Row"];

export type ConsumeCreditsInput = {
  amount: number;
  source: string;
  note?: string;
};

export type AddCreditsInput = {
  amount: number;
  kind: Extract<CreditTransactionKind, "purchase" | "manual_adjustment" | "refund">;
  source: string;
  note?: string;
};

export type CreditBalance = {
  balance: number;
  lifetimePurchased: number;
  lifetimeUsed: number;
};

export type CreditOperationResult =
  | { success: true; balanceAfter: number }
  | { success: false; error: string };

/**
 * Consume AI credits for the current tenant.
 *
 * Uses an optimistic-lock pattern to prevent concurrent overdraft.
 * The database CHECK constraint (balance >= 0) is the final safety net.
 */
export async function consumeCredits(
  input: ConsumeCreditsInput,
): Promise<CreditOperationResult> {
  if (input.amount <= 0 || !Number.isInteger(input.amount)) {
    return { success: false, error: "Antall credits må være et positivt heltall." };
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Du må være logget inn." };
  }

  // Fetch tenant's credit record (RLS scopes to current tenant)
  const { data: creditRow, error: fetchError } = await supabase
    .from("ai_credits")
    .select("id, tenant_id, balance, lifetime_used")
    .single();

  const credit = creditRow as Pick<
    AiCreditRow,
    "id" | "tenant_id" | "balance" | "lifetime_used"
  > | null;

  if (fetchError || !credit) {
    return { success: false, error: "Ingen kreditt-konto funnet for denne workspacen." };
  }

  if (credit.balance < input.amount) {
    return {
      success: false,
      error: `Ikke nok credits. Tilgjengelig: ${credit.balance}, påkrevd: ${input.amount}.`,
    };
  }

  const newBalance = credit.balance - input.amount;
  const newLifetimeUsed = credit.lifetime_used + input.amount;

  // Update balance
  const { error: updateError } = await supabase
    .from("ai_credits")
    .update({
      balance: newBalance,
      lifetime_used: newLifetimeUsed,
    } as never)
    .eq("id", credit.id)
    .eq("balance", credit.balance); // Optimistic lock — prevents concurrent overdraft

  if (updateError) {
    return {
      success: false,
      error: "Kunne ikke trekke credits. Prøv igjen.",
    };
  }

  // Log the transaction (non-fatal — credit was already deducted)
  const { error: txLogError } = await supabase.from("ai_credit_transactions").insert({
    tenant_id: credit.tenant_id,
    credit_balance_id: credit.id,
    kind: "usage",
    delta: -input.amount,
    balance_after: newBalance,
    source: input.source,
    note: input.note ?? null,
    created_by: user.id,
  } as never);

  if (txLogError) {
    console.error("Failed to log credit transaction:", txLogError);
  }

  return { success: true, balanceAfter: newBalance };
}

/**
 * Add credits to the current tenant (purchase, refund, or manual adjustment).
 *
 * Only callable by owner/admin (enforced by RLS UPDATE policy on ai_credits).
 */
export async function addCredits(
  input: AddCreditsInput,
): Promise<CreditOperationResult> {
  if (input.amount <= 0 || !Number.isInteger(input.amount)) {
    return { success: false, error: "Antall credits må være et positivt heltall." };
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Du må være logget inn." };
  }

  const { data: creditRow, error: fetchError } = await supabase
    .from("ai_credits")
    .select("id, tenant_id, balance, lifetime_purchased")
    .single();

  const credit = creditRow as Pick<
    AiCreditRow,
    "id" | "tenant_id" | "balance" | "lifetime_purchased"
  > | null;

  if (fetchError || !credit) {
    return { success: false, error: "Ingen kreditt-konto funnet for denne workspacen." };
  }

  const newBalance = credit.balance + input.amount;
  const newLifetimePurchased =
    input.kind === "purchase"
      ? credit.lifetime_purchased + input.amount
      : credit.lifetime_purchased;

  const updatePayload: Partial<AiCreditRow> = {
    balance: newBalance,
    lifetime_purchased: newLifetimePurchased,
  };

  if (input.kind === "purchase") {
    updatePayload.last_refilled_at = new Date().toISOString();
  }

  const { error: updateError } = await supabase
    .from("ai_credits")
    .update(updatePayload as never)
    .eq("id", credit.id);

  if (updateError) {
    return {
      success: false,
      error: "Kunne ikke legge til credits. Sjekk tilgangene dine.",
    };
  }

  // Log the transaction (non-fatal — credits already added)
  const { error: txLogError } = await supabase.from("ai_credit_transactions").insert({
    tenant_id: credit.tenant_id,
    credit_balance_id: credit.id,
    kind: input.kind,
    delta: input.amount,
    balance_after: newBalance,
    source: input.source,
    note: input.note ?? null,
    created_by: user.id,
  } as never);

  if (txLogError) {
    console.error("Failed to log credit transaction:", txLogError);
  }

  return { success: true, balanceAfter: newBalance };
}

/**
 * Get the current tenant's credit balance.
 */
export async function getCreditBalance(): Promise<CreditBalance | null> {
  const supabase = await createServerClient();

  const { data: row, error } = await supabase
    .from("ai_credits")
    .select("balance, lifetime_purchased, lifetime_used")
    .single();

  const data = row as Pick<
    AiCreditRow,
    "balance" | "lifetime_purchased" | "lifetime_used"
  > | null;

  if (error || !data) {
    return null;
  }

  return {
    balance: data.balance,
    lifetimePurchased: data.lifetime_purchased,
    lifetimeUsed: data.lifetime_used,
  };
}
