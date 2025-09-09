# Guia de Correção: Erro "Could not find the 'onboarding_completed' column"

## 🎯 Problema Identificado

O erro ocorre porque o código da aplicação está tentando atualizar a coluna `onboarding_completed` na tabela `profiles`, mas essa coluna não existe no banco de dados.

### Sequência do Erro:
1. Usuário clica para selecionar tipo "paciente"
2. Aplicação chama `updateUserType()` no `authService.ts`
3. Código tenta fazer `UPDATE profiles SET onboarding_completed = false`
4. PostgREST retorna erro PGRST204: coluna não encontrada

## 🔧 Soluções Disponíveis

### Opção 1: Correção Rápida (Recomendada)
Execute o script que adiciona apenas a coluna faltante:

```sql
-- Execute no Editor SQL do Supabase Dashboard
-- Arquivo: FIX_ONBOARDING_COLUMN_SAFE.sql
```

### Opção 2: Correção Completa
Execute o script que verifica e adiciona todas as colunas necessárias:

```sql
-- Execute no Editor SQL do Supabase Dashboard  
-- Arquivo: FIX_PROFILES_COLUMNS_COMPLETE.sql
```

### Opção 3: Diagnóstico Primeiro
Se não tem certeza da estrutura atual do banco:

```sql
-- Execute primeiro para diagnosticar
-- Arquivo: SAFE_DATABASE_DIAGNOSTIC.sql
```

## 📋 Passos para Correção

### 1. Acesse o Supabase Dashboard
- Vá para [supabase.com](https://supabase.com)
- Entre no seu projeto
- Clique em "SQL Editor" no menu lateral

### 2. Execute o Script de Correção
- Copie o conteúdo do arquivo `FIX_ONBOARDING_COLUMN_SAFE.sql`
- Cole no editor SQL
- Clique em "Run" para executar

### 3. Verifique se Funcionou
O script deve retornar:
```
Coluna onboarding_completed adicionada com sucesso!
```

### 4. Teste a Aplicação
- Volte para sua aplicação
- Tente selecionar o tipo de usuário novamente
- O erro deve ter desaparecido

## 🚨 Se o Problema Persistir

### Possíveis Causas:
1. **Cache do PostgREST**: O PostgREST pode estar usando cache antigo
   - **Solução**: Reinicie o projeto no Supabase ou aguarde alguns minutos

2. **Tabela profiles não existe**: O erro pode ser mais profundo
   - **Solução**: Execute `SAFE_DATABASE_DIAGNOSTIC.sql` primeiro

3. **Permissões RLS**: Políticas de segurança podem estar bloqueando
   - **Solução**: Verifique as políticas RLS na tabela profiles

### Comandos de Verificação:
```sql
-- Verificar se a coluna existe
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'onboarding_completed';

-- Verificar estrutura da tabela
\d profiles
```

## 📝 Arquivos Relacionados

- `FIX_ONBOARDING_COLUMN_SAFE.sql` - Correção segura da coluna
- `FIX_PROFILES_COLUMNS_COMPLETE.sql` - Correção completa de todas as colunas
- `SAFE_DATABASE_DIAGNOSTIC.sql` - Diagnóstico da estrutura do banco
- `src/services/authService.ts` - Código que usa a coluna
- `src/types/profiles.ts` - Definições de tipos

## ✅ Resultado Esperado

Após a correção, o fluxo deve funcionar assim:
1. Usuário clica em "Paciente" ou "Médico"
2. Sistema atualiza `user_type` e define `onboarding_completed = false`
3. Usuário é redirecionado para completar o cadastro
4. Após completar, `onboarding_completed` vira `true`

## 🎉 Conclusão

Este é um erro comum que acontece quando há dessincronia entre o código e o schema do banco. A correção é simples e direta: adicionar a coluna faltante com o tipo e valor padrão corretos.