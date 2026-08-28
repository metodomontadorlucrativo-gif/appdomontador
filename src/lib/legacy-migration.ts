/**
 * TRENA — migração única de dados legados do localStorage para o banco.
 * Roda no primeiro login de cada usuário/dispositivo após a exigência de autenticação.
 */
import { supabase } from "@/integrations/supabase/client";

const LEGACY_SERVICES_KEY = "trena.services.v1";
const LEGACY_EXPENSES_KEY = "trena.expenses.v1";
const LEGACY_GOALS_KEY = "trena.goals.v1";

const doneKey = (userId: string) => `trena.migrated.v1.${userId}`;

type AnyRecord = Record<string, unknown>;

function readJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function num(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function dateOnly(value: unknown): string | null {
  if (typeof value !== "string" || value.length < 10) return null;
  const iso = value.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : null;
}

const stagingKey = (userId: string) => `trena.migrating.v1.${userId}`;

type LegacyPayload = {
  services: AnyRecord[];
  expenses: AnyRecord[];
  goals: AnyRecord | null;
};

export function hasLegacyData(userId: string): boolean {
  if (typeof window === "undefined") return false;
  if (localStorage.getItem(stagingKey(userId))) return true; // tentativa anterior interrompida
  if (localStorage.getItem(doneKey(userId))) return false;
  return Boolean(
    localStorage.getItem(LEGACY_SERVICES_KEY) ||
      localStorage.getItem(LEGACY_EXPENSES_KEY) ||
      localStorage.getItem(LEGACY_GOALS_KEY),
  );
}

export type MigrationResult = { services: number; expenses: number; goals: number };

/**
 * Reivindica os dados legados de forma atômica: move as chaves antigas para uma
 * chave de staging deste usuário e marca a migração como feita imediatamente.
 * Assim, uma segunda execução (StrictMode, remontagem, novo login) não encontra
 * mais nada para migrar e não há como duplicar registros.
 */
function claimLegacyPayload(userId: string): LegacyPayload {
  const staged = readJSON<LegacyPayload>(stagingKey(userId));
  if (staged) return staged;

  const payload: LegacyPayload = {
    services: readJSON<AnyRecord[]>(LEGACY_SERVICES_KEY) ?? [],
    expenses: readJSON<AnyRecord[]>(LEGACY_EXPENSES_KEY) ?? [],
    goals: readJSON<AnyRecord>(LEGACY_GOALS_KEY),
  };
  localStorage.setItem(stagingKey(userId), JSON.stringify(payload));
  localStorage.setItem(doneKey(userId), new Date().toISOString());
  localStorage.removeItem(LEGACY_SERVICES_KEY);
  localStorage.removeItem(LEGACY_EXPENSES_KEY);
  localStorage.removeItem(LEGACY_GOALS_KEY);
  return payload;
}

// Impede que duas chamadas simultâneas (ex.: efeito disparado duas vezes) rodem em paralelo.
const inFlight = new Map<string, Promise<MigrationResult>>();

export function migrateLegacyData(userId: string): Promise<MigrationResult> {
  const running = inFlight.get(userId);
  if (running) return running;
  const promise = runMigration(userId).finally(() => inFlight.delete(userId));
  inFlight.set(userId, promise);
  return promise;
}

async function runMigration(userId: string): Promise<MigrationResult> {
  const result: MigrationResult = { services: 0, expenses: 0, goals: 0 };
  if (typeof window === "undefined") return result;

  const payload = claimLegacyPayload(userId);
  const legacyServices = payload.services ?? [];
  const legacyExpenses = payload.expenses ?? [];
  const legacyGoals = payload.goals;


  /* ------------------------------ Serviços ------------------------------ */
  if (Array.isArray(legacyServices) && legacyServices.length > 0) {
    const { data: existing, error } = await supabase
      .from("services")
      .select("client_name, service_type, agreed_price, scheduled_at");
    if (error) throw error;
    const seen = new Set(
      (existing ?? []).map(
        (row) =>
          `${row.client_name}|${row.service_type}|${num(row.agreed_price)}|${row.scheduled_at?.slice(0, 10) ?? ""}`,
      ),
    );

    const rows = legacyServices
      .map((item) => {
        const day = dateOnly(item.date) ?? dateOnly(item.scheduled_at) ?? dateOnly(item.created_at);
        const scheduledAt = day ? `${day}T12:00:00.000Z` : null;
        const status = ["scheduled", "in_progress", "completed", "cancelled"].includes(String(item.status))
          ? (item.status as "scheduled" | "in_progress" | "completed" | "cancelled")
          : "scheduled";
        const period = ["day", "week", "month"].includes(String(item.period))
          ? (item.period as "day" | "week" | "month")
          : "month";
        return {
          user_id: userId,
          client_name: String(item.client_name ?? "Cliente"),
          service_type: String(item.service_type ?? "Serviço"),
          agreed_price: num(item.agreed_price),
          received_price: item.received_price == null ? null : num(item.received_price),
          status,
          period,
          scheduled_at: scheduledAt,
          completed_at: status === "completed" ? scheduledAt : null,
        };
      })
      .filter((row) => {
        const key = `${row.client_name}|${row.service_type}|${row.agreed_price}|${row.scheduled_at?.slice(0, 10) ?? ""}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    if (rows.length > 0) {
      const { error: insertError } = await supabase.from("services").insert(rows);
      if (insertError) throw insertError;
      result.services = rows.length;
    }
  }

  /* ------------------------------ Despesas ------------------------------ */
  if (Array.isArray(legacyExpenses) && legacyExpenses.length > 0) {
    const { data: existing, error } = await supabase
      .from("expenses")
      .select("amount, category, description, occurred_at");
    if (error) throw error;
    const seen = new Set(
      (existing ?? []).map((row) => `${num(row.amount)}|${row.category}|${row.description ?? ""}|${row.occurred_at}`),
    );

    const valid = [
      "combustivel",
      "alimentacao",
      "ferramentas",
      "transporte",
      "materiais",
      "equipe",
      "outros",
    ] as const;

    const rows = legacyExpenses
      .map((item) => ({
        user_id: userId,
        amount: num(item.amount),
        category: (valid.includes(item.category as (typeof valid)[number])
          ? item.category
          : "outros") as (typeof valid)[number],
        description: item.description == null ? null : String(item.description),
        occurred_at: dateOnly(item.occurred_at) ?? dateOnly(item.created_at) ?? new Date().toISOString().slice(0, 10),
      }))
      .filter((row) => {
        const key = `${row.amount}|${row.category}|${row.description ?? ""}|${row.occurred_at}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    if (rows.length > 0) {
      const { error: insertError } = await supabase.from("expenses").insert(rows);
      if (insertError) throw insertError;
      result.expenses = rows.length;
    }
  }

  /* -------------------------------- Metas ------------------------------- */
  if (legacyGoals && (num(legacyGoals.weekly) > 0 || num(legacyGoals.monthly) > 0)) {
    const today = new Date().toISOString().slice(0, 10);
    const { data: existing, error } = await supabase
      .from("goals")
      .select("period")
      .eq("type", "revenue")
      .lte("starts_at", today)
      .gte("ends_at", today);
    if (error) throw error;
    const hasWeek = (existing ?? []).some((row) => row.period === "week");
    const hasMonth = (existing ?? []).some((row) => row.period === "month");

    const startOfWeek = new Date();
    const weekday = (startOfWeek.getDay() + 6) % 7;
    startOfWeek.setDate(startOfWeek.getDate() - weekday);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const iso = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    const rows = [];
    if (!hasWeek && num(legacyGoals.weekly) > 0) {
      rows.push({
        user_id: userId,
        type: "revenue" as const,
        period: "week" as const,
        target_value: num(legacyGoals.weekly),
        starts_at: iso(startOfWeek),
        ends_at: iso(endOfWeek),
      });
    }
    if (!hasMonth && num(legacyGoals.monthly) > 0) {
      rows.push({
        user_id: userId,
        type: "revenue" as const,
        period: "month" as const,
        target_value: num(legacyGoals.monthly),
        starts_at: iso(startOfMonth),
        ends_at: iso(endOfMonth),
      });
    }
    if (rows.length > 0) {
      const { error: insertError } = await supabase.from("goals").insert(rows);
      if (insertError) throw insertError;
      result.goals = rows.length;
    }
  }

  // Marca como concluída e limpa as chaves antigas deste dispositivo.
  localStorage.setItem(doneKey(userId), new Date().toISOString());
  localStorage.removeItem(LEGACY_SERVICES_KEY);
  localStorage.removeItem(LEGACY_EXPENSES_KEY);
  localStorage.removeItem(LEGACY_GOALS_KEY);

  return result;
}
