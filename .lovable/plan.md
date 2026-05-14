# TRENA — Plano do MicroSaaS

Plataforma gamificada de controle financeiro e produtividade para montadores e profissionais autônomos.

## Posicionamento

> "Sua trena financeira. Meça cada serviço, cada gasto, cada conquista — e veja seu negócio crescer todo mês."

**Público-alvo principal**: montadores de móveis (Madesa, Casas Bahia, Mercado Livre, IKEA-style), eletricistas, encanadores, técnicos, prestadores PJ/MEI que fazem serviços por agendamento.

**Dor real resolvida**: esses profissionais não sabem quanto realmente lucram. Misturam combustível, alimentação e materiais com o caixa pessoal, não controlam ferramentas que viram custo, e não enxergam padrões (qual dia rende mais, qual tipo de serviço dá mais lucro).

**Por que gamificar funciona aqui**: o público é majoritariamente masculino, jovem-adulto, acostumado com Uber/iFood Driver (apps que mostram nível, ranking, ganhos do dia). Gamificação aumenta retenção em apps financeiros em ~3x quando bem feita.

## Estratégia de produto (decisões opinativas)

1. **Mobile-first de verdade**: layout pensado para uma mão, no celular, em pé numa obra. Botões grandes, fluxos curtos, atalhos para ações frequentes.
2. **"Add em 5 segundos"**: botão flutuante (+) sempre visível abre bottom sheet para registrar despesa OU serviço em até 3 toques.
3. **Modelo freemium agressivo**: Free com tudo essencial (atinge "aha moment"). Pro destrava gamificação completa, relatórios, metas avançadas e exportação.
4. **Aha moment em <60s**: ao cadastrar 1 serviço + 1 despesa, o dashboard já mostra lucro do dia e libera a primeira conquista ("Primeira Medida 📏").
5. **Gamificação não é decoração**: XP por consistência (registrar diariamente), níveis baseados em faturamento, conquistas que reforçam hábitos saudáveis (ex: "7 dias seguidos registrando", "Margem acima de 30%").

## Escopo do MVP (primeira entrega completa)

### 1. Landing page (`/`)
- Hero com mockup do app + CTA "Começar grátis"
- Demonstração visual do dashboard
- 3 benefícios principais (controle, evolução, gamificação)
- Como funciona (3 passos)
- Pricing (Free / Pro R$19/mês ou R$149/ano)
- Depoimentos placeholder (substituíveis)
- FAQ + footer
- SEO: title, meta, OG tags, JSON-LD

### 2. Auth (`/login`, `/signup`)
- Email + senha (Lovable Cloud)
- Google sign-in
- Sem confirmação de email (reduz fricção)
- Onboarding de 3 telas pós-cadastro: nome do negócio, tipo de profissional, meta mensal de faturamento

### 3. App protegido (`/app/*`)

**`/app` — Dashboard**
- Saudação personalizada + nível atual + barra de XP
- Cards com métricas do mês: Faturamento, Despesas, Lucro Líquido, Margem %
- Gráfico de evolução (últimos 30 dias) — área chart
- Gráfico de despesas por categoria — donut
- Próxima conquista a desbloquear (com progresso)
- Desafio da semana ativo
- Atalhos rápidos: + Serviço, + Despesa

**`/app/servicos` — Serviços e agendamentos**
- Lista cronológica (hoje / esta semana / este mês)
- Status: agendado, em andamento, concluído, cancelado
- Cadastro: cliente, tipo de serviço, data/hora, valor combinado, endereço, observações
- Ao marcar como concluído: confirma valor recebido, atualiza faturamento, dispara ganho de XP

**`/app/despesas` — Despesas**
- Lista filtrada por mês/categoria
- Cadastro rápido: valor, categoria (combustível, alimentação, ferramentas, transporte, materiais, equipe), data, descrição
- Categorias com ícones e cores próprias
- Visual de "consumo" do orçamento por categoria (se Pro)

**`/app/conquistas` — Gamificação**
- Nível atual + XP + próximo nível
- Grid de conquistas (desbloqueadas / bloqueadas com pista)
- Desafios ativos (semanal/mensal) com progresso
- Histórico de recompensas

**`/app/relatorios` — Relatórios** (Pro)
- Comparativo mês a mês
- Lucro por tipo de serviço
- Dia da semana mais rentável
- Exportar CSV/PDF

**`/app/metas` — Metas**
- Meta de faturamento mensal
- Meta de margem de lucro
- Meta de número de serviços
- Visualização de progresso e projeção

**`/app/conta` — Conta**
- Dados do perfil
- Plano e assinatura
- Sair

### 4. Sistema de Gamificação (núcleo do produto)

**XP e níveis**
- +10 XP por serviço concluído
- +5 XP por despesa registrada
- +20 XP por dia consecutivo de uso
- +50 XP por meta semanal batida
- Níveis: Aprendiz → Montador → Especialista → Mestre → Lenda (com sub-níveis 1-10 cada)

**Conquistas iniciais (20+ exemplos)**
- 📏 Primeira Medida (1º serviço)
- 🔥 Sequência de Fogo (7 dias seguidos)
- 💰 Primeiro Mil (R$1.000 faturados)
- 📈 Margem de Mestre (margem >30% no mês)
- ⚡ Velocista (10 serviços em 1 semana)
- 🎯 Meta Batida (1ª meta mensal cumprida)
- ...

