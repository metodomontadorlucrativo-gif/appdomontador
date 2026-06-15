import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "./index";
import { ShieldCheck, LogOut, Loader2, Users, CreditCard, Wrench } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — TRENA" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<{ users: number; trialing: number; paying: number } | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      const ok = !error && !!data;
      setIsAdmin(ok);
      setChecking(false);
      if (ok) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("subscription_status");
        if (profiles) {
          setStats({
            users: profiles.length,
            trialing: profiles.filter((p) => p.subscription_status === "trialing").length,
            paying: profiles.filter((p) => p.subscription_status === "active").length,
          });
        }
      }
    })();
  }, [user, loading, navigate]);

  if (loading || checking) {
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

        <div className="rounded-2xl border border-dashed border-border bg-background p-5 text-sm text-muted-foreground">
          Esta área é independente do app dos assinantes. Use-a para edições e
          testes sem afetar o ambiente dos usuários.
        </div>
      </main>
    </div>
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
