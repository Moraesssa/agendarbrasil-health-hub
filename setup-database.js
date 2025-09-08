import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabase = createClient(
  'https://ulebotjrsgheybhpdnxd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsZWJvdGpyc2doZXliaHBkbnhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU0MzkyNSwiZXhwIjoyMDY2MTE5OTI1fQ.SL5dtN5mpITgn5H0mxAJj9AzQ5bB_Fben2av__A1SMU'
);

async function setupDatabase() {
  try {
    console.log('🚀 Configurando banco de dados...');
    
    // Executar em partes para evitar problemas
    const commands = [
      // 1. Limpar tabelas
      `DROP TABLE IF EXISTS consultas CASCADE;
       DROP TABLE IF EXISTS horarios_disponibilidade CASCADE;
       DROP TABLE IF EXISTS locais_atendimento CASCADE;`,
      
      // 2. Criar tabela médicos
      `CREATE TABLE medicos (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          crm VARCHAR(20) NOT NULL,
          uf_crm CHAR(2) NOT NULL,
          especialidade VARCHAR(100) NOT NULL,
          nome VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          telefone VARCHAR(20),
          bio_perfil TEXT,
          foto_perfil_url VARCHAR(500),
          valor_consulta_presencial DECIMAL(10,2),
          valor_consulta_teleconsulta DECIMAL(10,2),
          duracao_consulta_padrao INTEGER DEFAULT 30,
          duracao_consulta_inicial INTEGER DEFAULT 60,
          duracao_teleconsulta INTEGER DEFAULT 30,
          aceita_teleconsulta BOOLEAN DEFAULT true,
          aceita_consulta_presencial BOOLEAN DEFAULT true,
          rating DECIMAL(3,2) DEFAULT 0.00,
          total_avaliacoes INTEGER DEFAULT 0,
          ativo BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(crm, uf_crm)
      );`,
      
      // 3. Criar tabela pacientes
      `CREATE TABLE pacientes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          nome VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          cpf VARCHAR(14) UNIQUE,
          data_nascimento DATE NOT NULL,
          genero VARCHAR(20),
          telefone VARCHAR(20),
          endereco TEXT,
          cidade VARCHAR(100),
          estado CHAR(2),
          cep VARCHAR(10),
          responsavel_id UUID REFERENCES pacientes(id),
          ativo BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`,
      
      // 4. Criar locais de atendimento
      `CREATE TABLE locais_atendimento (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          medico_id UUID NOT NULL REFERENCES medicos(id) ON DELETE CASCADE,
          nome VARCHAR(255) NOT NULL,
          endereco TEXT NOT NULL,
          cidade VARCHAR(100) NOT NULL,
          estado CHAR(2) NOT NULL,
          cep VARCHAR(10),
          telefone VARCHAR(20),
          latitude DECIMAL(10, 8),
          longitude DECIMAL(11, 8),
          ativo BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`,
      
      // 5. Criar horários
      `CREATE TABLE horarios_disponibilidade (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          medico_id UUID NOT NULL REFERENCES medicos(id) ON DELETE CASCADE,
          local_id UUID REFERENCES locais_atendimento(id),
          dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6),
          hora_inicio TIME NOT NULL,
          hora_fim TIME NOT NULL,
          tipo_consulta VARCHAR(20) NOT NULL CHECK (tipo_consulta IN ('presencial', 'teleconsulta')),
          intervalo_consultas INTEGER DEFAULT 30,
          data_inicio DATE,
          data_fim DATE,
          ativo BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`,
      
      // 6. Criar consultas
      `CREATE TABLE consultas (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          medico_id UUID NOT NULL REFERENCES medicos(id),
          paciente_id UUID NOT NULL REFERENCES pacientes(id),
          local_id UUID REFERENCES locais_atendimento(id),
          data_hora_agendada TIMESTAMP WITH TIME ZONE NOT NULL,
          data_hora_inicio_real TIMESTAMP WITH TIME ZONE,
          data_hora_fim_real TIMESTAMP WITH TIME ZONE,
          duracao_estimada INTEGER NOT NULL,
          duracao_real INTEGER,
          tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('presencial', 'teleconsulta')),
          prioridade VARCHAR(20) DEFAULT 'normal' CHECK (prioridade IN ('baixa', 'normal', 'alta')),
          status VARCHAR(20) DEFAULT 'agendada' CHECK (status IN ('agendada', 'confirmada', 'em_andamento', 'concluida', 'cancelada', 'nao_compareceu')),
          valor_consulta DECIMAL(10,2),
          valor_pago DECIMAL(10,2),
          forma_pagamento VARCHAR(50),
          observacoes TEXT,
          receita_medica TEXT,
          atestado_medico TEXT,
          link_videochamada VARCHAR(500),
          sala_videochamada VARCHAR(100),
          avaliacao_paciente INTEGER CHECK (avaliacao_paciente >= 1 AND avaliacao_paciente <= 5),
          comentario_avaliacao TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`
    ];

    // Executar comandos
    for (let i = 0; i < commands.length; i++) {
      console.log(`Executando comando ${i + 1}/${commands.length}...`);
      const { error } = await supabase.rpc('exec_sql', { sql: commands[i] });
      if (error) {
        console.error(`Erro no comando ${i + 1}:`, error);
        throw error;
      }
    }

    // Criar índices
    console.log('Criando índices...');
    const indices = [
      'CREATE INDEX idx_medicos_user_id ON medicos(user_id);',
      'CREATE INDEX idx_medicos_crm ON medicos(crm, uf_crm);',
      'CREATE INDEX idx_pacientes_user_id ON pacientes(user_id);',
      'CREATE INDEX idx_pacientes_cpf ON pacientes(cpf);',
      'CREATE INDEX idx_consultas_medico ON consultas(medico_id);',
      'CREATE INDEX idx_consultas_paciente ON consultas(paciente_id);',
      'CREATE INDEX idx_consultas_data ON consultas(data_hora_agendada);',
      'CREATE INDEX idx_horarios_medico ON horarios_disponibilidade(medico_id);'
    ];

    for (const index of indices) {
      const { error } = await supabase.rpc('exec_sql', { sql: index });
      if (error) {
        console.warn('Aviso ao criar índice:', error.message);
      }
    }

    console.log('✅ Banco de dados configurado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao configurar banco:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase().catch(console.error);
}

export { setupDatabase };al', 'alta', 'emergencia')),
          status VARCHAR(30) DEFAULT 'agendada',
          link_sala_virtual VARCHAR(500),
          valor_consulta DECIMAL(10,2),
          pagamento_confirmado BOOLEAN DEFAULT false,
          motivo_consulta TEXT,
          observacoes_paciente TEXT,
          observacoes_medico TEXT,
          permite_reagendamento BOOLEAN DEFAULT true,
          reagendamento_limite TIMESTAMP WITH TIME ZONE,
          agendado_por UUID NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`
    ];
    
    for (let i = 0; i < commands.length; i++) {
      console.log(`Executando comando ${i + 1}/${commands.length}...`);
      const { error } = await supabase.rpc('exec', { sql: commands[i] });
      if (error) {
        console.error(`❌ Erro no comando ${i + 1}:`, error);
        return;
      }
    }
    
    console.log('✅ Estrutura criada com sucesso!');
    
    // Inserir dados de exemplo
    console.log('📊 Inserindo dados de exemplo...');
    
    const { error: insertError } = await supabase.rpc('exec', {
      sql: `
        INSERT INTO medicos (user_id, crm, uf_crm, especialidade, nome, email, telefone, valor_consulta_presencial, valor_consulta_teleconsulta) VALUES
        ('11111111-1111-1111-1111-111111111111', 'CRM12345', 'SP', 'Cardiologia', 'Dr. João Silva', 'joao@teste.com', '(11) 99999-1111', 200.00, 150.00),
        ('22222222-2222-2222-2222-222222222222', 'CRM67890', 'RJ', 'Dermatologia', 'Dra. Maria Santos', 'maria@teste.com', '(21) 99999-2222', 180.00, 130.00);
        
        INSERT INTO pacientes (user_id, nome, email, cpf, data_nascimento, telefone, cidade, estado) VALUES
        ('44444444-4444-4444-4444-444444444444', 'Ana Costa', 'ana@teste.com', '123.456.789-01', '1990-05-15', '(11) 99999-4444', 'São Paulo', 'SP'),
        ('55555555-5555-5555-5555-555555555555', 'Pedro Oliveira', 'pedro@teste.com', '987.654.321-09', '1985-08-22', '(21) 99999-5555', 'Rio de Janeiro', 'RJ');
      `
    });
    
    if (insertError) {
      console.error('❌ Erro ao inserir dados:', insertError);
    } else {
      console.log('✅ Dados de exemplo inseridos!');
    }
    
    console.log('🎉 Banco configurado completamente!');
    
  } catch (err) {
    console.error('❌ Erro geral:', err.message);
  }
}

setupDatabase().catch(console.error);