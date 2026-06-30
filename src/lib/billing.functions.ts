import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PlanCode = "trial" | "start" | "infinit" | "free";
export type SubscriptionStatus = "trialing" | "active" | "cancelled" | "expired";

export type SubscriptionView = {
  plan: PlanCode;
  status: SubscriptionStatus;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  subscription_started_at: string | null;
  cancel_requested_at: string | null;
  days_left_trial: number;
  trial_expired: boolean;
  can_cancel: boolean;
  days_until_cancel_allowed: number;
};

function daysBetween(from: Date, to: Date): number {
  return Math.ceil((to.getTime() - from.getTime()) / 86400000);
}

function buildView(row: any): SubscriptionView {
  const now = new Date();
  const plan = (row?.plan ?? "trial") as PlanCode;
  const status = (row?.subscription_status ?? "trialing") as SubscriptionStatus;
  const trialEnd = row?.trial_ends_at ? new Date(row.trial_ends_at) : null;
  const subStart = row?.subscription_started_at
    ? new Date(row.subscription_started_at)
    : null;

  const days_left_trial =
    trialEnd && status === "trialing" ? Math.max(0, daysBetween(now, trialEnd)) : 0;
  const trial_expired =
    status === "trialing" && !!trialEnd && trialEnd.getTime() <= now.getTime();

  let can_cancel = false;
  let days_until_cancel_allowed = 0;
  if (status === "active") {
    if (plan === "start") {
      can_cancel = true;
    } else if (plan === "infinit" && subStart) {
      const unlockAt = new Date(subStart.getTime() + 90 * 86400000);
      if (now >= unlockAt) {
        can_cancel = true;
      } else {
        days_until_cancel_allowed = Math.max(1, daysBetween(now, unlockAt));
      }
    }
  }

  return {
    plan,
    status,
    trial_started_at: row?.trial_started_at ?? null,
    trial_ends_at: row?.trial_ends_at ?? null,
    subscription_started_at: row?.subscription_started_at ?? null,
    cancel_requested_at: row?.cancel_requested_at ?? null,
    days_left_trial,
    trial_expired,
    can_cancel,
    days_until_cancel_allowed,
  };
}

export const getSubscription = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SubscriptionView> => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "plan, subscription_status, trial_started_at, trial_ends_at, subscription_started_at, cancel_requested_at",
      )
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return buildView(data);
  });

export const subscribeToPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ plan: z.enum(["start", "infinit"]) }).parse(i),
  )
  .handler(async ({ context, data }): Promise<SubscriptionView> => {
    const { supabase, userId } = context;
    const { data: updated, error } = await supabase
      .from("profiles")
      .update({
        plan: data.plan,
        subscription_status: "active",
        subscription_started_at: new Date().toISOString(),
        cancel_requested_at: null,
      })
      .eq("id", userId)
      .select(
        "plan, subscription_status, trial_started_at, trial_ends_at, subscription_started_at, cancel_requested_at",
      )
      .single();
    if (error) throw new Error(error.message);
    return buildView(updated);
  });

export const cancelSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SubscriptionView> => {
    const { supabase, userId } = context;
    const { data: row, error: readErr } = await supabase
      .from("profiles")
      .select(
        "plan, subscription_status, trial_started_at, trial_ends_at, subscription_started_at, cancel_requested_at",
      )
      .eq("id", userId)
      .single();
    if (readErr) throw new Error(readErr.message);

    const view = buildView(row);
    if (!view.can_cancel) {
      throw new Error(
        view.plan === "infinit"
          ? `O plano Infinit só pode ser cancelado após o 3º mês. Faltam ${view.days_until_cancel_allowed} dia(s).`
          : "Não há assinatura ativa para cancelar.",
      );
    }

    const { data: updated, error } = await supabase
      .from("profiles")
      .update({
        subscription_status: "cancelled",
        cancel_requested_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select(
        "plan, subscription_status, trial_started_at, trial_ends_at, subscription_started_at, cancel_requested_at",
      )
      .single();
    if (error) throw new Error(error.message);
    return buildView(updated);
  });

export const extendTrial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SubscriptionView> => {
    const { supabase, userId } = context;
    const { data: row, error: readErr } = await supabase
      .from("profiles")
      .select(
        "plan, subscription_status, trial_started_at, trial_ends_at, subscription_started_at, cancel_requested_at, trial_extended_at",
      )
      .eq("id", userId)
      .single();
    if (readErr) throw new Error(readErr.message);

    if ((row as any)?.trial_extended_at) {
      throw new Error("Você já estendeu seu teste grátis. Escolha um plano para continuar.");
    }
    if (row?.subscription_status === "active" && (row?.plan === "start" || row?.plan === "infinit")) {
      throw new Error("Você já tem um plano ativo.");
    }

    const now = new Date();
    const currentEnd = row?.trial_ends_at ? new Date(row.trial_ends_at) : now;
    const base = currentEnd.getTime() > now.getTime() ? currentEnd : now;
    const newEnd = new Date(base.getTime() + 10 * 86400000);

    const { data: updated, error } = await supabase
      .from("profiles")
      .update({
        plan: "trial",
        subscription_status: "trialing",
        trial_ends_at: newEnd.toISOString(),
        trial_extended_at: now.toISOString(),
        cancel_requested_at: null,
      })
      .eq("id", userId)
      .select(
        "plan, subscription_status, trial_started_at, trial_ends_at, subscription_started_at, cancel_requested_at",
      )
      .single();
    if (error) throw new Error(error.message);
    return buildView(updated);
  });
