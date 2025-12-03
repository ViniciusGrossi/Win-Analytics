-- Tornar user_id obrigatório (NOT NULL) nas tabelas principais
-- Isso previne que apostas sejam criadas sem usuário associado

ALTER TABLE aposta
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE bookies
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE transactions
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE goals
ALTER COLUMN user_id SET NOT NULL;