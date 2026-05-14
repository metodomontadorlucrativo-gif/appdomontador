/**
 * TRENA — gamification config (shared client + server)
 */

export const XP_PER_SERVICE = 10;
export const XP_PER_EXPENSE = 5;
export const XP_PER_STREAK_DAY = 20;
export const XP_PER_GOAL_HIT = 50;

export const LEVEL_TITLES = [
  "Aprendiz",
  "Montador",
  "Especialista",
  "Mestre",
  "Lenda",
] as const;

/** XP needed for a level: progressive curve. Level 1 starts at 0. */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round(100 * Math.pow(level - 1, 1.6));
}

export function levelFromXp(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return level;
}

export function levelTitle(level: number): string {
  const tier = Math.min(LEVEL_TITLES.length - 1, Math.floor((level - 1) / 10));
  const sub = ((level - 1) % 10) + 1;
  return `${LEVEL_TITLES[tier]} ${sub}`;
}

export function nextLevelInfo(xp: number) {
  const level = levelFromXp(xp);
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const xpInLevel = xp - currentLevelXp;
  const xpNeeded = nextLevelXp - currentLevelXp;
  const progressPct = xpNeeded > 0 ? Math.min(100, (xpInLevel / xpNeeded) * 100) : 100;
  return {
    level,
    title: levelTitle(level),
    xpInLevel,
    xpNeeded,
    progressPct,
    xpToNext: Math.max(0, nextLevelXp - xp),
  };
}

export const EXPENSE_CATEGORIES = [
  { value: "combustivel", label: "Combustível", icon: "⛽", color: "#F59E0B" },
  { value: "alimentacao", label: "Alimentação", icon: "🍔", color: "#EF4444" },
  { value: "ferramentas", label: "Ferramentas", icon: "🔧", color: "#3B82F6" },
  { value: "transporte", label: "Transporte", icon: "🚐", color: "#8B5CF6" },
  { value: "materiais", label: "Materiais", icon: "📦", color: "#10B981" },
  { value: "equipe", label: "Equipe", icon: "👷", color: "#EC4899" },
  { value: "outros", label: "Outros", icon: "📌", color: "#64748B" },
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number]["value"];

export function categoryMeta(value: string) {
  return (
    EXPENSE_CATEGORIES.find((c) => c.value === value) ?? EXPENSE_CATEGORIES[6]
  );
}

export const SERVICE_STATUSES = [
  { value: "scheduled", label: "Agendado", color: "bg-blue-100 text-blue-800" },
  { value: "in_progress", label: "Em andamento", color: "bg-amber-100 text-amber-800" },
  { value: "completed", label: "Concluído", color: "bg-emerald-100 text-emerald-800" },
  { value: "cancelled", label: "Cancelado", color: "bg-slate-100 text-slate-600" },
] as const;

export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value || 0);
}
