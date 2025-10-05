# 🔍 Guia de Correção - Busca de Médicos

## 🎯 Problema

Na etapa 4 do `/agendamento`, o médico **davirh1221** não aparece na lista, mesmo estando cadastrado para a região específica.

## 🔍 Possíveis Causas

1. ❌ Função de busca com JOIN incorreto
2. ❌ Incompatibilidade de tipos (UUID vs BIGINT)
3. ❌ Busca muito restritiva (case-sensitive, exact match)
4. ❌ Médico sem local de atendimento ativo
5. ❌ Especialidade não cadastrada corretamente

## ✅ Solução

Execute o script `FIX_BUSCA_MEDICOS_V2_FINAL.sql` ⭐ (versão corrigida) que:

1. **Diagnostica** os dados do médico davirh1221
2. **Recria** a função de busca com melhorias
3. **Testa** automaticamente
4. **Mostra** os resultados

## 🚀 Como Aplicar

### Passo 1: Execute o Script
```
1. Abra Supabase Dashboard → SQL Editor
2. Cole o conteúdo de FIX_BUSCA_MEDICOS_V2_FINAL.sql ⭐
3. Execute (Run)
4. Leia os logs/resultados
```

**IMPORTANTE:** Use a versão V2 FINAL que detecta automaticamente os nomes das colunas!

### Passo 2: Analise os Resultados

O script mostrará:

```
✅ Médico encontrado:
   ID: [uuid]
   Nome: [nome]
   Especialidades: [lista]
   Locais ativos: [número]

✅ Resultado da busca: X médicos encontrados
```

### Passo 3: Verifique o Problema

Se o médico **NÃO for encontrado**:
```
❌ Médico não encontrado com identificador "davirh1221"
   → Verifique o cadastro
```

Se o médico **não tem locais ativos**:
```
⚠️ Nenhum local de atendimento cadastrado!
   → Cadastre um local de atendimento
```

Se o médico **não aparece na busca**:
```
❌ Médico NÃO aparece nos resultados!
   → Verifique especialidades e localização
```

## 🔧 Melhorias Implementadas

### Antes (Função Antiga)
```sql
-- JOIN rígido
JOIN locais_atendimento l ON l.medico_id = m.user_id

-- Busca exata
WHERE l.cidade = p_city

-- Sem tratamento de tipos
```

### Depois (Função Nova)
```sql
-- JOIN flexível com conversão de tipos
INNER JOIN locais_atendimento la ON (
  la.medico_id::text = m.id::text OR 
  la.medico_id::text = m.user_id::text
)

-- Busca flexível (case-insensitive, partial match)
WHERE LOWER(la.cidade) = LOWER(p_city) OR
      la.cidade ILIKE '%' || p_city || '%'

-- Busca de especialidade flexível
WHERE p_specialty = ANY(m.especialidades) OR
      EXISTS (
        SELECT 1 FROM unnest(m.especialidades) AS esp
        WHERE esp ILIKE '%' || p_specialty || '%'
      )
```

## 📊 Testes Incluídos

O script executa automaticamente:

1. ✅ Buscar todos os médicos
2. ✅ Buscar por estado
3. ✅ Buscar por especialidade
4. ✅ Buscar médico específico (davirh1221)

## 🐛 Troubleshooting

### Médico não aparece mesmo após o fix

**1. Verificar cadastro completo:**
```sql
SELECT 
  m.id,
  m.user_id,
  p.display_name,
  p.email,
  m.especialidades,
  m.crm
FROM medicos m
LEFT JOIN profiles p ON p.id = m.user_id
WHERE p.email ILIKE '%davirh1221%'
   OR p.display_name ILIKE '%davirh1221%';
```

**2. Verificar locais de atendimento:**
```sql
SELECT 
  la.id,
  la.nome,
  la.cidade,
  la.estado,
  la.ativo,
  la.medico_id
FROM locais_atendimento la
WHERE la.medico_id::text IN (
  SELECT id::text FROM medicos m
  LEFT JOIN profiles p ON p.id = m.user_id
  WHERE p.email ILIKE '%davirh1221%'
);
```

**3. Testar busca diretamente:**
```sql
-- Substitua pelos valores reais
SELECT * FROM get_doctors_by_location_and_specialty(
  'Cardiologia',  -- especialidade
  'São Paulo',    -- cidade
  'SP'            -- estado
);
```

### Médico existe mas não tem locais

**Cadastrar local de atendimento:**
```sql
INSERT INTO locais_atendimento (
  medico_id,
  nome,
  endereco,
  cidade,
  estado,
  ativo
) VALUES (
  '[ID_DO_MEDICO]'::uuid,
  'Consultório Principal',
  'Rua Exemplo, 123',
  'São Paulo',
  'SP',
  true
);
```

### Especialidade não está cadastrada

**Atualizar especialidades:**
```sql
UPDATE medicos
SET especialidades = ARRAY['Cardiologia', 'Clínica Geral']
WHERE id = '[ID_DO_MEDICO]'::uuid;
```

## ✅ Checklist de Validação

Após executar o script:

- [ ] Script executado sem erros
- [ ] Médico davirh1221 encontrado no diagnóstico
- [ ] Médico tem pelo menos 1 local ativo
- [ ] Médico tem especialidades cadastradas
- [ ] Médico aparece nos resultados da busca
- [ ] Função recriada com sucesso
- [ ] Testes passaram
- [ ] Frontend testado em /agendamento

## 🎯 Resultado Esperado

```
╔════════════════════════════════════════════════════════════╗
║                   ✅ SUCESSO!                             ║
╚════════════════════════════════════════════════════════════╝

✅ Médico davirh1221 encontrado
✅ Locais de atendimento ativos: 1+
✅ Aparece nos resultados da busca
✅ Função de busca corrigida
✅ Testes passaram

Próximo passo: Teste em /agendamento
```

## 📞 Próximos Passos

1. **Execute** `FIX_BUSCA_MEDICOS.sql`
2. **Leia** os logs de diagnóstico
3. **Corrija** problemas identificados (se houver)
4. **Teste** em `/agendamento`
5. **Verifique** se o médico aparece na etapa 4

## 💡 Dicas

- **Busca flexível:** A nova função aceita variações de escrita
- **Case-insensitive:** Não importa maiúsculas/minúsculas
- **Partial match:** Aceita correspondências parciais
- **Múltiplos IDs:** Tenta tanto `medico_id` quanto `user_id`

---

**Versão:** 1.0  
**Data:** 2025-01-05  
**Status:** ✅ Pronto para uso
