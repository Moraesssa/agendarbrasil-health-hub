# Sistema de Agendamento

## Visão Geral
Sistema unificado de agendamento de consultas médicas, com fluxo linear e intuitivo.

## Estrutura de Arquivos

### Serviço Principal
- **`src/services/agendamento/index.ts`** - Serviço unificado com todas as operações
- **`src/services/agendamento/types.ts`** - Tipos TypeScript do domínio

### Interface do Usuário
- **`src/pages/Agendamento.tsx`** - Página principal (fluxo de 4 etapas)
- **`src/components/agendamento/`** - Componentes modulares:
  - `FiltroBusca.tsx` - Busca por especialidade/localização
  - `ListaMedicos.tsx` - Exibição de médicos disponíveis
  - `SeletorHorarios.tsx` - Seleção de data e horário
  - `ConfirmacaoAgendamento.tsx` - Confirmação final

## Fluxo de Agendamento

```
1. BUSCA
   └─> Usuário filtra: especialidade, estado, cidade
   └─> Chama: agendamentoService.buscarMedicos()

2. SELEÇÃO DE MÉDICO
   └─> Lista médicos encontrados
   └─> Usuário seleciona um médico

3. ESCOLHA DE HORÁRIO
   └─> Usuário seleciona data
   └─> Chama: agendamentoService.buscarHorarios()
   └─> Exibe horários disponíveis por local
   └─> Usuário seleciona horário

4. CONFIRMAÇÃO
   └─> Chama: agendamentoService.criarConsulta()
   └─> Exibe confirmação e próximos passos
```

## Estrutura do Banco de Dados

### Tabelas Principais
- **`medicos`** - Dados dos médicos
- **`locais_atendimento`** - Locais onde médicos atendem
- **`horarios_disponibilidade`** - Configuração de disponibilidade
- **`consultas`** - Agendamentos realizados

### RPC Functions
- **`get_doctors_by_location_and_specialty`** - Busca médicos filtrados

## Métodos do Serviço

```typescript
agendamentoService.buscarMedicos(especialidade?, estado?, cidade?)
agendamentoService.buscarHorarios(medicoId, data)
agendamentoService.criarConsulta(input)
agendamentoService.listarConsultas(pacienteId)
agendamentoService.buscarEstados()
agendamentoService.buscarCidades(estado)
agendamentoService.buscarEspecialidades()
```

## Segurança (RLS)

### Tabela `consultas`
- **SELECT**: Paciente vê suas consultas | Médico vê suas consultas
- **INSERT**: Paciente pode criar consulta
- **UPDATE**: Médico pode atualizar status

### Tabela `horarios_disponibilidade`
- **SELECT**: Público (apenas ativos)
- **ALL**: Médico gerencia seus próprios horários

## Configuração de Horários

Para um médico ter horários disponíveis, é necessário:

1. Registro ativo na tabela `medicos`
2. Local de atendimento ativo em `locais_atendimento`
3. Horários configurados em `horarios_disponibilidade`:
   - `dia_semana` (0-6, domingo=0)
   - `hora_inicio` / `hora_fim`
   - `intervalo_minutos` (padrão: 30)
   - `tipo_consulta` ('presencial' | 'teleconsulta')

## Exemplo de Dados

```sql
-- Criar horário de atendimento
INSERT INTO horarios_disponibilidade 
  (medico_id, dia_semana, hora_inicio, hora_fim, intervalo_minutos, tipo_consulta, ativo)
VALUES 
  ('uuid-do-medico', 1, '08:00', '12:00', 30, 'presencial', true),
  ('uuid-do-medico', 1, '14:00', '18:00', 30, 'presencial', true);
```

## Manutenção

### Para adicionar novo campo
1. Atualizar tipo em `src/services/agendamento/types.ts`
2. Atualizar query em `src/services/agendamento/index.ts`
3. Atualizar componente de exibição correspondente

### Para adicionar nova etapa no fluxo
1. Adicionar tipo de etapa em `src/pages/Agendamento.tsx`
2. Criar novo componente em `src/components/agendamento/`
3. Adicionar lógica de transição

## Princípios

✅ **Um único serviço** - `agendamentoService`  
✅ **Um único fluxo** - Linear, 4 etapas  
✅ **Componentes focados** - Cada um faz uma coisa  
✅ **Tipos fortes** - TypeScript em todo lugar  
✅ **RLS habilitado** - Segurança no banco  

## Troubleshooting

**Nenhum horário aparece:**
- Verificar se médico tem `is_active = true`
- Verificar se local tem `ativo = true`
- Verificar se existe registro em `horarios_disponibilidade`
- Verificar se `dia_semana` corresponde ao dia selecionado

**Erro ao criar consulta:**
- Verificar RLS policies
- Confirmar que `user.id` corresponde a `paciente_id`
- Verificar se horário não está ocupado
