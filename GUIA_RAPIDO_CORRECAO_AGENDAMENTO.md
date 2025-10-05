# 🚀 Guia Rápido - Correção do Sistema de Agendamento

## ⚡ Problema
A página `/agendamento` não mostra horários disponíveis dos médicos.

## 🎯 Solução em 3 Passos

### Passo 1: Executar Script de Correção (5 minutos)

1. Abra o **Supabase Dashboard**
2. Vá em **SQL Editor** (menu lateral)
3. Clique em **New Query**
4. Cole o conteúdo do arquivo `FIX_AGENDAMENTO_HORARIOS_V2.sql` ⭐ **USE A VERSÃO 2**
5. Clique em **Run** (ou pressione Ctrl+Enter)
6. Aguarde a mensagem de sucesso

**IMPORTANTE:** Use `FIX_AGENDAMENTO_HORARIOS_V2.sql` (versão corrigida para a estrutura real do banco)

**Resultado esperado:**
```
✅ Funções criadas com sucesso
✅ Permissões concedidas
✅ Testes executados
```

### Passo 2: Validar a Correção (2 minutos)

1. No mesmo **SQL Editor**, crie uma nova query
2. Cole o conteúdo do arquivo `test-agendamento-fix.sql`
3. Execute
4. Verifique o status final

**Status esperado:**
- ✅ SISTEMA PRONTO PARA USO, ou
- ⚠️ CONFIGURE HORÁRIOS DOS MÉDICOS

### Passo 3: Configurar Horários (se necessário)

Se o teste mostrar "CONFIGURE HORÁRIOS DOS MÉDICOS":

#### Opção A: Via SQL (Rápido)

```sql
-- Substitua os valores entre colchetes
INSERT INTO horarios_disponibilidade (
  medico_id,
  local_id,
  dia_semana,
  hora_inicio,
  hora_fim,
  tipo_consulta,
  intervalo_consultas,
  ativo
) VALUES
  -- Segunda a Sexta, 8h às 12h (manhã)
  ('[ID_DO_MEDICO]'::uuid, '[ID_DO_LOCAL]'::uuid, 1, '08:00', '12:00', 'presencial', 30, true),
  ('[ID_DO_MEDICO]'::uuid, '[ID_DO_LOCAL]'::uuid, 2, '08:00', '12:00', 'presencial', 30, true),
  ('[ID_DO_MEDICO]'::uuid, '[ID_DO_LOCAL]'::uuid, 3, '08:00', '12:00', 'presencial', 30, true),
  ('[ID_DO_MEDICO]'::uuid, '[ID_DO_LOCAL]'::uuid, 4, '08:00', '12:00', 'presencial', 30, true),
  ('[ID_DO_MEDICO]'::uuid, '[ID_DO_LOCAL]'::uuid, 5, '08:00', '12:00', 'presencial', 30, true),
  -- Segunda a Sexta, 14h às 18h (tarde)
  ('[ID_DO_MEDICO]'::uuid, '[ID_DO_LOCAL]'::uuid, 1, '14:00', '18:00', 'presencial', 30, true),
  ('[ID_DO_MEDICO]'::uuid, '[ID_DO_LOCAL]'::uuid, 2, '14:00', '18:00', 'presencial', 30, true),
  ('[ID_DO_MEDICO]'::uuid, '[ID_DO_LOCAL]'::uuid, 3, '14:00', '18:00', 'presencial', 30, true),
  ('[ID_DO_MEDICO]'::uuid, '[ID_DO_LOCAL]'::uuid, 4, '14:00', '18:00', 'presencial', 30, true),
  ('[ID_DO_MEDICO]'::uuid, '[ID_DO_LOCAL]'::uuid, 5, '14:00', '18:00', 'presencial', 30, true);
```

**Como obter os IDs:**

```sql
-- Listar médicos e seus locais
SELECT 
  m.id as medico_id,
  p.display_name as medico_nome,
  la.id as local_id,
  la.nome as local_nome
FROM medicos m
JOIN profiles p ON m.user_id = p.id
JOIN locais_atendimento la ON la.medico_id = m.id
WHERE la.ativo = true;
```

#### Opção B: Via Interface (Recomendado para produção)

Implemente uma página de configuração de horários para os médicos.

## ✅ Testar o Agendamento

1. Acesse `http://localhost:5173/agendamento` (ou sua URL)
2. Siga o fluxo:
   - Selecione **Especialidade**
   - Selecione **Estado**
   - Selecione **Cidade**
   - Selecione **Médico**
   - Selecione **Data**
3. **Verifique se os horários aparecem** ✨

## 🐛 Troubleshooting

### Problema: "Nenhum horário disponível"

**Causa:** Médico não tem horários configurados

**Solução:**
```sql
-- Verificar se o médico tem horários
SELECT COUNT(*) 
FROM horarios_disponibilidade 
WHERE medico_id = '[ID_DO_MEDICO]' 
AND ativo = true;

-- Se retornar 0, configure os horários (ver Passo 3)
-- OU a função usará horários padrão (8h-18h) automaticamente
```

### Problema: Erro "function does not exist"

**Causa:** Script de correção não foi executado

**Solução:** Execute o `FIX_AGENDAMENTO_HORARIOS_V2.sql` (versão corrigida)

### Problema: Horários aparecem mas não consigo agendar

**Causa:** Função `reserve_appointment_v2` com problema

**Solução:**
```sql
-- Testar a função diretamente
SELECT * FROM reserve_appointment_v2(
  '[ID_DO_MEDICO]'::uuid,
  (CURRENT_DATE + 1 + TIME '09:00')::timestamptz,
  'Consulta Geral',
  NULL,
  '[ID_DO_LOCAL]'::uuid
);
```

## 📊 Verificação Rápida

Execute este comando para verificar o status:

```sql
SELECT 
  'Funções' as tipo,
  COUNT(*) as total,
  CASE WHEN COUNT(*) >= 3 THEN '✅' ELSE '❌' END as status
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('get_doctor_schedule_v2', 'get_available_time_slots', 'reserve_appointment_v2')

UNION ALL

SELECT 
  'Médicos' as tipo,
  COUNT(*) as total,
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '⚠️' END as status
FROM medicos

UNION ALL

SELECT 
  'Locais' as tipo,
  COUNT(*) as total,
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '⚠️' END as status
FROM locais_atendimento WHERE ativo = true

UNION ALL

SELECT 
  'Horários' as tipo,
  COUNT(*) as total,
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '⚠️' END as status
FROM horarios_funcionamento WHERE ativo = true;
```

**Resultado esperado:**
```
tipo      | total | status
----------|-------|-------
Funções   |   3   |  ✅
Médicos   |   X   |  ✅
Locais    |   X   |  ✅
Horários  |   X   |  ✅
```

## 🎉 Sucesso!

Se todos os testes passaram, o sistema de agendamento está funcionando!

## 📚 Documentação Completa

Para mais detalhes, consulte:
- `DIAGNOSTICO_AGENDAMENTO.md` - Análise completa do problema
- `FIX_AGENDAMENTO_HORARIOS.sql` - Script de correção comentado
- `test-agendamento-fix.sql` - Suite completa de testes

## 💡 Dicas

1. **Backup:** Sempre faça backup antes de executar scripts SQL
2. **Teste:** Use o ambiente de desenvolvimento primeiro
3. **Logs:** Monitore os logs do Supabase durante os testes
4. **Cache:** Limpe o cache do navegador se necessário (Ctrl+Shift+R)

---

**Tempo estimado total:** 10-15 minutos
**Dificuldade:** ⭐⭐ (Intermediário)
