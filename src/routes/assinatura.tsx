import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Lock } from "lucide-react";
import { toast } from "sonner";
import { cancelSubscription, getSubscription } from "@/lib/billing.functions";
import { Logo } from "./index";

export const Route = createFileRoute("/assinatura")({
  head: () => ({
    meta: [
      { title: "Minha assinatura — TRENA" },
      { name: "description", content: "Gerencie sua assinatura TRENA: plano atual, período de teste, cobrança e cancelamento." },
      { property: "og:title", content: "Minha assinatura — TRENA" },
      { property: "og:description", content: "Gerencie plano, cobrança e cancelamento da sua assinatura TRENA." },
      { property: "og:url", content: "https://appdomontador.lovable.app/assinatura" },
      { name: "robots", content: "noindex, follow" },
    ],
    links: [{ rel: "canonical", href: "https://appdomontador.lovable.app/assinatura" }],
  }),
  component: SubscriptionPage,
});

const PLAN_LABEL: Record<string, string> = {
  trial: "Teste grátis",
  start: "Start",
  infinit: "Infinit",
  free: "Free",
};

const STATUS_LABEL: Record<string, string> = {
  trialing: "Em teste grátis",
  active: "Ativa",
  cancelled: "Cancelada",
  expired: "Expirada",
};

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function SubscriptionPage() {
  const fetchSub = useServerFn(getSubscription);
  const cancel = useServerFn(cancelSubscription);
  const qc = useQueryClient();
  const [pending, setPending] = useState(false);

  const { data: sub, isLoading } = useQuery({
    queryKey: ["subscription"],
    queryFn: () => fetchSub(),
  });

  async function handleCancel() {
    if (!confirm("Tem certeza que deseja cancelar sua assinatura?")) return;
    setPending(true);
    try {
      await cancel();
      toast.success("Assinatura cancelada.");
      await qc.invalidateQueries({ queryKey: ["subscription"] });
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao cancelar");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-screen bg-secondary/30 pb-20">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/app" className="flex items-center gap-2">
            <Logo size={32} />
            <span className="font-display text-lg font-bold uppercase">Trena</span>
          </Link>
          <Link
            to="/app"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Voltar
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-bold">Minha assinatura</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Acompanhe seu plano atual e gerencie sua assinatura.
        </p>

        {isLoading || !sub ? (
          <div className="mt-8 rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Carregando...
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            <section className="rounded-2xl border border-border bg-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Plano atual
                  </div>
                  <div className="mt-1 font-display text-2xl font-bold">
                    {PLAN_LABEL[sub.plan] ?? sub.plan}
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                    sub.status === "active"
                      ? "bg-success/15 text-success"
                      : sub.status === "trialing"
                        ? "bg-brand/15 text-brand-dark"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {STATUS_LABEL[sub.status] ?? sub.status}
                </span>
              </div>

              <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                {sub.status === "trialing" && (
                  <>
                    <Info label="Teste iniciado" value={fmtDate(sub.trial_started_at)} />
                    <Info
                      label="Teste termina em"
                      value={`${fmtDate(sub.trial_ends_at)} (${sub.days_left_trial} dia(s))`}
                    />
                  </>
                )}
                {sub.subscription_started_at && (
                  <Info
                    label="Assinatura iniciada em"
                    value={fmtDate(sub.subscription_started_at)}
                  />
                )}
                {sub.cancel_requested_at && (
                  <Info
                    label="Cancelada em"
                    value={fmtDate(sub.cancel_requested_at)}
                  />
                )}
              </dl>
            </section>

            {sub.status === "trialing" && (
              <Link
                to="/planos"
                className="block rounded-2xl bg-primary p-5 text-center text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Escolher um plano agora →
              </Link>
            )}

            {sub.status === "active" && (
              <section className="rounded-2xl border border-border bg-card p-6">
                <h2 className="font-display text-lg font-bold">Cancelar assinatura</h2>
                {sub.can_cancel ? (
                  <>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Você pode cancelar agora. O acesso continua até o fim do período pago.
                    </p>
                    <button
                      onClick={handleCancel}
                      disabled={pending}
                      className="mt-4 rounded-full border border-destructive bg-background px-5 py-2.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground disabled:opacity-60"
                    >
                      {pending ? "Cancelando..." : "Cancelar assinatura"}
                    </button>
                  </>
                ) : (
                  <div className="mt-3 flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4">
                    <Lock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div className="text-sm">
                      <div className="font-semibold">
                        Disponível após o 3º mês
                      </div>
                      <div className="mt-1 text-muted-foreground">
                        O plano Infinit tem compromisso mínimo de 3 meses. Faltam{" "}
                        <strong>{sub.days_until_cancel_allowed} dia(s)</strong> para liberar o
                        cancelamento.
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}

            {sub.status === "cancelled" && (
              <Link
                to="/planos"
                className="block rounded-2xl border border-border bg-card p-5 text-center text-sm font-semibold hover:bg-muted"
              >
                Reativar assinatura
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold">{value}</dd>
    </div>
  );
}
