import { Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import type { SubscriptionView } from "@/lib/billing.functions";

export function TrialBanner({ sub }: { sub: SubscriptionView | null }) {
  if (!sub) return null;
  if (sub.status !== "trialing") return null;

  const expired = sub.trial_expired;
  const days = sub.days_left_trial;

  return (
    <div
      className={`border-b ${
        expired
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-brand/30 bg-brand/10 text-brand-dark"
      }`}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm sm:px-6">
        <div className="flex items-center gap-2 font-semibold">
          <Clock className="size-4" />
          {expired
            ? "Seu teste grátis terminou — escolha um plano para continuar."
            : days <= 1
              ? "Último dia do seu teste grátis!"
              : `Faltam ${days} dia(s) do seu teste grátis.`}
        </div>
        <Link
          to="/planos"
          className="rounded-full bg-foreground px-3 py-1 text-xs font-bold text-background hover:opacity-90"
        >
          Ver planos
        </Link>
      </div>
    </div>
  );
}
