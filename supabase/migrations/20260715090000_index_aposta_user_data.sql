-- Toda leitura de `aposta` filtra por user_id e ordena por data desc
-- (services/apostas.ts, edge functions ai-assistant/ai-insights), mas não
-- havia índice cobrindo esse padrão — cada query varria a tabela inteira.
create index if not exists idx_aposta_user_id_data
  on public.aposta (user_id, data desc);
