import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { levelFromXp } from "./trena";

/* ------------------------------- profile ------------------------------- */

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        full_name: z.string().trim().min(1).max(100).optional(),
        business_name: z.string().trim().max(100).optional().nullable(),
        profession_type: z.string().trim().max(60).optional().nullable(),
        monthly_goal: z.number().min(0).max(10_000_000).optional(),
        onboarding_completed: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: updated, error } = await supabase
      .from("profiles")
      .update(data)
      .eq("id", userId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return updated;
  });

/* ------------------------------- helpers ------------------------------ */

async function awardXp(
  supabase: any,
  userId: string,
  amount: number,
): Promise<{ leveledUp: boolean; newLevel: number; newXp: number }> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("xp, level")
    .eq("id", userId)
    .single();

  const oldLevel = profile?.level ?? 1;
  const newXp = (profile?.xp ?? 0) + amount;
  const newLevel = levelFromXp(newXp);

  await supabase
    .from("profiles")
    .update({ xp: newXp, level: newLevel })
    .eq("id", userId);

  return { leveledUp: newLevel > oldLevel, newLevel, newXp };
}

async function updateStreak(supabase: any, userId: string): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  const { data: profile } = await supabase
    .from("profiles")
    .select("last_activity_date, current_streak_days")
    .eq("id", userId)
    .single();

  if (profile?.last_activity_date === today) {
    return profile.current_streak_days ?? 0;
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const newStreak =
    profile?.last_activity_date === yesterday
      ? (profile.current_streak_days ?? 0) + 1
      : 1;

  await supabase
    .from("profiles")
    .update({ last_activity_date: today, current_streak_days: newStreak })
    .eq("id", userId);

  return newStreak;
}

async function tryUnlock(
  supabase: any,
  userId: string,
  code: string,
): Promise<{ unlocked: boolean; xp: number; title?: string; icon?: string }> {
  const { data: existing } = await supabase
    .from("user_achievements")
    .select("id")
    .eq("user_id", userId)
    .eq("achievement_code", code)
    .maybeSingle();
  if (existing) return { unlocked: false, xp: 0 };

  const { data: ach } = await supabase
    .from("achievements_catalog")
    .select("xp_reward, title, icon")
    .eq("code", code)
    .single();
  if (!ach) return { unlocked: false, xp: 0 };

  const { error } = await supabase
    .from("user_achievements")
    .insert({ user_id: userId, achievement_code: code });
  if (error) return { unlocked: false, xp: 0 };

  if (ach.xp_reward > 0) await awardXp(supabase, userId, ach.xp_reward);
  return { unlocked: true, xp: ach.xp_reward, title: ach.title, icon: ach.icon };
}

async function checkAchievements(
  supabase: any,
  userId: string,
): Promise<Array<{ code: string; title: string; icon: string; xp: number }>> {
  const unlocked: Array<{ code: string; title: string; icon: string; xp: number }> = [];

  const [{ count: completedServices }, { count: totalExpenses }, { data: profile }] =
    await Promise.all([
      supabase
        .from("services")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "completed"),
      supabase
        .from("expenses")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase.from("profiles").select("xp, current_streak_days, level").eq("id", userId).single(),
    ]);

  const { data: revRow } = await supabase
    .from("services")
    .select("received_price")
    .eq("user_id", userId)
    .eq("status", "completed");
  const totalRevenue = (revRow ?? []).reduce(
    (s: number, r: any) => s + Number(r.received_price ?? 0),
    0,
  );

  const candidates: Array<[string, boolean]> = [
    ["first_measure", (completedServices ?? 0) >= 1],
    ["first_expense", (totalExpenses ?? 0) >= 1],
    ["first_thousand", totalRevenue >= 1000],
    ["first_five_thousand", totalRevenue >= 5000],
    ["streak_3", (profile?.current_streak_days ?? 0) >= 3],
    ["streak_7", (profile?.current_streak_days ?? 0) >= 7],
    ["streak_30", (profile?.current_streak_days ?? 0) >= 30],
    ["ten_services", (completedServices ?? 0) >= 10],
    ["fifty_services", (completedServices ?? 0) >= 50],
    ["expense_tracker", (totalExpenses ?? 0) >= 20],
    ["level_5", (profile?.level ?? 1) >= 5],
    ["level_10", (profile?.level ?? 1) >= 10],
  ];

  for (const [code, ok] of candidates) {
    if (!ok) continue;
    const r = await tryUnlock(supabase, userId, code);
    if (r.unlocked) unlocked.push({ code, title: r.title!, icon: r.icon!, xp: r.xp });
  }

  return unlocked;
}

/* ------------------------------- services ----------------------------- */

export const listServices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("user_id", userId)
      .order("scheduled_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const ServiceInputSchema = z.object({
  client_name: z.string().trim().min(1).max(100),
  service_type: z.string().trim().min(1).max(100),
  scheduled_at: z.string().nullable().optional(),
  agreed_price: z.number().min(0).max(10_000_000),
  address: z.string().trim().max(255).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]).optional(),
});

export const createService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ServiceInputSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: created, error } = await supabase
      .from("services")
      .insert({ ...data, user_id: userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return created;
  });

export const updateService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        patch: ServiceInputSchema.partial(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: updated, error } = await supabase
      .from("services")
      .update(data.patch)
      .eq("id", data.id)
      .eq("user_id", userId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return updated;
  });

export const deleteService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const completeService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        received_price: z.number().min(0).max(10_000_000),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("services")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        received_price: data.received_price,
      })
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);

    const xpResult = await awardXp(supabase, userId, 10);
    await updateStreak(supabase, userId);
    const newAchievements = await checkAchievements(supabase, userId);

    return {
      xpGained: 10,
      leveledUp: xpResult.leveledUp,
      newLevel: xpResult.newLevel,
      newAchievements,
    };
  });

