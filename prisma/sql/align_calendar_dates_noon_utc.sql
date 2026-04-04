-- Opcional: corrige registros gravados como meia-noite UTC (comportamento antigo na Vercel).
-- Passa o instante para meio-dia UTC no mesmo dia civil, alinhado ao app.
-- Executar manualmente no SQL Editor do Supabase após backup/revisão.
--
-- Não reexecute se já houver dados ao meio-dia UTC (o WHERE restringe a 00:00 UTC).

UPDATE "Income"
SET "date" = "date" + interval '12 hours'
WHERE ("date" AT TIME ZONE 'UTC')::time = '00:00:00';

UPDATE "Expense"
SET "date" = "date" + interval '12 hours'
WHERE ("date" AT TIME ZONE 'UTC')::time = '00:00:00';
