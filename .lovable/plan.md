## Objetivo
Adicionar um mini gráfico de linha (sparkline) horizontal e bem pequeno logo abaixo de cada card de meta (semanal e mensal), mostrando a progressão acumulada do realizado ao longo do período, com uma linha de referência tracejada indicando a meta.

## Onde
- Arquivo: `src/routes/app.tsx`
- Componente: `GoalProgress` (linhas 476–554), inserindo o sparkline entre o bloco de números (Realizado/Projetado/Faltam) e o aviso "já agendados aguardando conclusão".

## O que mostrar
- **Meta semanal**: 7 pontos — um por dia da semana atual (segunda → domingo), valor acumulado do `realized` (serviços concluídos) até aquele dia.
- **Meta mensal**: 1 ponto por dia do mês atual, mesma lógica de acumulado.
- Linha de referência tracejada horizontal no nível da meta (quando há meta).
- Marcador "hoje" sutil no ponto correspondente ao dia atual.

## Implementação técnica
1. Criar novo componente `GoalSparkline` no mesmo arquivo:
   - Props: `points: number[]`, `goal: number`, `todayIndex: number`.
   - Render via SVG inline puro (sem `recharts`), altura ~32px, largura 100%.
   - `polyline` para a linha (cor `brand`), `path` com fill suave abaixo (gradiente `brand/15`), `line` tracejada para a meta, `circle` pequeno para o ponto de hoje.
   - `viewBox` proporcional; usa `preserveAspectRatio="none"` no fundo e coordenadas normalizadas para a linha.
2. No `OverviewTab` (perto de onde `weeklySeries` é calculado), derivar duas séries acumuladas:
   - `weeklyDailySeries`: para cada dia de `startOfWeek` até `endOfWeek`, soma cumulativa de `servicePrice` dos serviços `completed` cuja data ≤ aquele dia, dentro da semana.
   - `monthlyDailySeries`: idem para o mês atual.
   - Calcular `todayIndex` em cada série (ou -1 se hoje fora do período).
3. Passar `series` e `todayIndex` como props novas para `GoalProgress` e renderizar `<GoalSparkline />` logo abaixo do grid de 3 colunas.

## Estilo
- Altura fixa ~28–32px, margem superior `mt-3`.
- Linha: `stroke="hsl(var(--brand))"` (ou token equivalente já usado), `strokeWidth={1.5}`.
- Área sob a linha: gradiente vertical com `brand` em ~15% opacidade no topo → 0% embaixo.
- Linha da meta: `stroke-dasharray="3 3"`, cor `brand/60`.
- Sem eixos, sem labels, sem tooltip — minimalista.

## Fora de escopo
- Não mexer no gráfico "Últimas 4 semanas" existente.
- Sem tooltip interativo nem hover (manter "bem pequeno" conforme pedido).
- Sem nova dependência (recharts não é usado aqui).
