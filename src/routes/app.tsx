import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "./index";

export const Route = createFileRoute("/app")({
  head: () => ({ meta: [{ title: "Dashboard — TRENA" }] }),
  component: AppDashboard,
});

function AppDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <Logo />
            <span className="font-display text-xl font-bold uppercase">Trena</span>
          </Link>
          {user ? (
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/" });
              }}
              className="rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold hover:bg-muted"
            >
              Sair
            </button>
          ) : (
            <Link
              to="/login"
              className="rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold hover:bg-muted"
            >
              Entrar
            </Link>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-12">
        <h1 className="font-display text-3xl font-bold">
          Bem-vindo{user?.email ? `, ${user.email}` : ""}!
        </h1>
        <p className="mt-2 text-muted-foreground">
          Modo demonstração liberado. Explore livremente — em breve métricas, conquistas e desafios.
          {!user && " Faça login depois para salvar seu progresso."}
        </p>
      </main>
    </div>
  );
}
