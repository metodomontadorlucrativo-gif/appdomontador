
# Planos e trial de 7 dias

Como você pulou as perguntas, vou seguir com decisões padrão sensatas. Se algo aqui não bater com o que você quer, é só me dizer antes de aprovar.

## Decisões padrão que estou tomando

- **Pagamento real fica para depois.** Agora implemento apenas a *lógica* de trial e planos no banco (sem cartão, sem Stripe). Quando você quiser cobrar de verdade, plugamos o Stripe por cima sem refazer nada do que vamos construir agora.
- **Trial:** todo novo cadastro entra automaticamente em 7 dias grátis com acesso completo (equivalente ao Infinit). Não pede cartão.
- **Start (R$ 27,90/mês):** preço promocional pelos 3 primeiros meses; depois disso muda para R$ 49,90/mês (vou deixar essa variável fácil de ajustar — me diga se for outro valor).
- **Infinit (R$ 19,90/mês):** botão "Cancelar assinatura" fica desabilitado até completar 90 dias desde a assinatura. Depois, libera cancelamento normal.

## O que vai mudar para o usuário

1. **Cadastro (`/signup`)** — texto destacando "7 dias grátis, sem cartão".
2. **Após login**, se o trial estiver ativo, aparece um *banner* no topo do `/app` mostrando "Faltam X dias do seu teste grátis" + botão "Ver planos".
3. **Nova página `/app/planos`** — duas cartas (Start e Infinit) com os preços, benefícios e botão "Assinar". Por enquanto o botão só marca o plano no banco (mock) e mostra um toast "Em breve: pagamento". Quando ativarmos Stripe, esse botão vira o checkout real.
4. **Página `/app/assinatura`** — mostra plano atual, dias restantes do trial (se aplicável), data de início, próxima cobrança (mock) e botão "Cancelar". O botão fica desabilitado com tooltip "Disponível após 3 meses" enquanto a regra do Infinit não for cumprida.
5. **Quando o trial expira** sem assinar: ao entrar em `/app`, redireciona para `/app/planos` com um aviso "Seu teste acabou — escolha um plano para continuar".

## Detalhes técnicos

### Banco (migração)

Adicionar à tabela `profiles`:

- `plan` — já existe (enum `app_plan`). Vou estender o enum para incluir: `trial`, `start`, `infinit` (além do `free` atual).
- `trial_started_at` (timestamptz) — preenchido por trigger no signup.
- `trial_ends_at` (timestamptz) — `trial_started_at + 7 days`.
- `subscription_started_at` (timestamptz, nullable) — quando assinou Start ou Infinit.
- `subscription_status` (text: `trialing` | `active` | `cancelled` | `expired`) — default `trialing`.
- `cancel_requested_at` (timestamptz, nullable) — registra o pedido de cancelamento.

Atualizar a função `handle_new_user()` para já marcar `plan = 'trial'`, `trial_started_at = now()`, `trial_ends_at = now() + interval '7 days'`, `subscription_status = 'trialing'`.

### Server functions (`src/lib/billing.functions.ts`)

- `getSubscriptionStatus()` — devolve plano, dias restantes, se pode cancelar, etc.
- `subscribeToPlan({ plan: 'start' | 'infinit' })` — marca o plano e `subscription_started_at = now()`. (Mock; Stripe entra aqui depois.)
- `cancelSubscription()` — valida a regra de 90 dias para o Infinit; se for Start ou já passou dos 90 dias do Infinit, marca como `cancelled`.

### Rotas novas

```
src/routes/_authenticated/app.planos.tsx
src/routes/_authenticated/app.assinatura.tsx
```

### Componentes

- `TrialBanner.tsx` — banner no topo do `/app` quando `subscription_status = 'trialing'`.
- `PlanCard.tsx` — cartão de plano reutilizado nas duas telas.
- Pequeno helper em `src/lib/trena.ts` para calcular dias restantes e se cancelamento está liberado.

### Atualização do `signup.tsx`

Adicionar selo "7 dias grátis · sem cartão" acima do formulário. Nenhuma mudança no fluxo de auth em si.

## O que **não** está incluso (e fica para depois)

- Integração real com Stripe / Paddle (checkout, webhooks, cobrança recorrente, recibos).
- Restrição de funcionalidades por plano (gating de features Pro). Por enquanto todo plano pago ou em trial libera tudo.
- Reembolsos, mudanças de plano (upgrade/downgrade) e provas fiscais.

Quando aprovar, eu já implemento. Se quiser ajustar algum valor (preço cheio do Start após 3 meses, por exemplo) ou trocar a regra de cancelamento, me diga antes de clicar em aprovar.
