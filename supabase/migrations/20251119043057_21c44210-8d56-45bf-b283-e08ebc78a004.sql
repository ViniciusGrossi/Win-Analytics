-- Remover obrigatoriedade do user_id mas manter preenchimento automático
-- Isso resolve problemas de criação mantendo a funcionalidade

ALTER TABLE aposta
ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE bookies
ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE transactions
ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE goals
ALTER COLUMN user_id DROP NOT NULL;