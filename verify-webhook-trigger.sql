-- Script para verificar e configurar o webhook trigger
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se a extensão http está habilitada
SELECT * FROM pg_extension WHERE extname = 'http';

-- Se não estiver habilitada, execute:
-- CREATE EXTENSION IF NOT EXISTS http;

-- 2. Verificar se a tabela my_table existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'my_table'
) as table_exists;

-- 3. Criar a tabela de teste se não existir
CREATE TABLE IF NOT EXISTS public.my_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Verificar se o trigger my_webhook existe
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'my_webhook';

-- 5. Criar ou recriar o trigger webhook
DROP TRIGGER IF EXISTS my_webhook ON public.my_table;

CREATE TRIGGER my_webhook
    AFTER INSERT ON public.my_table
    FOR EACH ROW
    EXECUTE FUNCTION supabase_functions.http_request(
        'http://host.docker.internal:3000',
        'POST',
        '{"Content-Type":"application/json"}',
        '{}',
        '1000'
    );

-- 6. Verificar se o trigger foi criado corretamente
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'my_webhook';

-- 7. Testar o webhook inserindo dados
INSERT INTO public.my_table (data) 
VALUES ('{"test": true, "message": "Teste do webhook", "timestamp": "' || NOW() || '"}');

-- 8. Verificar os dados inseridos
SELECT * FROM public.my_table ORDER BY created_at DESC LIMIT 5;

-- 9. Verificar logs de erro (se houver)
-- Nota: Os logs de webhook podem não estar visíveis diretamente no Supabase
-- Verifique os logs do seu servidor na porta 3000

-- 10. Informações sobre a configuração do webhook
SELECT 
    'Webhook configurado com sucesso!' as status,
    'my_webhook' as trigger_name,
    'public.my_table' as target_table,
    'INSERT' as trigger_event,
    'http://host.docker.internal:3000' as webhook_url,
    'POST' as http_method,
    '1000ms' as timeout;