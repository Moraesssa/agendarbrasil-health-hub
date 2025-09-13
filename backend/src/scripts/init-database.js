// src/scripts/init-database.js
require('dotenv').config({ path: '../../.env' });
const { createServiceClient } = require('../config/supabase');

async function initDatabase() {
  try {
    console.log('Inicializando banco de dados...');
    
    // Criar cliente do Supabase
    const supabase = createServiceClient();
    
    // Criar tabela de usuários se não existir
    console.log('Criando tabela de usuários...');
    const { error: usersError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS usuarios (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          email TEXT UNIQUE NOT NULL,
          senha TEXT NOT NULL,
          nome TEXT NOT NULL,
          tipo TEXT NOT NULL CHECK (tipo IN ('paciente', 'medico', 'admin')),
          telefone TEXT,
          data_nascimento DATE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (usersError) {
      console.error('Erro ao criar tabela de usuários:', usersError.message);
      return false;
    }
    
    // Criar tabela de médicos se não existir
    console.log('Criando tabela de médicos...');
    const { error: doctorsError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS medicos (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          usuario_id UUID REFERENCES usuarios(id),
          crm TEXT NOT NULL,
          especialidade TEXT NOT NULL,
          formacao TEXT,
          sobre TEXT,
          foto_url TEXT,
          avaliacao NUMERIC(3,2),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (doctorsError) {
      console.error('Erro ao criar tabela de médicos:', doctorsError.message);
      return false;
    }
    
    // Criar tabela de pacientes se não existir
    console.log('Criando tabela de pacientes...');
    const { error: patientsError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS pacientes (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          usuario_id UUID REFERENCES usuarios(id),
          cpf TEXT,
          endereco TEXT,
          plano_saude TEXT,
          numero_plano TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (patientsError) {
      console.error('Erro ao criar tabela de pacientes:', patientsError.message);
      return false;
    }
    
    // Criar tabela de consultas se não existir
    console.log('Criando tabela de consultas...');
    const { error: appointmentsError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS consultas (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          paciente_id UUID REFERENCES pacientes(id),
          medico_id UUID REFERENCES medicos(id),
          data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
          duracao_minutos INTEGER DEFAULT 30,
          status TEXT NOT NULL CHECK (status IN ('agendada', 'confirmada', 'em_andamento', 'concluida', 'cancelada')),
          tipo TEXT NOT NULL CHECK (tipo IN ('presencial', 'telemedicina')),
          motivo TEXT,
          observacoes TEXT,
          sala_virtual_url TEXT,
          sala_virtual_token TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (appointmentsError) {
      console.error('Erro ao criar tabela de consultas:', appointmentsError.message);
      return false;
    }
    
    // Criar função para obter tabelas
    console.log('Criando função para listar tabelas...');
    const { error: functionError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION get_tables()
        RETURNS TABLE (table_name text)
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          RETURN QUERY
          SELECT tablename::text
          FROM pg_tables
          WHERE schemaname = 'public';
        END;
        $$;
      `
    });
    
    if (functionError) {
      console.error('Erro ao criar função get_tables:', functionError.message);
      return false;
    }
    
    console.log('Banco de dados inicializado com sucesso!');
    return true;
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error.message);
    return false;
  }
}

// Executar a inicialização
initDatabase()
  .then(success => {
    if (success) {
      console.log('\nInicialização do banco de dados concluída com sucesso!');
    } else {
      console.log('\nInicialização do banco de dados falhou. Verifique os erros acima.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Erro inesperado:', error);
    process.exit(1);
  });