import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, ArrowLeft, Sparkles, Infinity as InfinityIcon, ShieldCheck, Gift } from "lucide-react";
import { toast } from "sonner";
import { getSubscription, subscribeToPlan, extendTrial } from "@/lib/billing.functions";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "./index";

export const Route = createFileRoute("/planos")({
  head: () => ({
    meta: [
      { title: "Planos — TRENA" },
      {
        name: "description",
        content:
          "Escolha o plano que se encaixa no seu momento: Start a partir de R$ 27,90 ou Infinit R$ 19,90.",
      },
    ],
  }),
  component: PlansPage,
});

const PLAN_FEATURES = [
  "Dashboard de lucro real",
  "Gestão ilimitada de serviços e despesas",
  "Metas semanais e mensais",
  "Sistema de XP, níveis e conquistas",
];

function PlansPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { isAdmin } = useAuth();
  const fetchSub = useServerFn(getSubscription);
  const subscribe = useServerFn(subscribeToPlan);
  const extend = useServerFn(extendTrial);
  const [pending, setPending] = useState<"start" | "infinit" | null>(null);
  const [extending, setExtending] = useState(false);

  const { data: sub } = useQuery({
    queryKey: ["subscription"],
    queryFn: () => fetchSub(),
  });

  async function handleSubscribe(plan: "start" | "infinit") {
    setPending(plan);
    try {
      await subscribe({ data: { plan } });
      toast.success(
        plan === "start"
          ? "Plano Start ativado! (cobrança real em breve)"
          : "Plano Infinit ativado! (cobrança real em breve)",
      );
      await qc.invalidateQueries({ queryKey: ["subscription"] });
      navigate({ to: "/assinatura" });
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao ativar plano");
    } finally {
      setPending(null);
    }
  }

  const trialExpired = sub?.trial_expired;

  return (
    <div className="min-h-screen bg-secondary/30 pb-20">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/app" className="flex items-center gap-2">
            <Logo size={32} />
            <span className="font-display text-lg font-bold uppercase">Trena</span>
          </Link>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-foreground hover:bg-brand-dark"
              >
                <ShieldCheck className="size-3.5" /> Admin
              </Link>
            )}
            <Link
              to="/app"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" /> Voltar
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {trialExpired && (
          <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-semibold text-destructive">
            Seu teste grátis terminou. Escolha um plano para continuar usando o TRENA.
          </div>
        )}

        <div className="mx-auto max-w-2xl text-center">
          <span className="rounded-full bg-brand/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-dark">
            Planos
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
            Escolha o plano que combina com você
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Sem fidelidade no Start. Infinit tem compromisso mínimo de 3 meses para travar o
            preço promocional.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <PlanCard
            name="Start"
            icon={<Sparkles className="size-5" />}
            tagline="Para começar com calma"
            price="R$ 27,90"
            priceSuffix="/mês"
            badge="Promo 3 meses"
            description="Pague R$ 27,90/mês nos 3 primeiros meses. Após esse período, R$ 49,90/mês. Cancele quando quiser."
            features={PLAN_FEATURES}
            ctaLabel={pending === "start" ? "Ativando..." : "Assinar Start"}
            onClick={() => handleSubscribe("start")}
            highlight={false}
            disabled={!!pending}
            currentPlan={sub?.plan === "start" && sub.status === "active"}
          />
          <PlanCard
            name="Infinit"
            icon={<InfinityIcon className="size-5" />}
            tagline="Mais barato no longo prazo"
            price="R$ 19,90"
            priceSuffix="/mês"
            badge="Melhor custo · 3 meses mínimo"
            description="R$ 19,90/mês para sempre. Compromisso mínimo de 3 meses — só pode ser cancelado a partir do 4º mês."
            features={[...PLAN_FEATURES, "Preço travado para sempre"]}
            ctaLabel={pending === "infinit" ? "Ativando..." : "Assinar Infinit"}
            onClick={() => handleSubscribe("infinit")}
            highlight
            disabled={!!pending}
            currentPlan={sub?.plan === "infinit" && sub.status === "active"}
          />
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Por enquanto a ativação é simbólica — em breve adicionaremos cobrança automática.
        </p>
      </main>
    </div>
  );
}

function PlanCard({
  name,
  icon,
  tagline,
  price,
  priceSuffix,
  badge,
  description,
  features,
  ctaLabel,
  onClick,
  highlight,
  disabled,
  currentPlan,
}: {
  name: string;
  icon: React.ReactNode;
  tagline: string;
  price: string;
  priceSuffix: string;
  badge: string;
  description: string;
  features: string[];
  ctaLabel: string;
  onClick: () => void;
  highlight: boolean;
  disabled: boolean;
  currentPlan: boolean;
}) {
  return (
    <section
      className={`relative flex flex-col rounded-2xl border p-7 shadow-sm transition ${
        highlight
          ? "border-brand bg-card shadow-elevated"
          : "border-border bg-card"
      }`}
    >
      {highlight && (
        <span className="absolute -top-3 right-6 rounded-full bg-brand px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-foreground">
          Recomendado
        </span>
      )}
      <div className="flex items-center gap-2 text-brand-dark">{icon}<span className="text-xs font-bold uppercase tracking-wider">{badge}</span></div>
      <h2 className="mt-3 font-display text-2xl font-bold">{name}</h2>
      <p className="text-sm text-muted-foreground">{tagline}</p>
      <div className="mt-5 flex items-baseline gap-1">
        <span className="font-display text-4xl font-bold">{price}</span>
        <span className="text-sm text-muted-foreground">{priceSuffix}</span>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{description}</p>
      <ul className="mt-5 space-y-2 text-sm">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-success" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={onClick}
        disabled={disabled || currentPlan}
        className={`mt-7 w-full rounded-full px-6 py-3 text-sm font-semibold transition-colors disabled:opacity-60 ${
          currentPlan
            ? "border border-border bg-muted text-muted-foreground"
            : highlight
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "border border-foreground bg-background text-foreground hover:bg-foreground hover:text-background"
        }`}
      >
        {currentPlan ? "Seu plano atual" : ctaLabel}
      </button>
    </section>
  );
}
