-- Reconectar apostas ao usuário admin
UPDATE aposta 
SET user_id = '43f79f6d-e7b4-43ee-a8d3-0847d49c5d87'
WHERE user_id IS NULL;

-- Reconectar bookies ao usuário admin  
UPDATE bookies
SET user_id = '43f79f6d-e7b4-43ee-a8d3-0847d49c5d87'
WHERE user_id IS NULL;

-- Reconectar transactions ao usuário admin
UPDATE transactions
SET user_id = '43f79f6d-e7b4-43ee-a8d3-0847d49c5d87'
WHERE user_id IS NULL;

-- Reconectar goals ao usuário admin
UPDATE goals
SET user_id = '43f79f6d-e7b4-43ee-a8d3-0847d49c5d87'
WHERE user_id IS NULL;