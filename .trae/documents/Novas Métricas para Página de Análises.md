## Contexto Atual

* A página `Analises.tsx` agrega métricas avançadas (ROI, yield, Sharpe/Sortino/Calmar, drawdown, séries, sweet spot de odds), renderizando múltiplos gráficos e cards.

* O componente `components/analysis/InfoTooltip.tsx` fornece tooltips explicativos; podemos reutilizá-lo para novas métricas.

## Propostas de Métricas

### 1) Closing Line Value (CLV)

* O que mede: ganho de valor da odd entre o momento da aposta e o fechamento (quanto sua odd foi melhor que a "linha de fechamento").

* Fórmula: `CLV% = (odd_apostada / odd_fechamento - 1) * 100` ou em pontos: `odd_apostada - odd_fechamento`.

* UI: card de média de CLV, histograma, relação CLV x ROI (scatter).

* Dados: requer `closing_odd` por aposta (campo novo).

### 2) EV Estimado por Categoria/Casa

* O que mede: valor esperado por aposta usando probabilidade estimada por histórico.

* Fórmula: `EV = p_estimada * (odd - 1) - (1 - p_estimada)`; `p_estimada` por janela móvel e por grupo (categoria, casa, faixa de odd).

* UI: heatmap de EV por (categoria x faixa de odd), tabela de top EV.

* Dados: sem novo campo, usa histórico e agregação.

### 3) Brier Score e Curva de Calibração

* O que mede: quão bem suas estimativas de probabilidade (p\_estimada) se alinham aos resultados.

* Fórmula: `Brier = média((resultado_binário - p_estimada)^2)`.

* UI: curva de calibração (previsão vs frequência observada), card do Brier Score.

* Dados: usa `p_estimada` da proposta anterior.

### 4) Risk of Ruin (RoR)

* O que mede: probabilidade de ruína da banca com seu perfil atual de acerto e stakes.

* Aproximação: com p (taxa de acerto) e b (odd - 1), e fração média de stake (em % da banca), estimar RoR analítica ou por simulação.

* UI: gauge de risco (baixo/médio/alto) e texto explicativo.

* Dados: sem novo campo.

### 5) Ulcer Index e MAR

* O que mede: dor do drawdown (Ulcer Index) e relação retorno/drawdown (MAR = retorno anualizado / max drawdown).

* UI: cards e curva adicional de drawdown acumulado.

* Dados: sem novo campo.

### 6) Concentração de Exposição (HHI)

* O que mede: concentração de stakes por casa/categoria.

* Fórmula: `HHI = soma((participação_i)^2)`; participação\_i = stake\_i / stake\_total.

* UI: card com HHI, barras de participação e tooltip sobre risco de concentração.

* Dados: sem novo campo.

### 7) Correlação Stake vs Retorno

* O que mede: se você tende a apostar mais onde tem maior edge (ou não).

* Fórmula: correlação de Pearson entre `valor_apostado` e `retorno%` por aposta.

* UI: card e scatter com linha de tendência.

* Dados: sem novo campo.

### 8) Regimes de Volatilidade (Rolling)

* O que mede: mudanças de regime (volatilidade/ROI) ao longo do tempo.

* UI: gráfico rolling std e média de retornos, com marcação de regimes (alto/baixo).

* Dados: sem novo campo.

### 9) Quantis e Caudas (Skew/Kurtosis)

* O que mede: assimetria e caudas dos retornos por aposta.

* UI: cards de skewness/kurtosis, boxplot por categoria.

* Dados: sem novo campo.

### 10) Simulação Monte Carlo de Banca

* O que mede: distribuição futura da banca baseada nos seus retornos históricos (bootstrapping ou paramétrico).

* UI: gráfico de densidade e percentis (P10/P50/P90), texto sobre risco e expectativa.

* Dados: sem novo campo.

### 11) Eficiência de Cashout

* O que mede: se seus cashouts foram favoráveis vs EV esperado.

* Métrica: `Eficiência = cashout_value - EV_no_momento`; proxy se não houver modelo em tempo real.

* UI: card, tabela dos melhores/piores cashouts.

* Dados: requer `cashout_value` (+ timestamp opcional) por aposta (campo novo).

### 12) Edge Continuum (LOESS ROI vs Odd)

* O que mede: curva contínua do ROI por odd (suavizada), além do sweet spot por faixas.

* UI: gráfico linha suavizada mostrando onde está seu melhor edge.

* Dados: sem novo campo.

## Integração na UI

* Novas seções/tabs em `Analises.tsx`:

  * "Odds & Edge": CLV, EV, Calibração.

  * "Risco": RoR, Ulcer Index, MAR, quantis.

  * "Exposição": HHI, stake vs retorno.

  * "Projeções": Monte Carlo.

  * "Cashout": Eficiência.

* Reutilizar `InfoTooltip` para explicar cada métrica.

## Mudanças de Dados (Opcional)

* `aposta`

  * `closing_odd: number | null` (para CLV)

  * `cashout_value: number | null` (para eficiência)

* Sem mudança: demais métricas usam dados já existentes.

## Implementação Técnica (Fases)

### Fase 1 (sem schema novo)

1. EV por categoria/faixa de odd (rolling p\_estimada) e Brier/Calibração.
2. HHI e correlação stake vs retorno.
3. Ulcer Index, MAR, quantis (skew/kurtosis).
4. Rolling regime (std/mean) com janelas 30/60 dias.
5. Edge continuum (LOESS ou média por bins finos).

### Fase 2 (com schema novo)

1. `closing_odd` e cálculo CLV + gráficos.
2. `cashout_value` e eficiência de cashout.
3. Monte Carlo (pode vir na fase 1, mas melhor após EV/CLV para parametrização mais robusta).

## Validação

* Comparar métricas com amostras conhecidas (tests nos hooks), conferir consistência com ROI/retornos.

* Adicionar tooltips informativos e limites mínimos de amostra (ex.: ignorar buckets com <5 apostas).

* Garantir performance com memoização e agregações por chave (categoria/casa/odd-bins).

## Observação

* Algumas métricas (CLV, cashout eficiência) dependem de campos novos; posso preparar as alterações no Supabase e componentes se você aprovar este plano.

  Ao final de cada um desses novos Graficos/Metricas adicione um tooltip explicando do que se trata. Se não houver um nos já existentes, trate de adicionar tambem, quero todos os graficos/metricas/estatisticas com tooltips explicando bem do que se tratam

