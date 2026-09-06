-- Ajustes de prompt por campo do extrator de apostas.
-- custom_instructions (text) continua sendo o bucket "Geral" — zero migração de dados.
alter table public.ai_extraction_settings
    add column if not exists section_instructions jsonb not null default '{}'::jsonb;

-- RLS já cobre a tabela inteira (policies por user_id em select/insert/update);
-- a coluna nova entra nessas policies sem alteração.
