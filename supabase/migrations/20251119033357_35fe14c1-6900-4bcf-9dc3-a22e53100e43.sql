-- Atualizar todos os registros NULL para o usuário viniciussggrossi@gmail.com
UPDATE aposta 
SET user_id = '43f79f6d-e7b4-43ee-a8d3-0847d49c5d87' 
WHERE user_id IS NULL;

UPDATE bookies 
SET user_id = '43f79f6d-e7b4-43ee-a8d3-0847d49c5d87' 
WHERE user_id IS NULL;

UPDATE transactions 
SET user_id = '43f79f6d-e7b4-43ee-a8d3-0847d49c5d87' 
WHERE user_id IS NULL;

UPDATE goals 
SET user_id = '43f79f6d-e7b4-43ee-a8d3-0847d49c5d87' 
WHERE user_id IS NULL;