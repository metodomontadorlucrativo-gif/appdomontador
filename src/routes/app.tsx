import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getSubscription } from "@/lib/billing.functions";
import { TrialBanner } from "@/components/TrialBanner";
import {
  BarChart3,
  Briefcase,
  Plus,
  Receipt,
  Trash2,
  TrendingUp,
  Wallet,
  CheckCircle2,
  LogIn,
  LogOut,
  Target,
  Calendar as CalendarIcon,
  Pencil,
} from "lucide-react";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  addWeeks,
  format,
  parseISO,
  isSameDay,
  eachDayOfInterval,
  getDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  EXPENSE_CATEGORIES,
  SERVICE_STATUSES,
  categoryMeta,
  formatBRL,
  type ExpenseCategory,
} from "@/lib/trena";
import { Logo } from "./index";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Dashboard — TRENA" },
      { name: "description", content: "Seu painel TRENA: acompanhe faturamento, despesas, metas e lucro em tempo real." },
      { property: "og:title", content: "Dashboard — TRENA" },
      { property: "og:description", content: "Acompanhe faturamento, despesas, metas e lucro em tempo real." },
      { property: "og:url", content: "https://appdomontador.lovable.app/app" },
      { name: "robots", content: "noindex, follow" },
    ],
    links: [{ rel: "canonical", href: "https://appdomontador.lovable.app/app" }],
  }),
  component: AppDashboard,
});

/* ----------------------------- Types & storage ---------------------------- */

type ServicePeriod = "day" | "week" | "month";

type Service = {
  id: string;
  client_name: string;
  service_type: string;
  agreed_price: number;
  received_price: number | null;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  /** ISO yyyy-MM-dd — data do serviço */
  date: string;
  /** balde de cobrança usado na projeção */
  period: ServicePeriod;
  scheduled_at: string | null;
  created_at: string;
};

type Expense = {
  id: string;
  amount: number;
  category: ExpenseCategory;
  description: string | null;
  occurred_at: string;
  created_at: string;
};

type Goals = { weekly: number; monthly: number };

const SERVICES_KEY = "trena.services.v1";
const EXPENSES_KEY = "trena.expenses.v1";
const GOALS_KEY = "trena.goals.v1";

function loadLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function saveLS<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}
const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const todayISO = () => format(new Date(), "yyyy-MM-dd");

const PERIOD_LABEL: Record<ServicePeriod, string> = {
  day: "Dia",
  week: "Semana",
  month: "Mês",
};

/** Garante data válida em serviços legados. */
function serviceDate(s: Service): Date {
  const d = s.date ?? s.scheduled_at ?? s.created_at;
  try {
    return typeof d === "string" && d.length === 10 ? parseISO(d) : new Date(d);
  } catch {
    return new Date(s.created_at);
  }
}

function servicePrice(s: Service): number {
  return Number(s.received_price ?? s.agreed_price ?? 0);
}

/* --------------------------------- Page ---------------------------------- */

type Tab = "dashboard" | "services" | "expenses";

