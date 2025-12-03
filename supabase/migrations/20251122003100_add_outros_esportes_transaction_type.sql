-- Adiciona o tipo 'outros_esportes' à tabela transactions
-- Esta migration corrige o erro 400 ao tentar criar transações dessa categoria

-- Se houver uma constraint CHECK no campo type, precisamos removê-la e recriar
-- Primeiro, vamos verificar se existe alguma constraint e removê-la
DO $$ 
DECLARE
    constraint_name text;
BEGIN
    -- Buscar constraints CHECK na coluna type da tabela transactions
    FOR constraint_name IN 
        SELECT con.conname
        FROM pg_constraint con
        INNER JOIN pg_class rel ON rel.oid = con.conrelid
        INNER JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        WHERE nsp.nspname = 'public'
          AND rel.relname = 'transactions'
          AND con.contype = 'c'
          AND pg_get_constraintdef(con.oid) LIKE '%type%'
    LOOP
        EXECUTE format('ALTER TABLE public.transactions DROP CONSTRAINT %I', constraint_name);
    END LOOP;
END $$;

-- Adicionar nova constraint que inclui todos os tipos válidos
ALTER TABLE public.transactions
ADD CONSTRAINT transactions_type_check
CHECK (type IN ('deposit', 'withdraw', 'recarga', 'saque', 'transferencia', 'bonus', 'ajuste', 'outros_esportes'));
