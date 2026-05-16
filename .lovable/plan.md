## O que vai mudar no /app (modo demo, localStorage)

### 1. Cadastro de Serviço — novo campo de data
No formulário de "Novo serviço", adicionar:
- **Data do serviço** (campo date, obrigatório) — quando vai acontecer ou aconteceu.
- **Período de cobrança** (select: `Dia` / `Semana` / `Mês`) — define em qual "balde" da projeção esse valor entra. Default: `Mês`.

Cada serviço passa a guardar `{ date, period }` além dos campos atuais (cliente, tipo, valor, status).

### 2. Configuração de Metas
Novo card "Minhas metas" no topo do Dashboard com 2 inputs:
- **Meta semanal** (R$)
- **Meta mensal** (R$)

Salvas em `localStorage` (`trena_goals`). Editáveis a qualquer momento.

### 3. Dashboard — Realizado vs Projetado
Substituir o card único de Faturamento por **dois números lado a lado**:
- **Realizado** = soma dos serviços com status `Concluído` no período.
- **Projetado** = Realizado + soma dos `Agendados` no período.

Mostrados para 2 escalas:
- Semana atual (segunda → domingo)
- Mês atual

### 4. Visualização completa da meta
Abaixo dos números, três blocos:

**a) Barra de progresso dupla** (por meta semanal e mensal):
```
Meta mensal  R$ 10.000
[████████░░░░░░░░] 60% realizado · 85% projetado
Faltam R$ 4.000 para fechar · R$ 1.500 já agendados
```
Duas cores: realizado (sólido) + projetado (tom mais claro sobreposto).

**b) Gráfico semanal** (barras das últimas 4 semanas) — realizado vs projetado por semana, usando `recharts` (já no projeto via shadcn chart).

**c) Mini-calendário do mês** — grade simples mostrando dias com serviços, com pontinho colorido por status (agendado/concluído) e total do dia no hover/tap. Usa o `Calendar` do shadcn em modo read-only com `modifiers` customizados.

### 5. Lista de Serviços
- Adicionar coluna "Data" e badge do período.
- Ordenar por data (mais próximos primeiro).
- Filtro rápido: `Esta semana` / `Este mês` / `Todos`.

---

## Detalhes técnicos

- **Arquivos editados:** apenas `src/routes/app.tsx` (+ pequenos utilitários em `src/lib/trena.ts` se precisar de helpers de data tipo `startOfWeek`, `isInCurrentMonth`).
- **Datas:** usar `date-fns` (já instalado) — `startOfWeek`, `endOfWeek`, `startOfMonth`, `endOfMonth`, `isWithinInterval`, locale `ptBR`, semana começando segunda.
- **Estado:** continua tudo em `localStorage`. Chaves: `trena_services`, `trena_expenses` (existentes) + `trena_goals` (nova).
- **Tipos:** `Service` ganha `date: string` (ISO yyyy-MM-dd) e `period: 'day' | 'week' | 'month'`. Migração leve: serviços antigos sem data usam `created_at`.
- **Gráficos:** `recharts` via `@/components/ui/chart`.
- **Sem mudanças de backend** nesta etapa — quando o usuário ativar login depois, replicamos o schema (`services.scheduled_at` já existe, `goals` já existe com `period` e `target_value`).

---

## Sugestões extras de usabilidade (pra você decidir depois, não entram agora)

1. **Status "Em andamento"** entre agendado e concluído, com timer/cronômetro do serviço — útil pra montador que cobra por hora.
2. **Recorrência** de serviço (cliente fixo toda semana) com criação automática.
3. **Lembrete no dia** via notificação do navegador.
4. **Custo por serviço** (vincular despesas a um serviço específico pra ver lucro real por job, não só global).
5. **Compartilhar resumo** do mês como imagem pro WhatsApp.

Posso seguir implementando o plano acima?
