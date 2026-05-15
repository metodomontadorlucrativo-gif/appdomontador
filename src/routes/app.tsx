import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
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
  head: () => ({ meta: [{ title: "Dashboard — TRENA" }] }),
  component: AppDashboard,
});

/* ----------------------------- Types & storage ---------------------------- */

type Service = {
  id: string;
  client_name: string;
  service_type: string;
  agreed_price: number;
  received_price: number | null;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
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

const SERVICES_KEY = "trena.services.v1";
const EXPENSES_KEY = "trena.expenses.v1";

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

/* --------------------------------- Page ---------------------------------- */

type Tab = "dashboard" | "services" | "expenses";

function AppDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [services, setServices] = useState<Service[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setServices(loadLS<Service[]>(SERVICES_KEY, []));
    setExpenses(loadLS<Expense[]>(EXPENSES_KEY, []));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveLS(SERVICES_KEY, services);
  }, [services, hydrated]);
  useEffect(() => {
    if (hydrated) saveLS(EXPENSES_KEY, expenses);
  }, [expenses, hydrated]);

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
              Modo demo
            </span>
            {user ? (
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate({ to: "/" });
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted"
              >
                <LogOut className="size-3.5" /> Sair
              </button>
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
        {tab === "dashboard" && <DashboardTab services={services} expenses={expenses} />}
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

function DashboardTab({ services, expenses }: { services: Service[]; expenses: Expense[] }) {
  const m = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const completedThisMonth = services.filter(
      (s) => s.status === "completed" && new Date(s.created_at) >= monthStart,
    );
    const expensesThisMonth = expenses.filter(
      (e) => new Date(e.occurred_at) >= monthStart,
    );

    const revenue = completedThisMonth.reduce(
      (sum, s) => sum + Number(s.received_price ?? s.agreed_price ?? 0),
      0,
    );
    const totalExpenses = expensesThisMonth.reduce((sum, e) => sum + Number(e.amount ?? 0), 0);
    const profit = revenue - totalExpenses;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    const byCategory = new Map<string, number>();
    for (const e of expensesThisMonth) {
      byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + Number(e.amount));
    }

    return {
      revenue,
      expenses: totalExpenses,
      profit,
      margin,
      servicesCompleted: completedThisMonth.length,
      pendingServices: services.filter((s) => s.status !== "completed" && s.status !== "cancelled")
        .length,
      byCategory: Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1]),
    };
  }, [services, expenses]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Visão geral do mês</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Métricas calculadas a partir dos serviços concluídos e despesas registradas.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="Faturamento" value={formatBRL(m.revenue)} icon={TrendingUp} tone="default" />
        <MetricCard label="Despesas" value={formatBRL(m.expenses)} icon={Wallet} tone="destructive" />
        <MetricCard
          label="Lucro"
          value={formatBRL(m.profit)}
          icon={BarChart3}
          tone={m.profit >= 0 ? "success" : "destructive"}
        />
        <MetricCard
          label="Margem"
          value={`${m.margin.toFixed(0)}%`}
          icon={CheckCircle2}
          tone="brand"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Resumo de operações">
          <div className="grid grid-cols-2 gap-4">
            <Stat label="Serviços concluídos" value={String(m.servicesCompleted)} />
            <Stat label="Em aberto" value={String(m.pendingServices)} />
            <Stat label="Despesas registradas" value={String(expenses.length)} />
            <Stat label="Total de serviços" value={String(services.length)} />
          </div>
        </Panel>

        <Panel title="Despesas por categoria (mês)">
          {m.byCategory.length === 0 ? (
            <EmptyHint>Nenhuma despesa registrada neste mês.</EmptyHint>
          ) : (
            <ul className="space-y-2">
              {m.byCategory.map(([cat, amt]) => {
                const meta = categoryMeta(cat);
                const pct = m.expenses > 0 ? (amt / m.expenses) * 100 : 0;
                return (
                  <li key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 font-medium">
                        <span>{meta.icon}</span> {meta.label}
                      </span>
                      <span className="font-semibold">{formatBRL(amt)}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: meta.color }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </div>
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
      <div className={`mt-2 font-display text-xl font-bold leading-tight sm:text-2xl ${toneClass}`}>
        {value}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-display text-2xl font-bold">{value}</div>
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

function ServicesTab({
  services,
  setServices,
}: {
  services: Service[];
  setServices: React.Dispatch<React.SetStateAction<Service[]>>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Serviços</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cadastre cada montagem ou trabalho. Conclua para gerar faturamento.
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-4" /> Novo
        </button>
      </div>

      {services.length === 0 ? (
        <EmptyHint>
          Nenhum serviço ainda. Clique em <strong>Novo</strong> para registrar o primeiro.
        </EmptyHint>
      ) : (
        <ul className="space-y-2">
          {services
            .slice()
            .sort((a, b) => b.created_at.localeCompare(a.created_at))
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
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {s.service_type} · {formatBRL(Number(s.received_price ?? s.agreed_price))}
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
    </div>
  );
}

function ServiceForm({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (s: Service) => void;
}) {
  const [client, setClient] = useState("");
  const [type, setType] = useState("");
  const [price, setPrice] = useState("");

  const valid = client.trim() && type.trim() && Number(price) > 0;

  return (
    <Modal onClose={onClose} title="Novo serviço">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          onSave({
            id: uid(),
            client_name: client.trim(),
            service_type: type.trim(),
            agreed_price: Number(price),
            received_price: null,
            status: "scheduled",
            scheduled_at: null,
            created_at: new Date().toISOString(),
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
          onClick={() => setOpen(true)}
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
          onClose={() => setOpen(false)}
          onSave={(e) => {
            setExpenses((p) => [e, ...p]);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

function ExpenseForm({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (e: Expense) => void;
}) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("combustivel");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const valid = Number(amount) > 0;

  return (
    <Modal onClose={onClose} title="Nova despesa">
      <form
        onSubmit={(ev) => {
          ev.preventDefault();
          if (!valid) return;
          onSave({
            id: uid(),
            amount: Number(amount),
            category,
            description: description.trim() || null,
            occurred_at: date,
            created_at: new Date().toISOString(),
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
