# Guia de Verificação do Webhook Supabase

Este guia ajuda você a verificar e testar o webhook configurado no Supabase.

## Webhook Configurado

```sql
CREATE TRIGGER "my_webhook" 
AFTER INSERT ON "public"."my_table" 
FOR EACH ROW
EXECUTE FUNCTION "supabase_functions"."http_request"(
    'http://host.docker.internal:3000',
    'POST',
    '{"Content-Type":"application/json"}',
    '{}',
    '1000'
);
```

## Passos para Verificação

### 1. Iniciar o Servidor de Teste

Primeiro, inicie o servidor que receberá os webhooks:

```bash
node webhook-test-server.js
```

O servidor iniciará na porta 3000 e mostrará logs detalhados de todas as requisições recebidas.

### 2. Executar Verificação Automática

Execute o script de verificação para testar a conectividade:

```bash
node verify-webhook-access.js
```

Este script irá:
- ✅ Testar conexão com Supabase
- ✅ Verificar se a tabela existe
- ✅ Testar o endpoint do webhook
- ✅ Mostrar configurações do trigger

### 3. Configurar o Trigger no Supabase

Execute o SQL no Supabase SQL Editor:

```bash
# Abra o arquivo e copie o conteúdo para o Supabase
type verify-webhook-trigger.sql
```

Ou execute diretamente no Supabase Dashboard > SQL Editor.

### 4. Testar o Webhook

Após configurar o trigger, teste inserindo dados:

```sql
INSERT INTO public.my_table (data) 
VALUES ('{"test": true, "message": "Teste manual", "timestamp": "' || NOW() || '"}');
```

## Verificações de Troubleshooting

### Problema: Endpoint não acessível

**Sintomas:**
- Webhook não dispara
- Erro de conexão nos logs

**Soluções:**
1. Verifique se o servidor está rodando na porta 3000
2. Teste manualmente: `curl http://localhost:3000`
3. Se usando Docker, verifique se `host.docker.internal` está funcionando

### Problema: Trigger não existe

**Sintomas:**
- Inserções não disparam webhook
- Trigger não aparece nas verificações

**Soluções:**
1. Execute o SQL de criação do trigger novamente
2. Verifique permissões no Supabase
3. Confirme que a extensão `http` está habilitada

### Problema: Dados não chegam

**Sintomas:**
- Trigger existe mas webhook não recebe dados
- Servidor não mostra requisições

**Soluções:**
1. Verifique logs do Supabase (se disponíveis)
2. Teste com timeout maior (5000ms)
3. Verifique se a URL está correta

## Comandos Úteis

### Verificar se o servidor está rodando
```bash
curl http://localhost:3000/health
```

### Testar webhook manualmente
```bash
curl -X POST http://localhost:3000 \
  -H "Content-Type: application/json" \
  -d '{"test": "manual webhook test"}'
```

### Verificar logs do Supabase (se disponível)
No Supabase Dashboard > Logs > Database

## Estrutura dos Arquivos Criados

- `webhook-test-server.js` - Servidor para receber webhooks
- `verify-webhook-access.js` - Script de verificação automática
- `verify-webhook-trigger.sql` - SQL para configurar o trigger
- `WEBHOOK_VERIFICATION_GUIDE.md` - Este guia

## Próximos Passos

Após verificar que o webhook funciona:

1. **Integrar com sua aplicação**: Substitua a URL de teste pela URL real da sua API
2. **Adicionar autenticação**: Implemente verificação de assinatura/token
3. **Configurar para tabelas reais**: Aplique o webhook nas tabelas do seu sistema
4. **Monitoramento**: Configure logs e alertas para webhooks

## Exemplo de Uso Real

Para usar com suas tabelas reais (ex: Consultas):

```sql
CREATE TRIGGER consulta_webhook
AFTER INSERT OR UPDATE ON public.Consultas
FOR EACH ROW
EXECUTE FUNCTION supabase_functions.http_request(
    'https://sua-api.com/webhooks/consulta',
    'POST',
    '{"Content-Type":"application/json", "Authorization":"Bearer seu-token"}',
    '{}',
    '5000'
);
```

## Suporte

Se encontrar problemas:
1. Verifique os logs do servidor de teste
2. Execute o script de verificação
3. Confirme as configurações no Supabase Dashboard
4. Teste a conectividade manualmente