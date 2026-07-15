-- ============================================================================
-- Hardening de segurança (Fase 1 Win Analytics) — APLICADO em produção 2026-07-14.
--
-- Fecha impersonação sem senha e expõe RLS nas tabelas ainda abertas ao anon.
-- Verificado: o frontend não chama estas funções/tabelas em runtime (só em types.ts).
-- ============================================================================

-- CRÍTICO: anon/authenticated NÃO podem mais emitir tokens de sessão arbitrários.
-- (Antes: POST /rpc/mint_session_token com qualquer user_id devolvia um token válido,
--  permitindo se passar por qualquer usuário sem senha.)
-- O Supabase concede EXECUTE explicitamente a anon/authenticated, então revoga-se de
-- PUBLIC e dos papéis nomeados. As funções internas (SECURITY DEFINER, owned pelo
-- postgres) e as edge functions (service_role) seguem chamando normalmente.
revoke execute on function public.mint_session_token(uuid)   from public, anon, authenticated;
revoke execute on function public.verify_session_token(text) from public, anon, authenticated;
revoke execute on function public.handle_new_user()          from public, anon, authenticated;

-- Edge functions validam o token de sessão via service_role.
grant execute on function public.verify_session_token(text) to service_role;

-- RLS nas tabelas públicas ainda expostas.
-- user_roles: has_role() é SECURITY DEFINER e continua lendo a tabela normalmente.
alter table public.user_roles enable row level security;

-- Tabelas legadas (não usadas pelo app) — RLS deny-all (sem policies): fora do acesso anon.
alter table public.metas            enable row level security;
alter table public.saldo_casas      enable row level security;
alter table public.historico_saldos enable row level security;
