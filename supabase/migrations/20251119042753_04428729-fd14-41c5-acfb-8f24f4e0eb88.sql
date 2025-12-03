-- Adicionar valor padrão auth.uid() para user_id nas tabelas
-- Isso preenche automaticamente o user_id com o ID do usuário autenticado

ALTER TABLE aposta
ALTER COLUMN user_id SET DEFAULT auth.uid();

ALTER TABLE bookies
ALTER COLUMN user_id SET DEFAULT auth.uid();

ALTER TABLE transactions
ALTER COLUMN user_id SET DEFAULT auth.uid();

ALTER TABLE goals
ALTER COLUMN user_id SET DEFAULT auth.uid();