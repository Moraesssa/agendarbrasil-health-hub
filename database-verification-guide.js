#!/usr/bin/env node

/**
 * DIAGNÓSTICO DA ESTRUTURA DO BANCO DE DADOS
 * 
 * Este script mostra o que deve ser verificado no banco de dados
 * para confirmar se perfis, médicos, pacientes e campos de agendamento
 * estão sendo criados corretamente.
 */

console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                    🔍 VERIFICAÇÃO DO BANCO DE DADOS                          ║
║                        AgendarBrasil Health Hub                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

const verificacoes = {
  "📋 TABELAS PRINCIPAIS": [
    "✓ profiles - Perfis de usuário (paciente/médico)",
    "✓ medicos - Dados específicos dos médicos", 
    "✓ pacientes - Dados específicos dos pacientes",
    "✓ consultas - Agendamentos e consultas",
    "✓ locais_atendimento - Locais de atendimento com cidade/estado"
  ],
  
  "👤 PERFIS DE USUÁRIO": [
    "✓ Tabela 'profiles' deve ter campo 'user_type' = 'paciente' ou 'medico'",
    "✓ Campo 'display_name' para nome de exibição",
    "✓ Campo 'email' para identificação",
    "✓ Campo 'is_active' para status ativo/inativo",
    "✓ Relacionamento com auth.users do Supabase"
  ],
  
  "👨‍⚕️ DADOS DE MÉDICOS": [
    "✓ Tabela 'medicos' com campo 'user_id' referenciando profiles",
    "✓ Campo 'crm' para registro médico",
    "✓ Campo 'especialidades' (array) para especialidades médicas",
    "✓ Campo 'telefone' para contato",
    "✓ Campo 'endereco' (JSONB) para dados de endereço",
    "✓ Campo 'verificacao' (JSONB) para status de verificação"
  ],
  
  "👥 DADOS DE PACIENTES": [
    "✓ Tabela 'pacientes' com campo 'user_id' referenciando profiles",
    "✓ Campo 'dados_pessoais' (JSONB) para informações pessoais",
    "✓ Campo 'contato' (JSONB) para dados de contato",
    "✓ Campo 'endereco' (JSONB) para endereço",
    "✓ Campo 'dados_medicos' (JSONB) para histórico médico"
  ],
  
  "🏥 ESPECIALIDADES": [
    "✓ Médicos devem ter especialidades cadastradas no array 'especialidades'",
    "✓ Função 'get_specialties()' deve retornar lista de especialidades",
    "✓ Especialidades comuns: Clínica Geral, Cardiologia, Dermatologia, etc."
  ],
  
  "🌍 ESTADOS E CIDADES": [
    "✓ Tabela 'locais_atendimento' com campos 'cidade' e 'estado'",
    "✓ Campo 'endereco' para endereço completo",
    "✓ Função 'get_available_states()' deve retornar estados disponíveis",
    "✓ Função 'get_available_cities(state_uf)' deve retornar cidades por estado",
    "✓ Relacionamento com medicos via 'medico_id'"
  ],
  
  "📅 AGENDAMENTOS (CONSULTAS)": [
    "✓ Tabela 'consultas' com os campos essenciais:",
    "  - medico_id: ID do médico",
    "  - paciente_id: ID do paciente", 
    "  - data_consulta: Data e horário da consulta",
    "  - status: Status da consulta (pending_payment, scheduled, confirmed, etc.)",
    "  - tipo_consulta: Tipo da consulta",
    "  - local_id: Local de atendimento (opcional)"
  ],
  
  "✅ CONFIRMAÇÃO DE AGENDAMENTOS": [
    "✓ Campo 'status' deve aceitar valores:",
    "  - 'pending_payment': Aguardando pagamento",
    "  - 'scheduled': Agendada",
    "  - 'confirmed': Confirmada",
    "  - 'cancelled': Cancelada",
    "  - 'completed': Realizada",
    "✓ Sistema de expiração com campo 'expires_at'",
    "✓ Função 'reserve_appointment_slot()' para reservar horários"
  ]
};

// Exibir todas as verificações
for (const [categoria, itens] of Object.entries(verificacoes)) {
  console.log(`\n${categoria}`);
  console.log("=".repeat(categoria.length));
  itens.forEach(item => console.log(`  ${item}`));
}

console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                           📊 COMO VERIFICAR                                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

🔍 OPÇÃO 1 - BROWSER (Mais Fácil):
   1. Abra o arquivo: verify-database-browser.html
   2. Insira suas credenciais do Supabase
   3. Clique em "Verificar Banco de Dados"

🔍 OPÇÃO 2 - SQL DIRETO:
   1. Acesse o painel do Supabase
   2. Vá em Database > SQL Editor
   3. Execute o arquivo: verify-database-structure.sql

🔍 OPÇÃO 3 - TERMINAL:
   1. Configure arquivo .env com credenciais
   2. Execute: node verify-database-structure.js

╔══════════════════════════════════════════════════════════════════════════════╗
║                        ✅ CHECKLIST DE VERIFICAÇÃO                           ║
╚══════════════════════════════════════════════════════════════════════════════╝

□ Tabelas principais existem (profiles, medicos, pacientes, consultas, locais_atendimento)
□ Perfis são criados com user_type correto (paciente/medico)
□ Médicos têm CRM e especialidades cadastradas
□ Pacientes têm dados pessoais e contato
□ Locais têm cidade e estado preenchidos
□ Consultas têm médico, data e horário
□ Sistema de status de confirmação funciona
□ Relacionamentos entre tabelas estão corretos (Foreign Keys)
□ Políticas RLS estão ativas para segurança
□ Índices estão criados para performance

╔══════════════════════════════════════════════════════════════════════════════╗
║                          🎯 CAMPOS SOLICITADOS                               ║
╚══════════════════════════════════════════════════════════════════════════════╝

✅ PERFIS: Verificar se pacientes e médicos são criados corretamente
✅ MÉDICOS: Verificar CRM, especialidades e dados profissionais  
✅ PACIENTES: Verificar dados pessoais e informações de contato
✅ ESPECIALIDADES: Verificar se especialidades médicas estão cadastradas
✅ ESTADOS: Verificar se estados estão nos locais de atendimento
✅ CIDADES: Verificar se cidades estão nos locais de atendimento  
✅ MÉDICO: Verificar se consultas têm médico associado
✅ DATA: Verificar se consultas têm data_consulta preenchida
✅ HORÁRIO: Verificar se horários estão na data_consulta
✅ CONFIRMAÇÃO: Verificar se sistema de status funciona

════════════════════════════════════════════════════════════════════════════════

Para uma verificação completa, recomendo usar o arquivo HTML que criamos:
👉 verify-database-browser.html

Ele fará todas essas verificações automaticamente e mostrará um relatório
completo do estado atual do banco de dados.
`);

process.exit(0);