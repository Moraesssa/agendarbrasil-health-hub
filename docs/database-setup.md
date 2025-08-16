# Configuração do Banco de Dados - AgendarBrasil Health Hub

Este documento descreve o processo completo de configuração do banco de dados Supabase para o AgendarBrasil Health Hub, incluindo a execução dos scripts SQL necessários para o funcionamento correto da plataforma.

## Visão Geral

O sistema utiliza PostgreSQL através do Supabase com Row Level Security (RLS) para controle de acesso aos dados. A configuração envolve a execução sequencial de 4 scripts SQL que corrigem políticas de segurança, dados de localização e funções de busca.

## Scripts de Configuração

### Script 1: Configuração de Políticas RLS
**Arquivo:** `EXECUTAR-NO-SUPABASE-1.sql`

**Objetivo:** Configurar políticas de Row Level Security para permitir acesso público aos dados de médicos e locais de atendimento.

**Funcionalidades:**
- Remove políticas restritivas existentes
- Cria políticas públicas para leitura de dados
- Permite acesso anônimo necessário para busca de profissionais
- Essencial para funcionamento da busca por especialidade e localização

**Políticas Criadas:**
- `medicos_public_select`: Permite leitura pública da tabela médicos
- `locais_public_select`: Permite leitura pública da tabela locais_atendimento

### Script 2: Correção de Dados de Localização
**Arquivo:** `EXECUTAR-NO-SUPABASE-2.sql`

**Objetivo:** Corrigir e padronizar dados de localização baseados no CRM dos médicos.

**Funcionalidades:**
- Atualiza campos cidade/estado baseado no CRM dos médicos
- Mapeia estados brasileiros (MG, SP, SC, AM, DF) para cidades principais
- Garante consistência dos dados geográficos no sistema
- Corrige registros com informações de localização incompletas

**Mapeamento de Estados:**
- MG → Belo Horizonte
- SP → São Paulo
- SC → Florianópolis
- AM → Manaus
- Outros → Brasília (DF)

### Script 3: Otimização da Função get_available_cities
**Arquivo:** `EXECUTAR-NO-SUPABASE-3.sql`

**Objetivo:** Reescrever a função para retornar apenas cidades com médicos reais cadastrados.

**Melhorias Implementadas:**
- Retorna apenas cidades onde há médicos efetivamente cadastrados
- Inclui contagem de médicos por cidade para informação do usuário
- Filtra registros com campos cidade/estado nulos
- Performance otimizada com JOINs diretos entre tabelas
- Ordenação alfabética das cidades para melhor UX

**Assinatura da Função:**
```sql
CREATE OR REPLACE FUNCTION public.get_available_cities(state_uf text)
RETURNS TABLE(cidade text, estado text, total_medicos bigint)
```

### Script 4: Correção da Função get_doctors_by_location_and_specialty
**Arquivo:** `EXECUTAR-NO-SUPABASE-4.sql`

**Objetivo:** Corrigir e otimizar a função de busca de médicos por especialidade e localização.

**Funcionalidades:**
- Implementa busca eficiente por especialidade usando operador `ANY`
- Filtragem precisa por cidade e estado
- Retorna dados completos do médico e local de atendimento
- Inclui testes de validação antes e depois da correção
- Performance otimizada com JOINs eficientes

**Assinatura da Função:**
```sql
CREATE OR REPLACE FUNCTION public.get_doctors_by_location_and_specialty(
    p_specialty text,
    p_city text,
    p_state text
)
RETURNS TABLE(
    id uuid,
    display_name text,
    crm text,
    especialidades text[],
    local_nome text,
    local_cidade text,
    local_estado text,
    local_endereco text,
    local_telefone text
)
```

**Exemplo de Uso:**
```sql
-- Buscar cardiologistas em Belo Horizonte, MG
SELECT * FROM get_doctors_by_location_and_specialty('Cardiologia', 'Belo Horizonte', 'MG');

-- Buscar pediatras em São Paulo, SP
SELECT * FROM get_doctors_by_location_and_specialty('Pediatria', 'São Paulo', 'SP');
```

## Processo de Execução

