# Diagnóstico e Correção do Sistema de Agendamento

## 🔍 Problema Identificado

A página de agendamento (`/agendamento`) está falhando ao exibir os horários disponíveis dos médicos. Diversas etapas do fluxo de agendamento estão quebradas.

## 🎯 Causa Raiz

### 1. Função RPC Inexistente
O código frontend está chamando a função `get_doctor_schedule_v2` que **não existe** no banco de dados Supabase.

**Localização do erro:**
- Arquivo: `src/services/scheduling/index.ts` (linha ~60)
- Código problemático:
```typescript
const { data, error } = await supabase.rpc('get_doctor_schedule_v2', {
  p_doctor_id: doctorId,
  p_date: date
});
```

### 2. Fluxo de Dados Quebrado

```
Frontend (Agendamento.tsx)
    ↓
useAppointmentScheduling Hook
    ↓
schedulingService.getAvailableSlots()
    ↓
supabase.rpc('get_doctor_schedule_v2') ❌ FUNÇÃO NÃO EXISTE
    ↓
Erro: "function public.get_doctor_schedule_v2 does not exist"
```

## 🔧 Solução Implementada

### Script SQL de Correção: `FIX_AGENDAMENTO_HORARIOS.sql`

Este script cria as funções necessárias no banco de dados:

#### 1. `get_doctor_schedule_v2(doctor_id, date)`
Função principal que busca horários disponíveis baseado em:
- Locais de atendimento ativos do médico
- Horários de funcionamento configurados
- Consultas já agendadas (para marcar como indisponível)

**Retorna:**
```json
{
  "doctor_id": "uuid",
  "date": "2025-01-15",
  "locations": [
    {
      "id": "uuid",
      "nome_local": "Clínica Central",
      "endereco": {...},
      "horarios_disponiveis": [
        {"time": "08:00", "available": true},
        {"time": "08:30", "available": false},
        {"time": "09:00", "available": true}
      ]
    }
  ]
}
```

#### 2. `get_available_time_slots(doctor_id, date, start_hour, end_hour, interval)`
Função fallback para casos onde não há horários configurados. Gera slots padrão (8h-18h).

#### 3. `reserve_appointment_v2(doctor_id, datetime, specialty, family_member_id, local_id)`
Função para reservar horários de consulta com validação de disponibilidade.

## 📋 Como Aplicar a Correção

### Passo 1: Executar o Script SQL

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Cole o conteúdo do arquivo `FIX_AGENDAMENTO_HORARIOS.sql`
4. Execute o script (botão "Run")

### Passo 2: Verificar a Execução

Após executar, você deve ver:
```
✅ Funções criadas com sucesso
✅ Permissões concedidas
✅ Testes executados
```

### Passo 3: Configurar Horários dos Médicos

Os médicos precisam ter horários configurados na tabela `horarios_funcionamento`:

```sql
-- Exemplo: Configurar horário de segunda a sexta, 8h-18h
INSERT INTO horarios_funcionamento (
  medico_id,
  local_id,
  dia_semana,
  hora_inicio,
  hora_fim,
  ativo
) VALUES
  ('[ID_DO_MEDICO]', '[ID_DO_LOCAL]', 1, '08:00', '18:00', true), -- Segunda
  ('[ID_DO_MEDICO]', '[ID_DO_LOCAL]', 2, '08:00', '18:00', true), -- Terça
  ('[ID_DO_MEDICO]', '[ID_DO_LOCAL]', 3, '08:00', '18:00', true), -- Quarta
  ('[ID_DO_MEDICO]', '[ID_DO_LOCAL]', 4, '08:00', '18:00', true), -- Quinta
  ('[ID_DO_MEDICO]', '[ID_DO_LOCAL]', 5, '08:00', '18:00', true); -- Sexta
```

### Passo 4: Testar o Agendamento

1. Acesse `/agendamento`
2. Selecione:
   - ✅ Especialidade
   - ✅ Estado
   - ✅ Cidade
   - ✅ Médico
   - ✅ Data
3. Verifique se os horários aparecem na grade

## 🐛 Debugging

### Se os horários não aparecerem:

#### 1. Verificar no Console do Navegador (F12)
Procure por erros relacionados a:
- `get_doctor_schedule_v2`
- RPC calls
- Supabase errors

#### 2. Testar a Função Diretamente no SQL Editor

```sql
-- Substitua [ID_DO_MEDICO] por um ID real
SELECT * FROM get_doctor_schedule_v2(
  '[ID_DO_MEDICO]'::uuid,
  CURRENT_DATE + 1
);
```

#### 3. Verificar se o Médico Tem Horários Configurados

```sql
SELECT 
  m.id,
  p.display_name,
  COUNT(DISTINCT la.id) as locais_ativos,
  COUNT(DISTINCT hf.id) as horarios_configurados
FROM medicos m
JOIN profiles p ON m.user_id = p.id
LEFT JOIN locais_atendimento la ON la.medico_id = m.id AND la.ativo = true
LEFT JOIN horarios_funcionamento hf ON hf.medico_id = m.id AND hf.ativo = true
WHERE m.id = '[ID_DO_MEDICO]'
GROUP BY m.id, p.display_name;
```

#### 4. Usar Função Fallback (Horários Padrão)

Se não houver horários configurados, use:

```sql
SELECT * FROM get_available_time_slots(
  '[ID_DO_MEDICO]'::uuid,
  CURRENT_DATE + 1,
  8,  -- hora início
  18, -- hora fim  
  30  -- intervalo em minutos
);
```

## 📊 Estrutura de Dados Necessária

### Tabelas Envolvidas

1. **medicos** - Dados dos médicos
2. **locais_atendimento** - Locais onde o médico atende
3. **horarios_funcionamento** - Horários de funcionamento por local e dia da semana
4. **consultas** - Consultas agendadas

### Relacionamentos

```
medicos (1) ──→ (N) locais_atendimento
                      ↓
                      (N) horarios_funcionamento
                      
medicos (1) ──→ (N) consultas
```

## ✅ Checklist de Validação

Após aplicar a correção, verifique:

- [ ] Script SQL executado sem erros
- [ ] Funções criadas no banco de dados
- [ ] Permissões concedidas (authenticated, anon)
- [ ] Médicos têm locais de atendimento cadastrados
- [ ] Médicos têm horários de funcionamento configurados
- [ ] Página `/agendamento` carrega sem erros
- [ ] Horários aparecem ao selecionar médico e data
- [ ] É possível selecionar um horário
- [ ] Agendamento é criado com sucesso

## 🚀 Melhorias Futuras

1. **Interface de Configuração de Horários**
   - Criar página para médicos configurarem seus horários
   - Permitir bloqueios de agenda (férias, feriados)

2. **Validações Adicionais**
   - Verificar se a data é futura
   - Respeitar horário de almoço
   - Considerar duração da consulta

3. **Otimizações**
   - Cache de horários disponíveis
   - Pré-carregamento de próximos dias
   - Indicador de horários populares

## 📞 Suporte

Se o problema persistir após aplicar esta correção:

1. Verifique os logs do Supabase
2. Confirme que as variáveis de ambiente estão corretas
3. Teste as funções RPC diretamente no SQL Editor
4. Verifique as políticas RLS das tabelas envolvidas

---

**Última atualização:** 2025-01-05
**Versão:** 1.0
