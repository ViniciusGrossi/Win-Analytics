# Deploy Fase 1+2+3.5 — pendências técnicas

> Gerado em 2026-07-14/15 por uma sessão sem acesso a `npm`/`supabase` CLI (ambiente
> sem toolchain instalada). **O código abaixo está só neste checkout local do vault —
> ainda NÃO foi commitado nem enviado ao GitHub.** O push foi iniciado e pausado a
> pedido do usuário para continuar a implementação da Fase 2 primeiro; retomar o
> push é o próximo passo antes de qualquer deploy real. Depois de tudo verificado
> e deployado, pode apagar este arquivo.

## O que já está feito

- **Banco (Supabase, projeto `cjlvcjfuntfbdrrkigwh`) — já aplicado e verificado em produção:**
  - Revogado `EXECUTE` de `mint_session_token`/`verify_session_token`/`handle_new_user` de `anon`/`authenticated` (fechava uma impersonação sem senha via `POST /rpc/mint_session_token`).
  - RLS habilitada em `user_roles` + tabelas legadas `metas`/`saldo_casas`/`historico_saldos`.
  - `search_path` fixo nas funções de auth custom.
  - Migrations que documentam isso: `supabase/migrations/20260714120000_versionar_auth_custom_e_rls.sql` e `20260714130000_harden_session_token_e_rls.sql`. **Já refletem o estado real do banco** — se rodar `supabase db push`/`db diff`, não devem gerar mudança (é só documentação/versionamento do que já existe).
  - Nova migration `20260715090000_index_aposta_user_data.sql` — índice `aposta(user_id, data desc)`. Esta **ainda NÃO foi aplicada** ao banco (as duas de cima sim, essa não) — é puramente aditiva e segura, aplicar junto no deploy.

- **Fase 1 — segurança (código local, ainda não deployado):**
  - Edge functions (`ai-assistant`, `ai-insights`, `extract-bet-image`) agora derivam o `user_id` do header `x-session-token` (nunca mais do corpo da requisição) via `supabase/functions/_shared/auth.ts`. Retornam 401 sem token válido.
  - CORS travado por allowlist em `supabase/functions/_shared/cors.ts` (antes era `*`).
  - `extract-bet-image` ganhou limite de tamanho de imagem e mensagens de erro sanitizadas (não vazam mais detalhe do provider).
  - `supabase/config.toml` agora versiona `verify_jwt = false` explicitamente para as 3 functions (elas fazem a própria autenticação via `x-session-token`).
  - Frontend: `src/integrations/supabase/client.ts` injeta `x-session-token` em toda requisição (fetch global) — isso conserta as telas de dados, que hoje devem estar retornando vazias porque a RLS já está ligada mas o client nunca mandava o token.
  - `src/hooks/useAuth.ts` força um novo login se a sessão salva no localStorage não tiver `session_token` (sessões antigas).

- **Fase 3.5 — instruções de extração pela IA:**
  - Regra "partida sempre com 'x'" (nunca "vs") virou padrão no prompt de `extract-bet-image`; UI de instruções personalizadas ficou mais descobrível ("Ensinar a IA"), replicada em Configurações, e há "aprender pela correção" (toast oferece salvar regra quando você corrige casa/torneio no review).

- **Fase 2 — dívida técnica (código local, ainda não deployado nem compilado):**
  - **Formulário único** `src/components/apostas/ApostaForm.tsx`: substitui as implementações separadas de `CreateApostaDialog`/`EditApostaDialog`/review do `ImportarAposta` (~1.500 linhas de duplicação), com um schema Zod único (`apostaFormSchema`) e validação idêntica nos 3 caminhos. Data virou string (`<Input type="date">`) em vez do Calendar+Popover de antes. Cadastro manual **mantido** (era pra continuar existindo, só unificar validação).
  - **React Query**: `src/hooks/useApostasQuery.ts` + `useBookiesQuery.ts`. As 5 telas de dados (`Apostas`, `Dashboard`, `Resultados`, `Banca`, `Analises`) trocaram `useState`+`loadData()` manual por `useQuery`; criar/editar/excluir chama `invalidateQueries` em vez de recarregar na mão.
  - **Edge functions**: novo `supabase/functions/_shared/ai-providers.ts` centraliza as chamadas a OpenAI/Groq/NVIDIA e o parsing de JSON (antes duplicado em `ai-insights` e `extract-bet-image`). **Não** unifiquei o motor de cálculo de KPIs entre `ai-assistant` e `ai-insights` (comportamentos diferentes, mudança arriscada sem como testar) — fica documentado como pendência.
  - **Higiene**: `dev-dist/` no `.gitignore` (⚠️ já estava commitado antes — precisa `git rm -r --cached dev-dist` no momento do commit, senão continua rastreado), `NotFound.tsx` reescrito (era boilerplate em inglês fora do tema), `public/placeholder.svg` removido (morto), `.env.example` criado.

