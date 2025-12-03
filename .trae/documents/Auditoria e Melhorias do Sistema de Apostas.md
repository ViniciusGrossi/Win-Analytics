## Visão Geral
- Arquitetura React + Vite com UI baseada em componentes, dados via Supabase (`aposta`, `bookies`, `goals`, `transactions`).
- Lógica de apostas centralizada em `src/services/apostas.ts`; gestão de casas e transações em `bookies.ts` e `transactions.ts`.
- Páginas principais: `Dashboard`, `Apostas`, `Resultados`, `Banca`, `Analises`. Métricas avançadas em `hooks/useAnalysisMetrics.ts`.

## Problemas Encontrados
- Supabase com URL/anon key hardcoded, sem variáveis de ambiente: `src/integrations/supabase/client.ts:5-6`.
- Criação de aposta e débito de saldo não atômicos (risco de inconsistência se uma operação falhar): `src/services/apostas.ts:60-86`.
- Validação de saldo no front ignora bônus (bloqueia aposta com bônus apesar de backend permitir): `src/components/apostas/CreateApostaDialog.tsx:164-171`.
- Cálculo de turbo no card de resultados cria divisão desnecessária e possível `NaN` (dead code): `src/components/resultados/ResultadoCard.tsx:53`.
- Coluna de ações sem cabeçalho/alinhamento na tabela (colSpan inconsistente): `src/components/apostas/ApostasTable.tsx:142-152, 167-177, 182`.
- `formatDate` pode sofrer offset de timezone com `new Date(YYYY-MM-DD)`: `src/lib/utils.ts:19-21`.
- Uso inconsistente de notificações (dois sistemas): `App.tsx:1-3, 2` e `src/pages/Resultados.tsx:11` vs `src/components/apostas/CreateApostaDialog.tsx:13`.
- `QueryClient` habilitado mas sem `useQuery` (fetch imperativo duplicado): `src/App.tsx:4,16` e páginas com `useEffect` para carregamento.
- Tipagem frouxa em alguns pontos (`as any`, tipos string): `src/components/apostas/ApostasTable.tsx:84` e `src/types/betting.ts:71`.

## Melhorias Sugeridas
- Configurar Supabase via variáveis de ambiente (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`), mantendo boas práticas de segurança.
- Criar função RPC no Postgres para operações atômicas: inserir aposta + atualizar saldo (+ opcional registro em `transactions`).
- Corrigir validação de saldo no formulário quando bônus estiver ativo, alinhando front e backend.
- Remover/ajustar cálculo de turbo no `ResultadoCard`, documentando que `aposta.turbo` já guarda o valor monetário do turbo.
- Ajustar tabela de `ApostasTable` para incluir cabeçalho "Ações" ou ajustar `colSpan` do estado vazio.
- Trocar `formatDate` para `dayjs` com parse explícito da string (`YYYY-MM-DD`) garantindo consistência.
- Unificar sistema de toast (escolher `sonner` ou o `use-toast` interno) e padronizar chamadas.
- Adotar React Query nas páginas para cache, loading e erro (reduz `useEffect`/duplicação), usando o `QueryClient` já presente.
- Refinar tipos: `Transaction.type: TransactionType`, evitar `as any` onde possível, tipar `StatusBadge` para `ResultadoType`.
- Opcional: assinaturas em tempo real via Supabase Channels para atualizar listas automaticamente.

## Funcionalidades a Adicionar
- Registro de transações automáticas ao definir resultado (ex.: crédito de vitória, estorno de cancelamento), com descrição amigável.
- Filtros globais reutilizáveis na página `Apostas` usando `useFilterStore`, alinhando com `Dashboard/Analises`.
- KPIs adicionais em `Dashboard` por casa/tipo (hoje estão "em desenvolvimento"): `src/pages/Dashboard.tsx:124-135`.
- Testes unitários mínimos dos serviços (cálculo de `valor_final`, ROI, série temporal) e mocks do Supabase.

## Plano de Implementação
### Passo 1: Configuração de Ambiente
- Introduzir `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` e ler no `client.ts`.
- Documentar no `.env.example` como configurar (sem commitar segredos reais).

### Passo 2: Operações Atômicas via RPC
- Criar função Postgres `rpc_create_aposta_and_debit(bet, bookie_name)` que insere em `aposta`, atualiza `bookies.balance` e `last_update` numa transação.
- Expor chamada em `apostasService.create` e tratar erro único.
- Opcional: `rpc_apply_result_and_credit(aposta_id, resultado, cashout)` que atualiza `aposta` e credita saldo quando aplicável.

### Passo 3: Correções de UI e Lógica
- `CreateApostaDialog`: pular cheque de saldo se `hasBonus` for true: `CreateApostaDialog.tsx:164-171`.
- `ResultadoCard`: remover divisão por `lucroBase` e usar diretamente `aposta.turbo` no retorno potencial; garantir não calcular nada quando `lucroBase` for zero.
- `ApostasTable`: adicionar cabeçalho "Ações" ou ajustar `colSpan` do estado vazio para `columns.length + 1`.
- `utils.formatDate`: substituir por `dayjs(date).format('DD/MM/YYYY')`.

### Passo 4: Notificações e Data Fetching
- Escolher um sistema de toast e padronizar imports/uso nas páginas e componentes.
- Migrar carregamentos para React Query:
  - `Apostas`, `Resultados`, `Dashboard`, `Banca`, `TransactionsHistory`, `GoalsManager`.
  - Definir chaves de query e invalidations após `create/update/remove`.

### Passo 5: Tipagem e Qualidade
- Atualizar `Transaction.type` para `TransactionType` e ajustar serviços.
- Tipar `StatusBadge` para aceitar `ResultadoType` sem `as any`.
- Remover `as any` de formulários usando defaults mais seguros e conversões controladas.

### Passo 6: Funcionalidades Complementares
- Adicionar escrita em `transactions` ao aplicar resultados: "Crédito por vitória", "Estorno por cancelamento", "Cashout".
- Adicionar Supabase Channels para `aposta`/`bookies` atualizarem listas em tempo real.
- Completar abas "Por Casa" e "Por Tipo" no `Dashboard` reutilizando agregações já presentes em `Analises`.

### Passo 7: Testes
- Criar testes de serviços (ROI, `valor_final`, séries) com dados fake; validar cenários: bônus, turbo, cashout, cancelado.

## Referências de Código
- Supabase env: `src/integrations/supabase/client.ts:5-6`.
- Operações não atômicas: `src/services/apostas.ts:60-86`.
- Saldo ignorando bônus: `src/components/apostas/CreateApostaDialog.tsx:164-171`.
- Turbo dead code: `src/components/resultados/ResultadoCard.tsx:53-56`.
- Tabela ações/colSpan: `src/components/apostas/ApostasTable.tsx:142-152, 167-177, 182-186`.
- Timezone em data: `src/lib/utils.ts:19-21`.
- Toasts duplicados: `src/pages/Resultados.tsx:11`, `src/components/apostas/CreateApostaDialog.tsx:13`, `src/App.tsx:1-3`.

## Validação
- Verificar fluxos: criar aposta (com/sem bônus), aplicar resultado (ganho/perda/cancelado/cashout), saldo de `bookies`, histórico de `transactions`.
- Rodar testes unitários e inspeção visual em `Dashboard`, `Apostas`, `Resultados` e `Banca` com dados de exemplo.
- Confirmar ausência de regressões e melhoria de UX/consistência nas notificações e datas.