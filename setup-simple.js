import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ulebotjrsgheybhpdnxd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsZWJvdGpyc2doZXliaHBkbnhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU0MzkyNSwiZXhwIjoyMDY2MTE5OTI1fQ.SL5dtN5mpITgn5H0mxAJj9AzQ5bB_Fben2av__A1SMU'
);

async function setupDatabase() {
  try {
    console.log('🚀 Configurando banco...');
    
    // 1. Limpar tabelas existentes
    await supabase.rpc('exec', {
      sql: `
        DROP TABLE IF EXISTS consultas CASCADE;
        DROP TABLE IF EXISTS horarios_disponibilidade CASCADE;
        DROP TABLE IF EXISTS locais_atendimento CASCADE;
      `
    });
    console.log('✅ Tabelas antigas removidas');
    
    // 2. Criar tabela médicos
    await supabase.rpc('exec', {
      sql: `
        CREATE TABLE medicos (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          crm VARCHAR(20) NOT NULL,
          uf_crm CHAR(2) NOT NULL,
          especialidade VARCHAR(100) NOT NULL,
          nome VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          telefone VARCHAR(20),
          valor_consulta_presencial DECIMAL(10,2),
          valor_consulta_teleconsulta DECIMAL(10,2),
          duracao_consulta_padrao INTEGER DEFAULT 30,
          aceita_teleconsulta BOOLEAN DEFAULT true,
          aceita_consulta_presencial BOOLEAN DEFAULT true,
          ativo BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(crm, uf_crm)
        );
      `
    });
    console.log('✅ Tabela médicos criada');
    
    // 3. Criar tabela pacientes
    await supabase.rpc('exec', {
      sql: `
        CREATE TABLE pacientes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          nome VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          cpf VARCHAR(14) UNIQUE,
          data_nascimento DATE NOT NULL,
          telefone VARCHAR(20),
          cidade VARCHAR(100),
          estado CHAR(2),
          ativo BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    console.log('✅ Tabela pacientes criada');
    
    // 4. Criar locais de atendimento
    await supabase.rpc('exec', {
      sql: `
        CREATE TABLE locais_atendimento (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          medico_id UUID NOT NULL REFERENCES medicos(id) ON DELETE CASCADE,
          nome VARCHAR(255) NOT NULL,
          endereco TEXT NOT NULL,
          cidade VARCHAR(100) NOT NULL,
          estado CHAR(2) NOT NULL,
          cep VARCHAR(10),
          telefone VARCHAR(20),
          ativo BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    console.log('✅ Tabela locais criada');
    
    // 5. Criar horários de disponibilidade
    await supabase.rpc('exec', {
      sql: `
        CREATE TABLE horarios_disponibilidade (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          medico_id UUID NOT NULL REFERENCES medicos(id) ON DELETE CASCADE,
          local_id UUID REFERENCES locais_atendimento(id),
          dia_semana INTEGER NOT NULL,
          hora_inicio TIME NOT NULL,
          hora_fim TIME NOT NULL,
          tipo_consulta VARCHAR(20) NOT NULL,
          intervalo_consultas INTEGER DEFAULT 30,
          ativo BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    console.log('✅ Tabela horários criada');
    
    // 6. Criar consultas
    await supabase.rpc('exec', {
      sql: `
        CREATE TABLE consultas (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          medico_id UUID NOT NULL REFERENCES medicos(id),
          paciente_id UUID NOT NULL REFERENCES pacientes(id),
          local_id UUID REFERENCES locais_atendimento(id),
          data_hora_agendada TIMESTAMP WITH TIME ZONE NOT NULL,
          duracao_estimada INTEGER NOT NULL,
          tipo VARCHAR(20) NOT NULL,
          status VARCHAR(30) DEFAULT 'agendada',
          valor_consulta DECIMAL(10,2),
          motivo_consulta TEXT,
          agendado_por UUID NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    console.log('✅ Tabela consultas criada');
    
    // 7. Inserir dados de exemplo
    await supabase.rpc('exec', {
      sql: `
        INSERT INTO medicos (user_id, crm, uf_crm, especialidade, nome, email, telefone, valor_consulta_presencial, valor_consulta_teleconsulta) VALUES
        ('11111111-1111-1111-1111-111111111111', 'CRM12345', 'SP', 'Cardiologia', 'Dr. João Silva', 'joao@teste.com', '(11) 99999-1111', 200.00, 150.00),
        ('22222222-2222-2222-2222-222222222222', 'CRM67890', 'RJ', 'Dermatologia', 'Dra. Maria Santos', 'maria@teste.com', '(21) 99999-2222', 180.00, 130.00);
      `
    });
    console.log('✅ Médicos inseridos');
    
    await supabase.rpc('exec', {
      sql: `
        INSERT INTO pacientes (user_id, nome, email, cpf, data_nascimento, telefone, cidade, estado) VALUES
        ('44444444-4444-4444-4444-444444444444', 'Ana Costa', 'ana@teste.com', '123.456.789-01', '1990-05-15', '(11) 99999-4444', 'São Paulo', 'SP'),
        ('55555555-5555-5555-5555-555555555555', 'Pedro Oliveira', 'pedro@teste.com', '987.654.321-09', '1985-08-22', '(21) 99999-5555', 'Rio de Janeiro', 'RJ');
      `
    });
    console.log('✅ Pacientes inseridos');
    
    console.log('🎉 Banco configurado com sucesso!');
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

setupDatabase().catch(console.error);