## O que falta rodar (nesta ordem — a ordem importa)

0. **Retomar e concluir o push para os dois repos** (`Logos-Tech` só com esta pasta, e `Win-Analytics` standalone) — foi pausado a meio caminho. Ver histórico da sessão para o estado exato de cada clone/staging.

1. **Instalar dependências e validar build**, a partir da raiz deste repo:
   ```bash
   npm install   # ou: bun install
   npm run lint
   npx tsc --noEmit
   npm run build
   ```
   Corrigir qualquer erro de tipo antes de seguir — **nada disso foi compilado ainda** (ambiente sem node_modules). Dado o volume de mudanças da Fase 2 (formulário único + React Query em 5 telas), esse passo é o mais importante antes de deployar.

2. **Deploy do frontend.** Se este repo estiver conectado à Vercel via GitHub App, o push para `main` já deve ter dado (ou vai dar) um deploy automático. Confirmar no dashboard da Vercel que o build passou. Se não houver integração automática: `vercel --prod`.

   ⚠️ **Fazer isso ANTES do passo 3.** As edge functions novas exigem `x-session-token`; se elas forem deployadas antes do frontend que envia esse header, o app quebra para quem já estiver com a versão antiga em cache/aberta.

3. **Deploy das Edge Functions** (isso NÃO acontece via push do GitHub — precisa rodar manualmente):
   ```bash
   supabase functions deploy ai-assistant      --project-ref cjlvcjfuntfbdrrkigwh
   supabase functions deploy ai-insights       --project-ref cjlvcjfuntfbdrrkigwh
   supabase functions deploy extract-bet-image --project-ref cjlvcjfuntfbdrrkigwh
   ```
   (ou pelo Supabase Dashboard → Edge Functions → deploy manual de cada uma; ou pela ferramenta MCP `deploy_edge_function` se a sessão tiver acesso a ela).

4. **Aplicar a migration do índice** (`20260715090000_index_aposta_user_data.sql`) — `supabase db push` ou via MCP `apply_migration`. Aditiva, sem risco.

5. **Definir o secret `ALLOWED_ORIGINS`** para o CORS (ajustar para o domínio real de produção):
   ```bash
   supabase secrets set ALLOWED_ORIGINS=https://win-analytics.vercel.app --project-ref cjlvcjfuntfbdrrkigwh
   ```
   O `_shared/cors.ts` já aceita automaticamente qualquer `*.vercel.app` que comece com `win-analytics` (previews), então isso é principalmente para fixar o domínio de produção definitivo caso seja outro (domínio próprio, por exemplo).

6. **Avisar/relogar os 2 usuários existentes.** Sessões antigas (sem `session_token`) são detectadas e forçam um novo login automaticamente (`useAuth.ts`), mas é bom confirmar que o login funciona (RPC `authenticate_custom_user` continua igual, só o token que agora é usado de fato).

7. **Testar ponta a ponta:**
   - Login → Dashboard/Apostas devem mostrar dados (antes deste fix, provavelmente apareciam vazios).
   - Criar, editar e excluir aposta pelos 3 caminhos (manual, editar existente, importar por print) — validação deve se comportar igual nos três.
   - Trocar de aba (Apostas → Dashboard → Análises) não deve mais precisar de botão "Atualizar" manual para refletir uma aposta recém-criada.
   - Assistente IA e Insights respondem normalmente (agora exigem estar logado).
   - Importar aposta por print: testar a normalização automática "vs → x" na partida.
   - Botão "Ensinar a IA" (import) e seção "Ensinar a IA" (Configurações) salvam e persistem instruções.
   - Corrigir a casa/torneio no review de uma importação → deve aparecer o toast "Notei uma correção" oferecendo salvar como regra.

## Pendências menores (não bloqueiam, ver plano completo)

Rate-limit por usuário nas edge functions, `search_path` em `match_documents`/`util.*`, mover extensão `vector` para fora do schema `public`, upgrade de versão do Postgres, paginação real nas listagens (exige mover cálculo de KPIs pro servidor primeiro), unificar `date-fns`/`dayjs`, unificar motor de analytics entre `ai-assistant`/`ai-insights`.

O plano completo (Fase 3, o brainstorm de IA/automação) está registrado na sessão do Claude Code que fez esse trabalho — pedir para retomar a partir daí se for continuar a evolução do app.
