import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, Trophy, Zap, CheckCircle2, Target, Smartphone, TrendingUp, Wrench } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TRENA — Controle financeiro gamificado para montadores e autônomos" },
      {
        name: "description",
        content:
          "App mobile-first para montadores, eletricistas e profissionais autônomos controlarem despesas, faturamento e produtividade. Suba de nível, bata metas e veja seu lucro real.",
      },
      {
        property: "og:title",
        content: "TRENA — Sua trena financeira gamificada",
      },
      {
        property: "og:description",
        content:
          "Controle ganhos, despesas e produtividade. Gamificado, mobile-first, simples. Comece grátis.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <Hero />
      <Benefits />
      <HowItWorks />
      <DashboardPreview />
      <Pricing />
      <FAQ />
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <Logo />
          <div className="flex flex-col">
            <span className="font-display text-2xl font-bold uppercase tracking-tight leading-none">
              Trena
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wide text-brand-dark">
              Acompanhe seu faturamento e conquiste suas metas.
            </span>
          </div>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          <a href="#beneficios" className="hover:text-foreground">Benefícios</a>
          <a href="#como-funciona" className="hover:text-foreground">Como funciona</a>
          <a href="#precos" className="hover:text-foreground">Preços</a>
          <a href="#faq" className="hover:text-foreground">FAQ</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:block"
          >
            Entrar
          </Link>
          <Link
            to="/signup"
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Começar grátis
          </Link>
        </div>
      </div>
    </header>
  );
}

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-lg bg-brand font-display font-bold italic text-surface"
      style={{ width: size, height: size, fontSize: size * 0.55 }}
    >
      T
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_-10%,oklch(0.95_0.08_75)_0%,transparent_60%)]" />
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-[1.1fr_1fr] lg:py-24">
        <div>
          <span className="mb-6 inline-block rounded-full bg-brand/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-dark">
            O app do profissional autônomo
          </span>
          <h1 className="font-display text-5xl font-bold leading-[1.05] sm:text-6xl lg:text-7xl">
            Seu bolso em ordem,{" "}
            <span className="text-brand">sua carreira em outro nível.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Controle financeiro gamificado para montadores, eletricistas e
            técnicos. Cada serviço vira XP, cada meta vira conquista. Veja seu
            lucro real e a evolução do seu negócio em tempo real.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to="/signup"
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
            >
              Começar agora — grátis
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#como-funciona"
              className="text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              Ver como funciona →
            </a>
          </div>
          <div className="mt-8 flex items-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-success" /> Sem cartão
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-success" /> Mobile-first
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-success" /> Em português
            </div>
          </div>
        </div>

        <PhoneMockup />
      </div>
    </section>
  );
}

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[360px]">
      <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-gradient-to-br from-brand/30 via-brand/10 to-transparent blur-2xl" />
      <div className="aspect-[9/19.5] overflow-hidden rounded-[3rem] border-[10px] border-surface bg-background shadow-2xl">
        <div className="flex h-full flex-col">
          {/* Status bar */}
          <div className="flex h-9 items-center justify-between bg-background px-7 pt-2 text-[10px] font-bold">
            <span>09:41</span>
            <div className="flex items-center gap-1">
              <div className="h-2 w-3 rounded-sm border border-foreground" />
              <div className="h-2 w-3 rounded-sm bg-foreground" />
            </div>
          </div>
          {/* App content */}
          <div className="flex-1 overflow-hidden bg-background px-4 pb-4">
            <div className="mt-2 rounded-2xl bg-surface p-4 text-surface-foreground">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-display text-sm font-bold text-brand">NÍVEL 14</div>
                  <div className="text-[10px] text-white/60">Mestre das Ferragens</div>
                </div>
                <div className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold">
                  2.450 XP
                </div>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[78%] bg-brand" />
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <MetricMini label="Faturamento" value="R$ 8.420" tone="default" />
              <MetricMini label="Despesas" value="R$ 1.150" tone="default" />
              <MetricMini label="Lucro" value="R$ 7.270" tone="success" />
              <MetricMini label="Margem" value="86%" tone="brand" />
            </div>

            <div className="mt-3 rounded-xl border-2 border-dashed border-brand/40 bg-brand/5 p-3">
              <div className="flex items-center gap-2">
                <div className="grid size-8 place-items-center rounded-full bg-brand/20 text-base">
                  ⚡
                </div>
                <div>
                  <div className="text-[9px] font-bold uppercase text-brand-dark">
                    Desafio da semana
                  </div>
                  <div className="text-xs font-semibold">5 montagens</div>
                </div>
              </div>
              <div className="mt-2 flex gap-1">
                {[1, 1, 1, 0, 0].map((v, i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full ${v ? "bg-brand" : "bg-border"}`}
                  />
                ))}
              </div>
            </div>

            <div className="mt-3 space-y-1.5">
              {[
                { icon: "📦", title: "Montagem cozinha", value: "+R$ 450", tone: "success" },
                { icon: "⛽", title: "Combustível", value: "-R$ 120", tone: "destructive" },
              ].map((row, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-2.5"
                >
                  <div className="flex items-center gap-2">
                    <div className="grid size-7 place-items-center rounded-md bg-muted text-sm">
                      {row.icon}
                    </div>
                    <div className="text-xs font-semibold">{row.title}</div>
                  </div>
                  <div
                    className={`text-xs font-bold ${row.tone === "success" ? "text-success" : "text-destructive"}`}
                  >
                    {row.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricMini({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "default" | "success" | "brand";
}) {
  const toneClass =
    tone === "success"
      ? "text-success"
      : tone === "brand"
        ? "text-brand-dark"
        : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-card p-2.5">
      <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={`mt-0.5 font-display text-sm font-bold leading-tight ${toneClass}`}>
        {value}
      </div>
    </div>
  );
}

function Benefits() {
  const items = [
    {
      icon: BarChart3,
      title: "Lucro real, na hora",
      desc: "Faturamento, despesas, margem e evolução em tempo real. Pare de achar — saiba.",
    },
    {
      icon: Trophy,
      title: "Conquistas e níveis",
      desc: "Ganhe XP por cada serviço, suba de nível e desbloqueie troféus. Consistência vira hábito.",
    },
    {
      icon: Smartphone,
      title: "Mobile-first de verdade",
      desc: "Pensado para registrar em 5 segundos, em pé na obra, com uma mão só.",
    },
  ];
  return (
    <section id="beneficios" className="border-t border-border bg-secondary/40 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 max-w-2xl">
          <div className="mb-3 text-xs font-bold uppercase tracking-wider text-brand-dark">
            Por que TRENA
          </div>
          <h2 className="font-display text-4xl font-bold leading-tight sm:text-5xl">
            Três coisas que mudam seu jogo.
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-elevated"
            >
              <div className="grid size-12 place-items-center rounded-xl bg-brand/15 text-brand-dark">
                <item.icon className="size-6" />
              </div>
              <h3 className="mt-5 font-display text-xl font-bold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      icon: Wrench,
      title: "Cadastre serviços e despesas",
      desc: "Registre em 3 toques. Combustível, materiais, montagens. Tudo organizado por categoria.",
    },
    {
      n: "02",
      icon: TrendingUp,
      title: "Veja seu lucro real",
      desc: "Dashboard com gráficos em tempo real, evolução do mês e detalhamento por categoria.",
    },
    {
      n: "03",
      icon: Trophy,
      title: "Suba de nível",
      desc: "Cada serviço vira XP. Bata desafios semanais, desbloqueie conquistas e cresça consistente.",
    },
  ];
  return (
    <section id="como-funciona" className="py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 max-w-2xl">
          <div className="mb-3 text-xs font-bold uppercase tracking-wider text-brand-dark">
            Como funciona
          </div>
          <h2 className="font-display text-4xl font-bold leading-tight sm:text-5xl">
            Comece a controlar em menos de 1 minuto.
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="relative rounded-2xl bg-surface p-7 text-surface-foreground">
              <div className="font-display text-5xl font-bold text-brand">{s.n}</div>
              <s.icon className="mt-6 size-7 text-brand" />
              <h3 className="mt-4 font-display text-xl font-bold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DashboardPreview() {
  return (
    <section className="border-y border-border bg-secondary/40 py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2">
        <div>
          <div className="mb-3 text-xs font-bold uppercase tracking-wider text-brand-dark">
            Dashboard inteligente
          </div>
          <h2 className="font-display text-4xl font-bold leading-tight sm:text-5xl">
            Métricas que importam, sem planilha.
          </h2>
          <ul className="mt-8 space-y-4">
            {[
              "Faturamento, despesas, lucro e margem do mês",
              "Gráfico de evolução dos últimos 30 dias",
              "Despesas por categoria com cores e ícones",
              "Próxima conquista a desbloquear",
              "Desafio da semana com progresso visual",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
                <span className="text-base text-foreground">{t}</span>
              </li>
            ))}
          </ul>
        </div>
        <PhoneMockup />
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="precos" className="py-20">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-12 text-center">
          <div className="mb-3 text-xs font-bold uppercase tracking-wider text-brand-dark">
            Preços
          </div>
          <h2 className="font-display text-4xl font-bold leading-tight sm:text-5xl">
            Comece grátis. Suba para o Pro quando quiser mais.
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <PricingCard
            name="Free"
            price="R$ 0"
            tagline="Para começar a controlar agora"
            features={[
              "Cadastro ilimitado de serviços",
              "Cadastro ilimitado de despesas",
              "Dashboard com métricas do mês",
              "3 conquistas iniciais",
              "1 meta ativa",
            ]}
            cta="Começar grátis"
            href="/signup"
          />
          <PricingCard
            highlighted
            name="Pro"
            price="R$ 19"
            priceSuffix="/mês"
            tagline="Para quem quer crescer com consistência"
            features={[
              "Tudo do Free",
              "Gamificação completa (todas conquistas)",
              "Desafios semanais e mensais",
              "Metas ilimitadas",
              "Relatórios avançados e exportação",
              "Temas premium",
            ]}
            cta="Começar com Pro"
            href="/signup"
          />
        </div>
      </div>
    </section>
  );
}

function PricingCard({
  name,
  price,
  priceSuffix,
  tagline,
  features,
  cta,
  href,
  highlighted,
}: {
  name: string;
  price: string;
  priceSuffix?: string;
  tagline: string;
  features: string[];
  cta: string;
  href: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`relative flex flex-col rounded-3xl border p-8 ${
        highlighted
          ? "border-brand bg-surface text-surface-foreground shadow-2xl shadow-brand/20"
          : "border-border bg-card"
      }`}
    >
      {highlighted && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-surface">
          Recomendado
        </span>
      )}
      <h3 className="font-display text-2xl font-bold">{name}</h3>
      <p
        className={`mt-1 text-sm ${highlighted ? "text-white/70" : "text-muted-foreground"}`}
      >
        {tagline}
      </p>
      <div className="mt-6 flex items-baseline gap-1">
        <span className="font-display text-5xl font-bold">{price}</span>
        {priceSuffix && (
          <span
            className={`text-base ${highlighted ? "text-white/60" : "text-muted-foreground"}`}
          >
            {priceSuffix}
          </span>
        )}
      </div>
      <ul className="mt-8 flex-1 space-y-3">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm">
            <CheckCircle2
              className={`mt-0.5 size-4 shrink-0 ${highlighted ? "text-brand" : "text-success"}`}
            />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        to={href}
        className={`mt-8 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors ${
          highlighted
            ? "bg-brand text-surface hover:bg-brand/90"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        }`}
      >
        {cta} <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}

function FAQ() {
  const items = [
    {
      q: "Preciso de cartão de crédito para começar?",
      a: "Não. O plano Free é totalmente gratuito e sem prazo. Use à vontade e suba para o Pro só quando quiser mais.",
    },
    {
      q: "Funciona em qualquer celular?",
      a: "Sim. TRENA é um app web mobile-first que funciona em qualquer celular Android ou iPhone, sem precisar instalar de loja.",
    },
    {
      q: "Sirvo para quais profissões?",
      a: "Montadores de móveis, eletricistas, encanadores, técnicos de instalação, pintores, marceneiros, jardineiros — qualquer autônomo que faz serviços por agendamento.",
    },
    {
      q: "Meus dados ficam seguros?",
      a: "Sim. Toda informação fica protegida na sua conta com regras de acesso por usuário. Só você vê seus dados.",
    },
    {
      q: "Posso cancelar quando quiser?",
      a: "Sim, sem multa, sem fidelidade. Cancela com um clique e mantém acesso até o fim do período pago.",
    },
  ];
  return (
    <section id="faq" className="border-t border-border bg-secondary/40 py-20">
      <div className="mx-auto max-w-3xl px-6">
        <div className="mb-12 text-center">
          <div className="mb-3 text-xs font-bold uppercase tracking-wider text-brand-dark">
            Perguntas frequentes
          </div>
          <h2 className="font-display text-4xl font-bold leading-tight">Tira sua dúvida.</h2>
        </div>
        <div className="space-y-4">
          {items.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-border bg-card p-5 open:shadow-elevated"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between font-display text-base font-bold">
                {item.q}
                <span className="text-brand-dark transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-background py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 sm:flex-row">
        <div className="flex items-center gap-2">
          <Logo size={32} />
          <span className="font-display text-lg font-bold uppercase">Trena</span>
        </div>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} TRENA · Construído para quem constrói.
        </p>
        <div className="flex gap-5 text-xs text-muted-foreground">
          <a href="#beneficios" className="hover:text-foreground">Benefícios</a>
          <a href="#precos" className="hover:text-foreground">Preços</a>
          <Link to="/login" className="hover:text-foreground">Entrar</Link>
        </div>
      </div>
    </footer>
  );
}