### Pré-requisitos
1. Acesso ao Supabase SQL Editor
2. Permissões de administrador no projeto Supabase
3. Backup dos dados existentes (recomendado)

### Ordem de Execução

Execute os scripts na seguinte ordem **obrigatória**:

1. **EXECUTAR-NO-SUPABASE-1.sql** - Configurar políticas RLS
2. **EXECUTAR-NO-SUPABASE-2.sql** - Corrigir dados de localização  
3. **EXECUTAR-NO-SUPABASE-3.sql** - Otimizar função de cidades
4. **EXECUTAR-NO-SUPABASE-4.sql** - Corrigir função de busca de médicos

### Instruções Detalhadas

1. **Abra o Supabase SQL Editor**
   - Acesse seu projeto no Supabase Dashboard
   - Navegue para SQL Editor

2. **Execute o Script 1**
   - Copie todo o conteúdo de `EXECUTAR-NO-SUPABASE-1.sql`
   - Cole no SQL Editor e execute
   - Verifique se as políticas foram criadas corretamente

3. **Execute o Script 2**
   - Copie todo o conteúdo de `EXECUTAR-NO-SUPABASE-2.sql`
   - Cole no SQL Editor e execute
   - Verifique se os dados de localização foram atualizados

4. **Execute o Script 3**
   - Copie todo o conteúdo de `EXECUTAR-NO-SUPABASE-3.sql`
   - Cole no SQL Editor e execute
   - Teste a função `get_available_cities` com diferentes estados

5. **Execute o Script 4**
   - Copie todo o conteúdo de `EXECUTAR-NO-SUPABASE-4.sql`
   - Cole no SQL Editor e execute
   - Teste a função `get_doctors_by_location_and_specialty` com diferentes parâmetros

### Validação da Configuração

Após executar todos os scripts, valide a configuração:

```sql
-- Verificar políticas RLS
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('medicos', 'locais_atendimento');

-- Testar função de cidades
SELECT * FROM get_available_cities('MG');

-- Testar função de busca de médicos
SELECT * FROM get_doctors_by_location_and_specialty('Cardiologia', 'Belo Horizonte', 'MG');

-- Verificar dados de localização
SELECT DISTINCT cidade, estado, COUNT(*) as total
FROM public.locais_atendimento 
WHERE cidade IS NOT NULL AND estado IS NOT NULL
GROUP BY cidade, estado
ORDER BY estado, cidade;
```

## Troubleshooting

### Problemas Comuns

**Erro: "permission denied for table"**
- Verifique se as políticas RLS foram criadas corretamente
- Execute novamente o Script 1

**Função retorna resultados vazios**
- Verifique se os dados de localização foram atualizados
- Execute novamente o Script 2
- Confirme se há médicos cadastrados com as especialidades buscadas

**Erro: "function does not exist"**
- Verifique se a função foi criada corretamente
- Execute novamente o script correspondente
- Confirme a sintaxe da chamada da função

### Logs e Debugging

Para debugging, utilize os comandos de teste incluídos em cada script:

```sql
-- Ver status das tabelas
SELECT 'Verificando tabelas...' as status;
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('medicos', 'locais_atendimento', 'profiles');

-- Ver dados de exemplo
SELECT 'Dados de exemplo...' as status;
SELECT m.crm, p.display_name, la.cidade, la.estado
FROM public.medicos m
JOIN public.profiles p ON m.user_id = p.id
JOIN public.locais_atendimento la ON m.user_id = la.medico_id
LIMIT 5;
```

## Manutenção

### Atualizações Regulares

- **Dados de Localização**: Execute o Script 2 periodicamente se novos médicos forem adicionados
- **Performance**: Monitore a performance das funções e otimize conforme necessário
- **Políticas RLS**: Revise as políticas de segurança regularmente

### Backup e Recuperação

Antes de executar qualquer script:
1. Faça backup completo do banco de dados
2. Teste em ambiente de desenvolvimento primeiro
3. Documente quaisquer customizações específicas do seu projeto

## Suporte

Para problemas relacionados à configuração do banco de dados:
1. Verifique os logs do Supabase
2. Consulte a documentação oficial do Supabase
3. Execute os scripts de validação incluídos
4. Revise este documento para troubleshooting