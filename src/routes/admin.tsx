import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  listFreeAccessEmails,
  addFreeAccessEmail,
  removeFreeAccessEmail,
} from "@/lib/admin.functions";
import { Logo } from "./index";
import {
  ShieldCheck,
  LogOut,
  Loader2,
  Users,
  CreditCard,
  Wrench,
  Mail,
  Plus,
  Trash2,
  Copy,
  Check,
  Gift,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — TRENA" },
      { name: "description", content: "Painel administrativo TRENA: gestão de usuários, planos e acesso gratuito." },
      { property: "og:title", content: "Admin — TRENA" },
      { property: "og:description", content: "Painel administrativo TRENA." },
      { property: "og:url", content: "https://appdomontador.lovable.app/admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "canonical", href: "https://appdomontador.lovable.app/admin" }],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user, loading, isAdmin, roleLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<{ users: number; trialing: number; paying: number } | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    if (!roleLoading && isAdmin) {
      supabase
        .from("profiles")
        .select("subscription_status")
        .then(({ data }) => {
          if (data) {
            setStats({
              users: data.length,
              trialing: data.filter((p) => p.subscription_status === "trialing").length,
              paying: data.filter((p) => p.subscription_status === "active").length,
            });
          }
        });
    }
  }, [user, loading, roleLoading, isAdmin, navigate]);

  if (loading || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <ShieldCheck className="size-12 text-muted-foreground" />
        <h1 className="font-display text-2xl font-bold">Acesso restrito</h1>
        <p className="text-sm text-muted-foreground">
          Esta área é exclusiva para administradores.
        </p>
        <Link
          to="/app"
          className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground"
        >
          Voltar ao app
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 pb-24">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <Logo size={32} />
            <span className="font-display text-lg font-bold uppercase">Trena</span>
            <span className="ml-2 rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-dark">
              Admin
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/app"
              className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted"
            >
              Ver app
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
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Painel administrativo</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Área para edições, testes e gestão. Logado como{" "}
            <span className="font-semibold text-foreground">{user?.email}</span>.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard icon={Users} label="Total de usuários" value={stats?.users ?? "—"} />
          <StatCard icon={Loader2} label="Em trial" value={stats?.trialing ?? "—"} />
          <StatCard icon={CreditCard} label="Assinantes ativos" value={stats?.paying ?? "—"} />
        </div>

        <FreeAccessSection />

        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-sm font-bold">
            <Wrench className="size-4" /> Ações rápidas
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link
              to="/planos"
              className="rounded-xl border border-border bg-background p-4 hover:bg-muted"
            >
              <div className="font-semibold">Página de planos</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Visualizar e testar a tela de assinatura.
              </div>
            </Link>
            <Link
              to="/assinatura"
              className="rounded-xl border border-border bg-background p-4 hover:bg-muted"
            >
              <div className="font-semibold">Gestão da assinatura</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Conferir status do plano atual.
              </div>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

/* -------------------- Free access (gratuitos) -------------------- */

function FreeAccessSection() {
  const list = useServerFn(listFreeAccessEmails);
  const add = useServerFn(addFreeAccessEmail);
  const remove = useServerFn(removeFreeAccessEmail);
  const qc = useQueryClient();

  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: emails, isLoading } = useQuery({
    queryKey: ["free-access-emails"],
    queryFn: () => list(),
  });

  const signupUrl =
    typeof window !== "undefined" ? `${window.location.origin}/signup` : "/signup";

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    try {
      await add({ data: { email, note: note || null } });
      toast.success("Email liberado para acesso gratuito");
      setEmail("");
      setNote("");
      qc.invalidateQueries({ queryKey: ["free-access-emails"] });
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao adicionar email");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(id: string) {
    if (!confirm("Remover este email da lista de acesso gratuito?")) return;
    try {
      await remove({ data: { id } });
      toast.success("Email removido");
      qc.invalidateQueries({ queryKey: ["free-access-emails"] });
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao remover");
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(signupUrl);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar");
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-sm font-bold">
        <Gift className="size-4 text-brand" /> Acesso gratuito ao TRENA
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Cadastre emails de usuários convidados. Quando eles se cadastrarem com o
        email autorizado, o TRENA será liberado <strong>sem cobrança de planos</strong>.
      </p>

      {/* Share link */}
      <div className="mt-4 flex flex-col gap-2 rounded-xl border border-dashed border-border bg-background p-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Link para compartilhar
          </div>
          <div className="truncate font-mono text-xs text-foreground">{signupUrl}</div>
        </div>
        <button
          onClick={copyLink}
          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-brand-foreground hover:bg-brand-dark"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copiado" : "Copiar link"}
        </button>
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="email"
            required
            placeholder="email@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand"
          />
        </div>
        <input
          type="text"
          placeholder="Observação (opcional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={200}
          className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-brand"
        />
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Adicionar
        </button>
      </form>

      {/* List */}
      <div className="mt-4 overflow-hidden rounded-xl border border-border">
        {isLoading ? (
          <div className="flex items-center justify-center p-6 text-sm text-muted-foreground">
            <Loader2 className="mr-2 size-4 animate-spin" /> Carregando…
          </div>
        ) : !emails || emails.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Nenhum email cadastrado ainda.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {emails.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{e.email}</div>
                  {e.note && (
                    <div className="truncate text-xs text-muted-foreground">{e.note}</div>
                  )}
                </div>
                <button
                  onClick={() => handleRemove(e.id)}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="size-3.5" /> Remover
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3.5" /> {label}
      </div>
      <div className="mt-2 font-display text-2xl font-bold">{value}</div>
    </div>
  );
}
