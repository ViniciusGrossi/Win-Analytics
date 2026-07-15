-- ============================================================================
-- Versiona o modelo de AUTH CUSTOM + RLS que hoje só existe no banco (schema drift).
--
-- Contexto: o app usa autenticação custom (tabela `profiles` com `password_hash`
-- bcrypt) e um JWT de sessão próprio enviado no header `x-session-token`. As RLS
-- das tabelas de domínio derivam a identidade de `current_session_user_id()`.
-- Esses objetos foram criados pelo dashboard e NÃO estavam sob controle de versão.
--
-- ⚠️ Este arquivo REPRODUZ o estado atual de produção (idempotente). Não re-aplicar
--    cegamente sobre o projeto vivo — serve para versionar e recriar em novos ambientes.
--    O segredo de assinatura (private.app_secrets.custom_session_secret) NÃO está aqui:
--    deve ser definido manualmente em cada ambiente.
-- ============================================================================

-- Extensões necessárias (assinatura/verificação de JWT + bcrypt)
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists pgjwt   with schema extensions;

-- Segredo de sessão (valor definido fora do versionamento)
create schema if not exists private;
create table if not exists private.app_secrets (
  key   text primary key,
  value text not null
);
-- Em cada ambiente, definir uma vez (NUNCA commitar o valor real):
--   insert into private.app_secrets(key, value)
--   values ('custom_session_secret', '<segredo-forte-aleatorio>')
--   on conflict (key) do nothing;

-- ── Funções de sessão (JWT custom) ─────────────────────────────────────────
create or replace function public.mint_session_token(p_user_id uuid)
returns text
language sql
security definer
set search_path to 'public', 'extensions', 'private'
as $function$
  select extensions.sign(
    json_build_object(
      'sub', p_user_id::text,
      'exp', extract(epoch from (now() + interval '30 days'))::integer
    ),
    (select value from private.app_secrets where key = 'custom_session_secret')
  );
$function$;

create or replace function public.verify_session_token(p_token text)
returns uuid
language plpgsql
security definer
set search_path to 'public', 'extensions', 'private'
as $function$
declare
  v_result record;
begin
  if p_token is null or p_token = '' then
    return null;
  end if;

  select * into v_result
  from extensions.verify(p_token, (select value from private.app_secrets where key = 'custom_session_secret'));

  if v_result.valid is not true then
    return null;
  end if;

  return (v_result.payload->>'sub')::uuid;
exception when others then
  return null;
end;
$function$;

-- Lê o token do header x-session-token e devolve o user_id — usada nas RLS.
create or replace function public.current_session_user_id()
returns uuid
language sql
stable security definer
set search_path to 'public', 'extensions'
as $function$
  select public.verify_session_token(
    (current_setting('request.headers', true)::json)->>'x-session-token'
  );
$function$;

-- ── Autenticação custom (bcrypt) ───────────────────────────────────────────
create or replace function public.authenticate_custom_user(p_email text, p_password text)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_user record;
begin
  select id, email, password_hash into v_user
  from public.profiles
  where email = p_email;

  if v_user.id is not null and v_user.password_hash = crypt(p_password, v_user.password_hash) then
    return jsonb_build_object('id', v_user.id, 'email', v_user.email, 'session_token', public.mint_session_token(v_user.id));
  else
    return jsonb_build_object('error', 'Credenciais inválidas');
  end if;
end;
$function$;

create or replace function public.create_custom_user(p_email text, p_password text)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_user_id uuid;
begin
  if exists (select 1 from public.profiles where email = p_email) then
    return jsonb_build_object('error', 'Usuário já existe');
  end if;

  insert into public.profiles (email, password_hash)
  values (p_email, crypt(p_password, gen_salt('bf')))
  returning id into v_user_id;

  return jsonb_build_object('id', v_user_id, 'email', p_email, 'session_token', public.mint_session_token(v_user_id));
exception when others then
  return jsonb_build_object('error', sqlerrm);
end;
$function$;

-- ── RLS das tabelas de domínio (baseada em current_session_user_id()) ──────
-- Padrão: dono OU admin para ler/alterar/apagar; INSERT exige que a linha seja do próprio.
do $$
declare
  t text;
begin
  foreach t in array array['aposta','bookies','goals','transactions'] loop
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists "Users can view their own %1$s" on public.%1$s', t);
    execute format($p$create policy "Users can view their own %1$s" on public.%1$s
      for select using ((current_session_user_id() = user_id) or has_role(current_session_user_id(), 'admin'::app_role))$p$, t);

    execute format('drop policy if exists "Users can insert their own %1$s" on public.%1$s', t);
    execute format($p$create policy "Users can insert their own %1$s" on public.%1$s
      for insert with check (current_session_user_id() = user_id)$p$, t);

    execute format('drop policy if exists "Users can update their own %1$s" on public.%1$s', t);
    execute format($p$create policy "Users can update their own %1$s" on public.%1$s
      for update using ((current_session_user_id() = user_id) or has_role(current_session_user_id(), 'admin'::app_role))$p$, t);

    execute format('drop policy if exists "Users can delete their own %1$s" on public.%1$s', t);
    execute format($p$create policy "Users can delete their own %1$s" on public.%1$s
      for delete using ((current_session_user_id() = user_id) or has_role(current_session_user_id(), 'admin'::app_role))$p$, t);
  end loop;
end $$;

-- ai_extraction_settings: dono, sem admin e sem delete
alter table public.ai_extraction_settings enable row level security;
drop policy if exists "Users can view their own extraction settings" on public.ai_extraction_settings;
create policy "Users can view their own extraction settings" on public.ai_extraction_settings
  for select using (current_session_user_id() = user_id);
drop policy if exists "Users can insert their own extraction settings" on public.ai_extraction_settings;
create policy "Users can insert their own extraction settings" on public.ai_extraction_settings
  for insert with check (current_session_user_id() = user_id);
drop policy if exists "Users can update their own extraction settings" on public.ai_extraction_settings;
create policy "Users can update their own extraction settings" on public.ai_extraction_settings
  for update using (current_session_user_id() = user_id);

-- profiles: cada um vê/edita o próprio (admin pode ver)
alter table public.profiles enable row level security;
drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile" on public.profiles
  for select using ((current_session_user_id() = id) or has_role(current_session_user_id(), 'admin'::app_role));
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles
  for update using (current_session_user_id() = id);