**Desafios semanais rotativos**
- "Registre todo dia esta semana"
- "Bata R$X de faturamento"
- "Mantenha despesas abaixo de Y%"

**Recompensas**
- Free: badges visuais + nível
- Pro: + temas de dashboard exclusivos, títulos personalizados, certificado mensal compartilhável (gera engajamento orgânico)

### 5. Paywall e monetização

**Free**
- Cadastro ilimitado de serviços e despesas
- Dashboard básico
- 3 conquistas iniciais
- 1 meta ativa

**Pro (R$19/mês ou R$149/ano)**
- Gamificação completa (todas conquistas, desafios, ranking)
- Relatórios avançados e exportação
- Metas ilimitadas
- Múltiplas categorias customizadas
- Temas premium

Modal de upgrade aparece em momentos estratégicos (não invasivo): ao tentar criar 2ª meta, ao tentar exportar, ao desbloquear conquista premium.

## Stack técnica

```text
Frontend:  TanStack Start + React + Tailwind v4 + shadcn/ui
Charts:    Recharts (área, donut, barras)
Backend:   Lovable Cloud (auth + Postgres + RLS)
Pagamento: Lovable Payments (Stripe gerenciado)
Mobile:    PWA-ready (instalável no celular)
```

### Modelo de dados

```text
profiles
  id, email, full_name, business_name, profession_type,
  monthly_goal, plan, level, xp, current_streak_days,
  last_activity_date, created_at

services
  id, user_id, client_name, service_type, scheduled_at,
  completed_at, status, agreed_price, received_price,
  address, notes, created_at

expenses
  id, user_id, amount, category, description,
  occurred_at, created_at
  -- category enum: combustivel, alimentacao, ferramentas,
  --                transporte, materiais, equipe, outros

achievements_catalog        (estática, seed)
  code, title, description, icon, xp_reward, tier

user_achievements
  user_id, achievement_code, unlocked_at

challenges_catalog          (estática, rotativa)
  code, title, description, type, target_value,
  period (weekly/monthly), xp_reward

user_challenges
  user_id, challenge_code, progress, completed_at, period_start

goals
  id, user_id, type (revenue/profit/services_count),
  target_value, period (month/week), starts_at, ends_at
```

RLS: todo usuário só lê/escreve suas próprias linhas. Conquistas e desafios catálogos são públicos (read-only).

### Lógica de gamificação (server functions)

- `completeService` → marca como concluído, soma XP, checa conquistas, atualiza streak
- `addExpense` → registra, soma XP, checa conquistas relacionadas
- `recalculateLevel` → trigger ao mudar XP
- `evaluateChallenges` → cron-like ao registrar atividade, atualiza progresso
- `getDashboardMetrics` → agrega faturamento, despesas, lucro, margem do período

## Design direction

Quero gerar 3 direções visuais renderizadas e você escolher antes de eu codar — produto gamificado precisa de identidade visual forte.

Direções que vou explorar:
1. **Construction Tech** — escuro com acento amarelo-construção (#F5C518) e detalhes técnicos (linhas de medida, marcadores), tipografia robusta. Vibe profissional de obra.
2. **Neon Progress** — escuro com gradientes verde-elétrico/ciano, glassmorphism, animações de progresso fluidas. Vibe app fitness/produtividade premium (Strava-like).
3. **Bold Brutalist Game** — alto contraste, blocos chapados, tipografia chunky, acentos vibrantes (laranja + roxo). Vibe Duolingo/jogo mobile, mais lúdico.

Todas mobile-first, com bottom navigation, FAB de ação rápida e micro-interações ao desbloquear conquista.

## Ordem de execução

1. Ativar Lovable Cloud
2. Gerar 3 direções de design → você escolhe uma
3. Criar schema do banco + RLS + seeds (catálogo de conquistas/desafios)
4. Construir landing page
5. Auth + onboarding (3 telas)
6. Layout do app (bottom nav, header, FAB)
7. Dashboard com gráficos e métricas
8. CRUD de serviços + lógica de conclusão/XP
9. CRUD de despesas + categorias
10. Sistema de gamificação (níveis, conquistas, desafios, streak)
11. Metas + relatórios
12. Ativar Lovable Payments + paywall + pricing
13. PWA + polimento mobile + microcopy

## Decisões que tomei (me diga se quer mudar)

- **Nome do plano pago e preço**: Pro a R$19/mês — sweet spot para autônomo brasileiro
- **Sem confirmação de email** no signup → maximiza ativação
- **Categorias fixas no MVP** (as 6 que você listou + "outros") → customização avançada só no Pro
- **Sem integração com bancos/Pix** no MVP → cadastro manual mantém escopo enxuto e validável rápido
- **Sem multi-usuário/equipe** no MVP → 1 conta = 1 profissional. "Equipe" entra como categoria de despesa
- **PWA em vez de app nativo** → instalável no celular, sem fricção de loja

## O que NÃO entra no MVP

- Integração bancária / leitura de extrato
- Emissão de NF
- Chat com clientes
- App nativo (iOS/Android stores)
- Ranking entre usuários (versão 2 — precisa de massa crítica)
- Multi-usuário / contas de equipe

Aprova esse plano? Se sim, eu começo ativando o Lovable Cloud e gerando as 3 direções de design para você escolher.