/* ------------------------------- expenses ----------------------------- */

export const listExpenses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", userId)
      .order("occurred_at", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const ExpenseInputSchema = z.object({
  amount: z.number().min(0.01).max(10_000_000),
  category: z.enum([
    "combustivel",
    "alimentacao",
    "ferramentas",
    "transporte",
    "materiais",
    "equipe",
    "outros",
  ]),
  description: z.string().trim().max(500).optional().nullable(),
  occurred_at: z.string(),
});

export const createExpense = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ExpenseInputSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: created, error } = await supabase
      .from("expenses")
      .insert({ ...data, user_id: userId })
      .select()
      .single();
    if (error) throw new Error(error.message);

    const xpResult = await awardXp(supabase, userId, 5);
    await updateStreak(supabase, userId);
    const newAchievements = await checkAchievements(supabase, userId);

    return {
      expense: created,
      xpGained: 5,
      leveledUp: xpResult.leveledUp,
      newLevel: xpResult.newLevel,
      newAchievements,
    };
  });

export const deleteExpense = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------------------- dashboard ---------------------------- */

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000)
      .toISOString()
      .slice(0, 10);

    const [profileR, monthServicesR, monthExpensesR, recentServicesR, recentExpensesR] =
      await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        supabase
          .from("services")
          .select("received_price, completed_at")
          .eq("user_id", userId)
          .eq("status", "completed")
          .gte("completed_at", monthStart),
        supabase
          .from("expenses")
          .select("amount, category, occurred_at")
          .eq("user_id", userId)
          .gte("occurred_at", monthStart.slice(0, 10)),
        supabase
          .from("services")
          .select("received_price, completed_at")
          .eq("user_id", userId)
          .eq("status", "completed")
          .gte("completed_at", new Date(now.getTime() - 30 * 86400000).toISOString())
          .order("completed_at", { ascending: true }),
        supabase
          .from("expenses")
          .select("amount, occurred_at")
          .eq("user_id", userId)
          .gte("occurred_at", thirtyDaysAgo)
          .order("occurred_at", { ascending: true }),
      ]);

    const revenue = (monthServicesR.data ?? []).reduce(
      (s, r: any) => s + Number(r.received_price ?? 0),
      0,
    );
    const expensesTotal = (monthExpensesR.data ?? []).reduce(
      (s, r: any) => s + Number(r.amount ?? 0),
      0,
    );
    const profit = revenue - expensesTotal;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    // Daily series (30 days)
    const dailyMap = new Map<string, { date: string; revenue: number; expenses: number }>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000).toISOString().slice(0, 10);
      dailyMap.set(d, { date: d, revenue: 0, expenses: 0 });
    }
    for (const s of recentServicesR.data ?? []) {
      const d = (s as any).completed_at?.slice(0, 10);
      const entry = dailyMap.get(d);
      if (entry) entry.revenue += Number((s as any).received_price ?? 0);
    }
    for (const e of recentExpensesR.data ?? []) {
      const d = (e as any).occurred_at?.slice(0, 10);
      const entry = dailyMap.get(d);
      if (entry) entry.expenses += Number((e as any).amount ?? 0);
    }
    const dailySeries = Array.from(dailyMap.values());

    // Category breakdown
    const categoryMap = new Map<string, number>();
    for (const e of monthExpensesR.data ?? []) {
      const cat = (e as any).category as string;
      categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + Number((e as any).amount ?? 0));
    }
    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, amount]) => ({
      category,
      amount,
    }));

    return {
      profile: profileR.data,
      metrics: {
        revenue,
        expenses: expensesTotal,
        profit,
        margin,
        servicesCompleted: monthServicesR.data?.length ?? 0,
      },
      dailySeries,
      categoryBreakdown,
    };
  });

/* ----------------------------- achievements --------------------------- */

export const getAchievementsView = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [catalog, unlocked] = await Promise.all([
      supabase.from("achievements_catalog").select("*").order("sort_order"),
      supabase.from("user_achievements").select("achievement_code, unlocked_at").eq("user_id", userId),
    ]);
    if (catalog.error) throw new Error(catalog.error.message);
    const unlockedMap = new Map(
      (unlocked.data ?? []).map((u: any) => [u.achievement_code, u.unlocked_at]),
    );
    return (catalog.data ?? []).map((a: any) => ({
      ...a,
      unlocked: unlockedMap.has(a.code),
      unlocked_at: unlockedMap.get(a.code) ?? null,
    }));
  });

/* --------------------------------- goals ------------------------------ */

export const listGoals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .order("ends_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        type: z.enum(["revenue", "profit", "services_count"]),
        target_value: z.number().min(1).max(10_000_000),
        period: z.enum(["week", "month"]),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const now = new Date();
    let starts: Date, ends: Date;
    if (data.period === "month") {
      starts = new Date(now.getFullYear(), now.getMonth(), 1);
      ends = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else {
      const day = now.getDay();
      starts = new Date(now);
      starts.setDate(now.getDate() - day);
      ends = new Date(starts);
      ends.setDate(starts.getDate() + 6);
    }
    const { data: created, error } = await supabase
      .from("goals")
      .insert({
        user_id: userId,
        type: data.type,
        target_value: data.target_value,
        period: data.period,
        starts_at: starts.toISOString().slice(0, 10),
        ends_at: ends.toISOString().slice(0, 10),
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return created;
  });

export const deleteGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("goals")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