function AppDashboard() {
  const { user, isAdmin, roleLoading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [services, setServices] = useState<Service[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [goals, setGoals] = useState<Goals>({ weekly: 0, monthly: 0 });
  const [hydrated, setHydrated] = useState(false);

  const fetchSub = useServerFn(getSubscription);
  const { data: sub } = useQuery({
    queryKey: ["subscription"],
    queryFn: () => fetchSub(),
    enabled: !!user,
  });

  // MODO BETA: acesso liberado para todos, sem bloqueio por trial/assinatura.
  void sub;
  void roleLoading;


  useEffect(() => {
    const raw = loadLS<Service[]>(SERVICES_KEY, []);
    // migrate legacy services without date/period
    const migrated = raw.map((s) => ({
      ...s,
      date: s.date ?? (s.scheduled_at?.slice(0, 10) || s.created_at.slice(0, 10)),
      period: s.period ?? "month",
    }));
    setServices(migrated);
    setExpenses(loadLS<Expense[]>(EXPENSES_KEY, []));
    setGoals(loadLS<Goals>(GOALS_KEY, { weekly: 0, monthly: 0 }));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveLS(SERVICES_KEY, services);
  }, [services, hydrated]);
  useEffect(() => {
    if (hydrated) saveLS(EXPENSES_KEY, expenses);
  }, [expenses, hydrated]);
  useEffect(() => {
    if (hydrated) saveLS(GOALS_KEY, goals);
  }, [goals, hydrated]);

  return (
    <div className="min-h-screen bg-secondary/30 pb-24">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <Logo size={32} />
            <span className="font-display text-lg font-bold uppercase">Trena</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full bg-brand/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-dark sm:inline">
              Beta grátis
            </span>


            {user ? (
              <>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-foreground hover:bg-brand-dark"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  to="/assinatura"
                  className="hidden items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted sm:inline-flex"
                >
                  Assinatura
                </Link>
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    navigate({ to: "/" });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                >
                  <LogOut className="size-3.5" /> Sair
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted"
              >
                <LogIn className="size-3.5" /> Entrar
              </Link>
            )}
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 sm:px-6">
          <TabButton active={tab === "dashboard"} onClick={() => setTab("dashboard")} icon={BarChart3}>
            Dashboard
          </TabButton>
          <TabButton active={tab === "services"} onClick={() => setTab("services")} icon={Briefcase}>
            Serviços
          </TabButton>
          <TabButton active={tab === "expenses"} onClick={() => setTab("expenses")} icon={Receipt}>
            Despesas
          </TabButton>
        </nav>
      </header>

      


      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {tab === "dashboard" && (
          <DashboardTab
            services={services}
            expenses={expenses}
            goals={goals}
            setGoals={setGoals}
          />
        )}
        {tab === "services" && (
          <ServicesTab services={services} setServices={setServices} />
        )}
        {tab === "expenses" && (
          <ExpensesTab expenses={expenses} setExpenses={setExpenses} />
        )}
      </main>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof BarChart3;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-1.5 whitespace-nowrap px-3 py-3 text-sm font-semibold transition-colors ${
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="size-4" />
      {children}
      {active && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand" />}
    </button>
  );
}

/* ------------------------------- Dashboard ------------------------------- */

function DashboardTab({
  services,
  expenses,
  goals,
  setGoals,
}: {
  services: Service[];
  expenses: Expense[];
  goals: Goals;
  setGoals: React.Dispatch<React.SetStateAction<Goals>>;
}) {
  const [editGoals, setEditGoals] = useState(false);

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const m = useMemo(() => {
    const inWeek = (s: Service) =>
      isWithinInterval(serviceDate(s), { start: weekStart, end: weekEnd });
    const inMonth = (s: Service) =>
      isWithinInterval(serviceDate(s), { start: monthStart, end: monthEnd });

    const realizedWeek = services
      .filter((s) => inWeek(s) && s.status === "completed")
      .reduce((a, s) => a + servicePrice(s), 0);
    const scheduledWeek = services
      .filter((s) => inWeek(s) && s.status === "scheduled")
      .reduce((a, s) => a + servicePrice(s), 0);

    const realizedMonth = services
      .filter((s) => inMonth(s) && s.status === "completed")
      .reduce((a, s) => a + servicePrice(s), 0);
    const scheduledMonth = services
      .filter((s) => inMonth(s) && s.status === "scheduled")
      .reduce((a, s) => a + servicePrice(s), 0);

    const expensesMonth = expenses
      .filter((e) => isWithinInterval(parseISO(e.occurred_at), { start: monthStart, end: monthEnd }))
      .reduce((a, e) => a + Number(e.amount), 0);

    const profit = realizedMonth - expensesMonth;
    const margin = realizedMonth > 0 ? (profit / realizedMonth) * 100 : 0;

    return {
      realizedWeek,
      projectedWeek: realizedWeek + scheduledWeek,
      scheduledWeek,
      realizedMonth,
      projectedMonth: realizedMonth + scheduledMonth,
      scheduledMonth,
      expensesMonth,
      profit,
      margin,
    };
  }, [services, expenses, weekStart.getTime(), weekEnd.getTime(), monthStart.getTime(), monthEnd.getTime()]);

  // Últimas 4 semanas (incluindo a atual)
  const weeklySeries = useMemo(() => {
    const weeks: { label: string; realized: number; projected: number }[] = [];
    for (let i = 3; i >= 0; i--) {
      const ref = addWeeks(now, -i);
      const ws = startOfWeek(ref, { weekStartsOn: 1 });
      const we = endOfWeek(ref, { weekStartsOn: 1 });
      const inRange = (s: Service) =>
        isWithinInterval(serviceDate(s), { start: ws, end: we });
      const realized = services
        .filter((s) => inRange(s) && s.status === "completed")
        .reduce((a, s) => a + servicePrice(s), 0);
      const scheduled = services
        .filter((s) => inRange(s) && s.status === "scheduled")
        .reduce((a, s) => a + servicePrice(s), 0);
      weeks.push({
        label: i === 0 ? "Esta sem." : `${format(ws, "dd/MM")}`,
        realized,
        projected: realized + scheduled,
      });
    }
    return weeks;
  }, [services]);

  // Séries diárias acumuladas (realizado) para sparkline das metas
  const weeklyDailySeries = useMemo(() => {
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    let acc = 0;
    return days.map((d) => {
      acc += services
        .filter(
          (s) => s.status === "completed" && isSameDay(serviceDate(s), d),
        )
        .reduce((a, s) => a + servicePrice(s), 0);
      return acc;
    });
  }, [services, weekStart.getTime(), weekEnd.getTime()]);

  const monthlyDailySeries = useMemo(() => {
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    let acc = 0;
    return days.map((d) => {
      acc += services
        .filter(
          (s) => s.status === "completed" && isSameDay(serviceDate(s), d),
        )
        .reduce((a, s) => a + servicePrice(s), 0);
      return acc;
    });
  }, [services, monthStart.getTime(), monthEnd.getTime()]);

  // Semanas anteriores (excluindo a atual) para histórico de metas
  const pastWeeks = useMemo(() => {
    const arr: {
      key: string;
      label: string;
      range: string;
      realized: number;
      scheduled: number;
      count: number;
    }[] = [];
    for (let i = 1; i <= 12; i++) {
      const ref = addWeeks(now, -i);
      const ws = startOfWeek(ref, { weekStartsOn: 1 });
      const we = endOfWeek(ref, { weekStartsOn: 1 });
      const inRange = (s: Service) =>
        isWithinInterval(serviceDate(s), { start: ws, end: we });
      const weekServices = services.filter(inRange);
      const realized = weekServices
        .filter((s) => s.status === "completed")
        .reduce((a, s) => a + servicePrice(s), 0);
      const scheduled = weekServices
        .filter((s) => s.status === "scheduled")
        .reduce((a, s) => a + servicePrice(s), 0);
      arr.push({
        key: format(ws, "yyyy-MM-dd"),
        label: `${format(ws, "dd/MM", { locale: ptBR })} – ${format(we, "dd/MM", { locale: ptBR })}`,
        range: `Semana ${format(ws, "w", { locale: ptBR })}`,
        realized,
        scheduled,
        count: weekServices.length,
      });
    }
    return arr;
  }, [services, weekStart.getTime()]);

  const todayWeeklyIdx = eachDayOfInterval({ start: weekStart, end: weekEnd }).findIndex(
    (d) => isSameDay(d, now),
  );
  const todayMonthlyIdx = eachDayOfInterval({ start: monthStart, end: monthEnd }).findIndex(
    (d) => isSameDay(d, now),
  );

  const maxWeekly = Math.max(1, ...weeklySeries.map((w) => Math.max(w.projected, goals.weekly)));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Visão geral</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Realizado vs projetado, baseado nos serviços agendados e concluídos.
          </p>
        </div>
        <button
          onClick={() => setEditGoals(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted"
        >
          <Pencil className="size-3.5" /> Editar metas
        </button>
      </div>

      {/* GOALS PROGRESS */}
      <div className="grid gap-3 lg:grid-cols-2">
        <GoalProgress
          title="Meta semanal"
          icon={<Target className="size-4" />}
          goal={goals.weekly}
          realized={m.realizedWeek}
          projected={m.projectedWeek}
          subtitle={`${format(weekStart, "dd/MM", { locale: ptBR })} – ${format(weekEnd, "dd/MM", { locale: ptBR })}`}
          onSet={() => setEditGoals(true)}
          series={weeklyDailySeries}
          todayIndex={todayWeeklyIdx}
        />
        <GoalProgress
          title="Meta mensal"
          icon={<Target className="size-4" />}
          goal={goals.monthly}
          realized={m.realizedMonth}
          projected={m.projectedMonth}
          subtitle={format(now, "MMMM 'de' yyyy", { locale: ptBR })}
          onSet={() => setEditGoals(true)}
          series={monthlyDailySeries}
          todayIndex={todayMonthlyIdx}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-3 rounded-sm bg-success" /> Realizado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-3 rounded-sm bg-brand/25" /> Projetado
        </span>
        <span className="flex items-center gap-1.5" aria-label="Projeção acima da meta" title="Projeção acima da meta">
          <span className="text-sm" role="img" aria-label="foguinho">🔥</span> Projeção acima da meta
        </span>
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="Realizado (mês)" value={formatBRL(m.realizedMonth)} icon={TrendingUp} tone="success" />
        <MetricCard label="Projetado (mês)" value={formatBRL(m.projectedMonth)} icon={BarChart3} tone="brand" />
        <MetricCard label="Despesas (mês)" value={formatBRL(m.expensesMonth)} icon={Wallet} tone="destructive" />
        <MetricCard
          label="Lucro / margem"
          value={`${formatBRL(m.profit)} · ${m.margin.toFixed(0)}%`}
          icon={CheckCircle2}
          tone={m.profit >= 0 ? "success" : "destructive"}
        />
      </div>

      {/* WEEKLY CHART + CALENDAR */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Últimas 4 semanas">
          <div className="flex h-48 items-end gap-3">
            {weeklySeries.map((w, i) => {
              const realPct = (w.realized / maxWeekly) * 100;
              const projPct = (w.projected / maxWeekly) * 100;
              const goalPct = goals.weekly > 0 ? (goals.weekly / maxWeekly) * 100 : 0;
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="text-[10px] font-bold text-muted-foreground">
                    {formatBRL(w.realized).replace("R$", "").trim()}
                  </div>
                  <div className="relative flex h-full w-full items-end overflow-hidden rounded-t-lg bg-muted/50">
                    {goalPct > 0 && (
                      <div
                        className="absolute inset-x-0 z-10 border-t-2 border-dashed border-brand/70"
                        style={{ bottom: `${goalPct}%` }}
                      />
                    )}
                    <div
                      className="absolute inset-x-0 bottom-0 bg-brand/25"
                      style={{ height: `${projPct}%` }}
                    />
                    <div
                      className="absolute inset-x-0 bottom-0 bg-success"
                      style={{ height: `${realPct}%` }}
                    />
                  </div>
                  <div className="text-[10px] font-semibold text-muted-foreground">{w.label}</div>
                </div>
              );
            })}
          </div>
          <Legend />
        </Panel>

        <Panel title={`Calendário · ${format(now, "MMMM", { locale: ptBR })}`}>
          <MiniCalendar services={services} monthStart={monthStart} monthEnd={monthEnd} />
        </Panel>
      </div>

      <PastWeeksPanel weeks={pastWeeks} goal={goals.weekly} />

      {editGoals && (
        <GoalsForm initial={goals} onClose={() => setEditGoals(false)} onSave={setGoals} />
      )}
    </div>
  );
}

function PastWeeksPanel({
  weeks,
  goal,
}: {
  weeks: {
    key: string;
    label: string;
    range: string;
    realized: number;
    scheduled: number;
    count: number;
  }[];
  goal: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? weeks : weeks.slice(0, 4);
  const hasAny = weeks.some((w) => w.count > 0);

  return (
    <Panel title="Metas de semanas anteriores">
      {!hasAny ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Ainda não há semanas anteriores com serviços registrados.
        </p>
      ) : (
        <>
          <ul className="divide-y divide-border">
            {visible.map((w) => {
              const pct = goal > 0 ? Math.min(100, (w.realized / goal) * 100) : 0;
              const diff = w.realized - goal;
              const hit = goal > 0 && w.realized >= goal;
              return (
                <li key={w.key} className="flex flex-col gap-1.5 py-3">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex flex-col">
                      <span className="font-semibold">{w.range}</span>
                      <span className="text-[11px] text-muted-foreground">{w.label}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-display text-sm font-bold">
                        {formatBRL(w.realized)}
                      </span>
                      {goal > 0 ? (
                        <span
                          className={`text-[11px] font-semibold ${
                            hit ? "text-success" : "text-muted-foreground"
                          }`}
                        >
                          {hit
                            ? `Meta batida 🎉 +${formatBRL(diff)}`
                            : `Faltou ${formatBRL(Math.abs(diff))}`}
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">
                          Sem meta definida
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="relative h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`absolute inset-y-0 left-0 rounded-full ${
                        hit ? "bg-success" : "bg-brand"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          {weeks.length > 4 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-3 w-full rounded-lg border border-border bg-background py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
            >
              {expanded ? "Mostrar menos" : `Ver todas (${weeks.length} semanas)`}
            </button>
          )}
        </>
      )}
    </Panel>
  );
}

function GoalProgress({
  title,
  icon,
  goal,
  realized,
  projected,
  subtitle,
  onSet,
  series,
  todayIndex,
}: {
  title: string;
  icon: React.ReactNode;
  goal: number;
  realized: number;
  projected: number;
  subtitle: string;
  onSet: () => void;
  series?: number[];
  todayIndex?: number;
}) {
  const hasGoal = goal > 0;
  const realPct = hasGoal ? Math.min(100, (realized / goal) * 100) : 0;
  const projPct = hasGoal ? Math.min(100, (projected / goal) * 100) : 0;
  const remaining = Math.max(0, goal - realized);
  const fromScheduled = Math.max(0, projected - realized);

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold">
            {icon} {title}
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">{subtitle}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Meta</div>
          <div className="font-display text-lg font-bold">{hasGoal ? formatBRL(goal) : "—"}</div>
        </div>
      </div>

      {!hasGoal ? (
        <button
          onClick={onSet}
          className="mt-4 w-full rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm font-semibold text-muted-foreground hover:bg-muted"
        >
          Defina sua meta para acompanhar o progresso →
        </button>
      ) : (
        <>
          <div
            className={[
              "mt-4 relative h-3 rounded-full bg-muted transition-shadow",
              projected > goal
                ? "ring-2 ring-warning/70 shadow-[0_0_12px_color-mix(in_oklab,var(--warning)_45%,transparent)]"
                : "",
            ].join(" ")}
          >
            <div className="absolute inset-y-0 left-0 overflow-hidden rounded-full">
              <div className="relative h-full" style={{ width: "100%" }}>
                <div className="absolute inset-y-0 left-0 bg-brand/25" style={{ width: `${projPct}%` }} />
                <div className="absolute inset-y-0 left-0 bg-success" style={{ width: `${realPct}%` }} />
              </div>
            </div>
            {projected > goal && (
              <span
                className="absolute -top-1 -translate-x-1/2 text-base leading-none animate-pulse"
                style={{ left: "100%" }}
                title={`Projeção ultrapassa a meta em ${formatBRL(projected - goal)}`}
                role="img"
                aria-label={`Projeção acima da meta em ${formatBRL(projected - goal)}`}
              >
                🔥
              </span>
            )}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <div>
              <div className="text-muted-foreground">Realizado</div>
              <div className="font-display text-sm font-bold text-success">{formatBRL(realized)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Projetado</div>
              <div className="font-display text-sm font-bold text-brand-dark">{formatBRL(projected)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">
                {remaining === 0 ? "Meta batida" : "Faltam"}
              </div>
              <div className="font-display text-sm font-bold">
                {remaining === 0 ? "🎉" : formatBRL(remaining)}
              </div>
            </div>
          </div>
          {series && series.length > 1 && (
            <GoalSparkline points={series} goal={goal} todayIndex={todayIndex ?? -1} />
          )}
          {fromScheduled > 0 && (
            <div className="mt-2 text-[11px] text-muted-foreground">
              {formatBRL(fromScheduled)} já agendados aguardando conclusão.
            </div>
          )}
        </>
      )}
    </section>
  );
}

function GoalSparkline({
  points,
  goal,
  todayIndex,
}: {
  points: number[];
  goal: number;
  todayIndex: number;
}) {
  const W = 100;
  const H = 28;
  const padY = 3;
  const max = Math.max(goal || 0, ...points, 1);
  const n = points.length;
  const x = (i: number) => (n === 1 ? 0 : (i / (n - 1)) * W);
  const y = (v: number) => H - padY - (v / max) * (H - padY * 2);

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(2)},${y(p).toFixed(2)}`).join(" ");
  const areaPath = `${linePath} L${x(n - 1).toFixed(2)},${H} L0,${H} Z`;
  const goalY = goal > 0 ? y(goal) : null;
  const gradId = `gp-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <div className="mt-3">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="h-7 w-full overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g className="text-brand">
          <path d={areaPath} fill={`url(#${gradId})`} />
          <path
            d={linePath}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          {goalY !== null && (
            <line
              x1="0"
              x2={W}
              y1={goalY}
              y2={goalY}
              stroke="currentColor"
              strokeOpacity="0.55"
              strokeWidth="1"
              strokeDasharray="2 2"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {todayIndex >= 0 && todayIndex < n && (
            <circle
              cx={x(todayIndex)}
              cy={y(points[todayIndex])}
              r="1.8"
              fill="currentColor"
            />
          )}
        </g>
      </svg>
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span className="inline-block size-3 rounded-sm bg-success" /> Realizado
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block size-3 rounded-sm bg-brand/25" /> Projetado
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-0 w-3 border-t-2 border-dashed border-brand/70" /> Meta
      </span>
    </div>
  );
}

function MiniCalendar({
  services,
  monthStart,
  monthEnd,
}: {
  services: Service[];
  monthStart: Date;
  monthEnd: Date;
}) {
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const leadingBlanks = (getDay(monthStart) + 6) % 7; // segunda = 0
  const cells: (Date | null)[] = [...Array(leadingBlanks).fill(null), ...days];

  const byDay = useMemo(() => {
    const map = new Map<string, { completed: number; scheduled: number; total: number }>();
    for (const s of services) {
      const d = format(serviceDate(s), "yyyy-MM-dd");
      const cur = map.get(d) ?? { completed: 0, scheduled: 0, total: 0 };
      const price = servicePrice(s);
      if (s.status === "completed") cur.completed += price;
      else if (s.status === "scheduled") cur.scheduled += price;
      cur.total += price;
      map.set(d, cur);
    }
    return map;
  }, [services]);

  const weekdays = ["S", "T", "Q", "Q", "S", "S", "D"];
  const today = new Date();

  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-muted-foreground">
        {weekdays.map((w, i) => (
          <div key={i}>{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const key = format(d, "yyyy-MM-dd");
          const info = byDay.get(key);
          const isToday = isSameDay(d, today);
          return (
            <div
              key={i}
              title={
                info
                  ? `${format(d, "dd/MM")} · ${formatBRL(info.total)}`
                  : format(d, "dd/MM")
              }
              className={`relative aspect-square rounded-md p-1 text-[11px] ${
                isToday ? "bg-brand/15 ring-1 ring-brand" : "bg-muted/30"
              }`}
            >
              <div className="font-semibold">{format(d, "d")}</div>
              {info && (
                <div className="absolute bottom-1 left-1 right-1 flex justify-end gap-0.5">
                  {info.completed > 0 && (
                    <span className="inline-block size-1.5 rounded-full bg-success" />
                  )}
                  {info.scheduled > 0 && (
                    <span className="inline-block size-1.5 rounded-full bg-brand" />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GoalsForm({
  initial,
  onClose,
  onSave,
}: {
  initial: Goals;
  onClose: () => void;
  onSave: (g: Goals) => void;
}) {
  const [weekly, setWeekly] = useState(String(initial.weekly || ""));
  const [monthly, setMonthly] = useState(String(initial.monthly || ""));
  // Aceita formatos: "10000", "10.000", "10,000", "10000.50", "10000,50", "10.000,50"
  const parseBR = (v: string) => {
    const s = v.trim();
    if (!s) return 0;
    const hasComma = s.includes(",");
    const hasDot = s.includes(".");
    let normalized = s;
    if (hasComma && hasDot) {
      // assume ponto = milhar, vírgula = decimal (pt-BR)
      normalized = s.replace(/\./g, "").replace(",", ".");
    } else if (hasComma) {
      // só vírgula: pode ser decimal ou milhar. Se tiver exatamente 3 dígitos após, milhar.
      const after = s.split(",")[1] ?? "";
      normalized = after.length === 3 ? s.replace(",", "") : s.replace(",", ".");
    } else if (hasDot) {
      // só ponto: se tiver exatamente 3 dígitos após, milhar (ex: 10.000)
      const after = s.split(".").pop() ?? "";
      const dots = (s.match(/\./g) ?? []).length;
      if (dots > 1 || after.length === 3) normalized = s.replace(/\./g, "");
    }
    const n = Number(normalized);
    return Number.isFinite(n) ? n : 0;
  };
  return (
    <Modal onClose={onClose} title="Suas metas de ganho">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ weekly: parseBR(weekly), monthly: parseBR(monthly) });
          onClose();
        }}
        className="space-y-4"
      >
        <Field label="Meta semanal (R$)">
          <input
            type="text"
            inputMode="decimal"
            value={weekly}
            onChange={(e) => setWeekly(e.target.value.replace(/[^\d.,]/g, ""))}
            placeholder="2500"
            className="input"
          />
        </Field>
        <Field label="Meta mensal (R$)">
          <input
            type="text"
            inputMode="decimal"
            value={monthly}
            onChange={(e) => setMonthly(e.target.value.replace(/[^\d.,]/g, ""))}
            placeholder="10000"
            className="input"
          />
        </Field>
        <FormActions onCancel={onClose} />
      </form>
    </Modal>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof BarChart3;
  tone: "default" | "success" | "destructive" | "brand";
}) {
  const toneClass =
    tone === "success"
      ? "text-success"
      : tone === "destructive"
        ? "text-destructive"
        : tone === "brand"
          ? "text-brand-dark"
          : "text-foreground";
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <Icon className={`size-4 ${toneClass}`} />
      </div>
      <div className={`mt-2 font-display text-lg font-bold leading-tight sm:text-xl ${toneClass}`}>
        {value}
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="mb-4 font-display text-base font-bold">{title}</h2>
      {children}
    </section>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

/* -------------------------------- Services -------------------------------- */

type ServiceFilter = "week" | "month" | "all";

function ServicesTab({
  services,
  setServices,
}: {
  services: Service[];
  setServices: React.Dispatch<React.SetStateAction<Service[]>>;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [filter, setFilter] = useState<ServiceFilter>("all");

  const now = new Date();
  const range =
    filter === "week"
      ? { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) }
      : filter === "month"
        ? { start: startOfMonth(now), end: endOfMonth(now) }
        : null;

  const filtered = services.filter((s) =>
    range ? isWithinInterval(serviceDate(s), range) : true,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Serviços</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cadastre cada montagem com data e período. Conclua para virar faturamento.
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-4" /> Novo
        </button>
      </div>

      <div className="flex gap-1 rounded-full border border-border bg-card p-1 text-xs font-semibold">
        {(["week", "month", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 rounded-full px-3 py-1.5 transition-colors ${
              filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {f === "week" ? "Esta semana" : f === "month" ? "Este mês" : "Todos"}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyHint>
          Nenhum serviço {filter !== "all" ? "no período" : "ainda"}. Clique em <strong>Novo</strong> para registrar.
        </EmptyHint>
      ) : (
        <ul className="space-y-2">
          {filtered
            .slice()
            .sort((a, b) => serviceDate(a).getTime() - serviceDate(b).getTime())
            .map((s) => {
              const status = SERVICE_STATUSES.find((x) => x.value === s.status)!;
              return (
                <li
                  key={s.id}
                  className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-base font-bold">{s.client_name}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${status.color}`}>
                        {status.label}
                      </span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                        {PERIOD_LABEL[s.period]}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <CalendarIcon className="size-3.5" />
                        {format(serviceDate(s), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                      <span>·</span>
                      <span>{s.service_type}</span>
                      <span>·</span>
                      <span className="font-semibold text-foreground">{formatBRL(servicePrice(s))}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.status !== "completed" && s.status !== "cancelled" && (
                      <button
                        onClick={() =>
                          setServices((prev) =>
                            prev.map((x) =>
                              x.id === s.id
                                ? {
                                    ...x,
                                    status: "completed",
                                    received_price: x.received_price ?? x.agreed_price,
                                  }
                                : x,
                            ),
                          )
                        }
                        className="inline-flex items-center gap-1 rounded-full border border-success/40 bg-success/10 px-3 py-1.5 text-xs font-semibold text-success hover:bg-success/20"
                      >
                        <CheckCircle2 className="size-3.5" /> Concluir
                      </button>
                    )}
                    <button
                      onClick={() => setEditing(s)}
                      className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary"
                      aria-label="Editar"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      onClick={() => setServices((p) => p.filter((x) => x.id !== s.id))}
                      className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Excluir"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </li>
              );
            })}
        </ul>
      )}

      {open && (
        <ServiceForm
          onClose={() => setOpen(false)}
          onSave={(s) => {
            setServices((p) => [s, ...p]);
            setOpen(false);
          }}
        />
      )}

      {editing && (
        <ServiceForm
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={(s) => {
            setServices((p) => p.map((x) => (x.id === s.id ? s : x)));
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function ServiceForm({
  onClose,
  onSave,
  initial,
}: {
  onClose: () => void;
  onSave: (s: Service) => void;
  initial?: Service;
}) {
  const [client, setClient] = useState(initial?.client_name ?? "");
  const [type, setType] = useState(initial?.service_type ?? "");
  const [price, setPrice] = useState(
    initial ? String(initial.agreed_price ?? "") : "",
  );
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [period, setPeriod] = useState<ServicePeriod>(initial?.period ?? "month");

  const valid = client.trim() && type.trim() && Number(price) > 0 && date;
  const isEdit = !!initial;

  return (
    <Modal onClose={onClose} title={isEdit ? "Editar serviço" : "Novo serviço"}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          onSave({
            id: initial?.id ?? uid(),
            client_name: client.trim(),
            service_type: type.trim(),
            agreed_price: Number(price),
            received_price: initial?.received_price ?? null,
            status: initial?.status ?? "scheduled",
            date,
            period,
            scheduled_at: new Date(date + "T08:00:00").toISOString(),
            created_at: initial?.created_at ?? new Date().toISOString(),
          });
        }}
        className="space-y-4"
      >
        <Field label="Cliente">
          <input
            value={client}
            onChange={(e) => setClient(e.target.value)}
            placeholder="Ex.: João Silva"
            className="input"
          />
        </Field>
        <Field label="Tipo de serviço">
          <input
            value={type}
            onChange={(e) => setType(e.target.value)}
            placeholder="Ex.: Montagem cozinha"
            className="input"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Data">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Período de cobrança">
            <div className="grid grid-cols-3 gap-1 rounded-md border border-border bg-card p-1 text-xs font-semibold">
              {(["day", "week", "month"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`rounded px-2 py-1.5 transition-colors ${
                    period === p
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {PERIOD_LABEL[p]}
                </button>
              ))}
            </div>
          </Field>
        </div>
        <Field label="Valor combinado (R$)">
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0,00"
            className="input"
          />
        </Field>
        <FormActions onCancel={onClose} disabled={!valid} />
      </form>
    </Modal>
  );
}

/* -------------------------------- Expenses ------------------------------- */

function ExpensesTab({
  expenses,
  setExpenses,
}: {
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Despesas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Combustível, materiais, ferramentas. Tudo entra no cálculo do lucro.
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-4" /> Nova
        </button>
      </div>

      {expenses.length === 0 ? (
        <EmptyHint>Nenhuma despesa ainda.</EmptyHint>
      ) : (
        <ul className="space-y-2">
          {expenses
            .slice()
            .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))
            .map((e) => {
              const meta = categoryMeta(e.category);
              return (
                <li
                  key={e.id}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
                >
                  <div
                    className="grid size-10 shrink-0 place-items-center rounded-xl text-lg"
                    style={{ background: `${meta.color}22`, color: meta.color }}
                  >
                    {meta.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-base font-bold">{meta.label}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {e.description || new Date(e.occurred_at).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                  <div className="font-display text-base font-bold text-destructive">
                    -{formatBRL(Number(e.amount))}
                  </div>
                  <button
                    onClick={() => {
                      setEditing(e);
                      setOpen(true);
                    }}
                    className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-brand/10 hover:text-brand-dark"
                    aria-label="Editar"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    onClick={() => setExpenses((p) => p.filter((x) => x.id !== e.id))}
                    className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Excluir"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              );
            })}
        </ul>
      )}

      {open && (
        <ExpenseForm
          initial={editing}
          onClose={() => {
            setOpen(false);
            setEditing(null);
          }}
          onSave={(e) => {
            setExpenses((p) => {
              const exists = p.some((x) => x.id === e.id);
              return exists ? p.map((x) => (x.id === e.id ? e : x)) : [e, ...p];
            });
            setOpen(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function ExpenseForm({
  initial,
  onClose,
  onSave,
}: {
  initial?: Expense | null;
  onClose: () => void;
  onSave: (e: Expense) => void;
}) {
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [category, setCategory] = useState<ExpenseCategory>(initial?.category ?? "combustivel");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [date, setDate] = useState(initial?.occurred_at ?? todayISO());

  const valid = Number(amount) > 0;

  return (
    <Modal onClose={onClose} title={initial ? "Editar despesa" : "Nova despesa"}>
      <form
        onSubmit={(ev) => {
          ev.preventDefault();
          if (!valid) return;
          onSave({
            id: initial?.id ?? uid(),
            amount: Number(amount),
            category,
            description: description.trim() || null,
            occurred_at: date,
            created_at: initial?.created_at ?? new Date().toISOString(),
          });
        }}

        className="space-y-4"
      >
        <Field label="Valor (R$)">
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
            className="input"
          />
        </Field>
        <Field label="Categoria">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {EXPENSE_CATEGORIES.map((c) => (
              <button
                type="button"
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-semibold transition-colors ${
                  category === c.value
                    ? "border-brand bg-brand/10 text-brand-dark"
                    : "border-border bg-card hover:bg-muted"
                }`}
              >
                <span className="text-lg">{c.icon}</span>
                {c.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Descrição (opcional)">
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex.: posto BR — viagem cliente"
            className="input"
          />
        </Field>
        <Field label="Data">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input"
          />
        </Field>
        <FormActions onCancel={onClose} disabled={!valid} />
      </form>
    </Modal>
  );
}

/* --------------------------------- Shared -------------------------------- */

function Modal({
  onClose,
  title,
  children,
}: {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div className="w-full max-w-md rounded-t-3xl border border-border bg-background p-5 sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-full px-2 py-1 text-sm text-muted-foreground hover:bg-muted"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function FormActions({ onCancel, disabled }: { onCancel: () => void; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-end gap-2 pt-2">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted"
      >
        Cancelar
      </button>
      <button
        type="submit"
        disabled={disabled}
        className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        Salvar
      </button>
    </div>
  );
}
