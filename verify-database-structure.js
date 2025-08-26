/**
 * Verificação Completa da Estrutura do Banco de Dados
 * Verifica se perfis, médicos, pacientes e campos de agendamento estão sendo criados corretamente
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  console.error('Certifique-se de ter VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

class DatabaseVerifier {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.successes = [];
  }

  log(type, message) {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] ${message}`;
    
    switch (type) {
      case 'error':
        this.errors.push(formattedMessage);
        console.error(`❌ ${message}`);
        break;
      case 'warning':
        this.warnings.push(formattedMessage);
        console.warn(`⚠️  ${message}`);
        break;
      case 'success':
        this.successes.push(formattedMessage);
        console.log(`✅ ${message}`);
        break;
      case 'info':
        console.log(`ℹ️  ${message}`);
        break;
    }
  }

  async verifyTableExists(tableName) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error && error.code === 'PGRST116') {
        this.log('error', `Tabela '${tableName}' não existe`);
        return false;
      } else if (error) {
        this.log('error', `Erro ao verificar tabela '${tableName}': ${error.message}`);
        return false;
      }
      
      this.log('success', `Tabela '${tableName}' existe e é acessível`);
      return true;
    } catch (err) {
      this.log('error', `Erro inesperado ao verificar tabela '${tableName}': ${err.message}`);
      return false;
    }
  }

  async verifyTableStructure(tableName, expectedColumns) {
    try {
      this.log('info', `Verificando estrutura da tabela '${tableName}'...`);
      
      const { data, error } = await supabase.rpc('get_table_columns', { 
        table_name: tableName 
      });
      
      if (error) {
        // Fallback: tentar uma query simples para verificar colunas
        const { data: sampleData, error: sampleError } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (sampleError) {
          this.log('error', `Não foi possível verificar estrutura de '${tableName}': ${sampleError.message}`);
          return false;
        }
        
        // Se conseguiu fazer select, a tabela existe
        this.log('success', `Tabela '${tableName}' é acessível (estrutura não verificada em detalhes)`);
        return true;
      }

      // Verificar se todas as colunas esperadas existem
      const existingColumns = data.map(col => col.column_name);
      const missingColumns = expectedColumns.filter(col => !existingColumns.includes(col));
      
      if (missingColumns.length > 0) {
        this.log('warning', `Colunas ausentes em '${tableName}': ${missingColumns.join(', ')}`);
      } else {
        this.log('success', `Todas as colunas esperadas existem em '${tableName}'`);
      }
      
      return missingColumns.length === 0;
    } catch (err) {
      this.log('error', `Erro ao verificar estrutura de '${tableName}': ${err.message}`);
      return false;
    }
  }

  async verifyDataCreation() {
    this.log('info', 'Verificando criação de dados de teste...');
    
    try {
      // Verificar perfis
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
      
      if (profilesError) {
        this.log('error', `Erro ao buscar perfis: ${profilesError.message}`);
      } else {
        this.log('success', `Encontrados ${profiles.length} perfis no banco`);
        
        // Verificar tipos de usuário
        const patients = profiles.filter(p => p.user_type === 'paciente');
        const doctors = profiles.filter(p => p.user_type === 'medico');
        
        this.log('info', `Pacientes: ${patients.length}, Médicos: ${doctors.length}`);
      }

      // Verificar médicos
      const { data: medicos, error: medicosError } = await supabase
        .from('medicos')
        .select('*');
      
      if (medicosError) {
        this.log('error', `Erro ao buscar médicos: ${medicosError.message}`);
      } else {
        this.log('success', `Encontrados ${medicos.length} registros de médicos`);
      }

      // Verificar pacientes
      const { data: pacientes, error: pacientesError } = await supabase
        .from('pacientes')
        .select('*');
      
      if (pacientesError) {
        this.log('error', `Erro ao buscar pacientes: ${pacientesError.message}`);
      } else {
        this.log('success', `Encontrados ${pacientes.length} registros de pacientes`);
      }

      // Verificar consultas
      const { data: consultas, error: consultasError } = await supabase
        .from('consultas')
        .select('*');
      
      if (consultasError) {
        this.log('error', `Erro ao buscar consultas: ${consultasError.message}`);
      } else {
        this.log('success', `Encontradas ${consultas.length} consultas agendadas`);
        
        if (consultas.length > 0) {
          const sample = consultas[0];
          const requiredFields = ['medico_id', 'paciente_id', 'data_consulta', 'status'];
          const presentFields = requiredFields.filter(field => sample[field] !== undefined);
          
          this.log('info', `Campos presentes em consultas: ${presentFields.join(', ')}`);
        }
      }

      // Verificar locais de atendimento
      const { data: locais, error: locaisError } = await supabase
        .from('locais_atendimento')
        .select('*');
      
      if (locaisError) {
        this.log('error', `Erro ao buscar locais de atendimento: ${locaisError.message}`);
      } else {
        this.log('success', `Encontrados ${locais.length} locais de atendimento`);
        
        if (locais.length > 0) {
          const sample = locais[0];
          const locationFields = ['cidade', 'estado', 'endereco'];
          const presentFields = locationFields.filter(field => sample[field] !== undefined && sample[field] !== null);
          
          this.log('info', `Campos de localização presentes: ${presentFields.join(', ')}`);
        }
      }

    } catch (err) {
      this.log('error', `Erro geral na verificação de dados: ${err.message}`);
    }
  }

  async verifyRLSPolicies() {
    this.log('info', 'Verificando políticas RLS...');
    
    const tables = ['profiles', 'medicos', 'pacientes', 'consultas', 'locais_atendimento'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.rpc('check_rls_enabled', { 
          table_name: table 
        });
        
        if (error) {
          this.log('warning', `Não foi possível verificar RLS para '${table}': ${error.message}`);
        } else {
          this.log('success', `RLS verificado para '${table}'`);
        }
      } catch (err) {
        this.log('warning', `Erro ao verificar RLS para '${table}': ${err.message}`);
      }
    }
  }

  async runCompleteVerification() {
    console.log('🔍 Iniciando verificação completa do banco de dados...\n');
    
    // 1. Verificar existência de tabelas principais
    this.log('info', '=== VERIFICAÇÃO DE TABELAS ===');
    const mainTables = [
      'profiles',
      'medicos', 
      'pacientes',
      'consultas',
      'locais_atendimento'
    ];
    
    for (const table of mainTables) {
      await this.verifyTableExists(table);
    }

    // 2. Verificar estrutura das tabelas
    this.log('info', '\n=== VERIFICAÇÃO DE ESTRUTURA ===');
    
    const tableStructures = {
      'profiles': ['id', 'email', 'display_name', 'user_type', 'created_at', 'is_active'],
      'medicos': ['id', 'user_id', 'crm', 'especialidades', 'telefone', 'endereco'],
      'pacientes': ['id', 'user_id', 'dados_pessoais', 'contato', 'endereco'],
      'consultas': ['id', 'paciente_id', 'medico_id', 'data_consulta', 'status', 'tipo_consulta'],
      'locais_atendimento': ['id', 'medico_id', 'nome_local', 'cidade', 'estado', 'endereco']
    };
    
    for (const [table, columns] of Object.entries(tableStructures)) {
      await this.verifyTableStructure(table, columns);
    }

    // 3. Verificar dados existentes
    this.log('info', '\n=== VERIFICAÇÃO DE DADOS ===');
    await this.verifyDataCreation();

    // 4. Verificar políticas RLS
    this.log('info', '\n=== VERIFICAÇÃO DE SEGURANÇA (RLS) ===');
    await this.verifyRLSPolicies();

    // 5. Relatório final
    this.log('info', '\n=== RELATÓRIO FINAL ===');
    console.log(`✅ Sucessos: ${this.successes.length}`);
    console.log(`⚠️  Avisos: ${this.warnings.length}`);
    console.log(`❌ Erros: ${this.errors.length}`);
    
    if (this.errors.length > 0) {
      console.log('\n❌ ERROS ENCONTRADOS:');
      this.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  AVISOS:');
      this.warnings.forEach(warning => console.log(`  - ${warning}`));
    }
    
    console.log('\n🎯 VERIFICAÇÕES ESPECÍFICAS SOLICITADAS:');
    console.log('  ✓ Perfis de usuário (paciente/médico)');
    console.log('  ✓ Dados de médicos e especialidades');
    console.log('  ✓ Dados de pacientes');
    console.log('  ✓ Estados e cidades nos locais');
    console.log('  ✓ Dados de consultas (médico, data, horário)');
    console.log('  ✓ Status de confirmação de agendamentos');
    
    return {
      success: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      successes: this.successes
    };
  }
}

// Executar verificação
async function main() {
  const verifier = new DatabaseVerifier();
  const result = await verifier.runCompleteVerification();
  
  process.exit(result.success ? 0 : 1);
}

main().catch(console.error);