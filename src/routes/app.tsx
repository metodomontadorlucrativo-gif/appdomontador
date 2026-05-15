import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "./index";

export const Route = createFileRoute("/app")({
  head: () => ({ meta: [{ title: "Dashboard — TRENA" }] }),
  component: AppDashboard,
});

function AppDashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <Logo />
            <span className="font-display text-xl font-bold uppercase">Trena</span>
          </Link>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/" });
            }}
            className="rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold hover:bg-muted"
          >
            Sair
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-12">
        <h1 className="font-display text-3xl font-bold">Bem-vindo, {user.email}!</h1>
        <p className="mt-2 text-muted-foreground">
          Seu dashboard gamificado está sendo construído. Em breve: métricas, conquistas e desafios.
        </p>
      </main>
    </div>
  );
}
