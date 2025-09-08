import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class CompleteTableAnalyzer {
  
  async analyzeAllTables() {
    console.log('🔍 ANÁLISE COMPLETA DE TODAS AS TABELAS');
    console.log('=' .repeat(70));
    
    try {
      // 1. Descobrir todas as tabelas existentes
      const tables = await this.discoverAllTables();
      
      // 2. Analisar cada tabela individualmente
      for (const table of tables) {
        await this.analyzeTable(table);
      }
      
      // 3. Analisar relacionamentos entre tabelas
      await this.analyzeRelationships(tables);
      
      // 4. Verificar usuários órfãos
      await this.analyzeOrphanUsers();
      
      // 5. Resumo final
      await this.generateSummary(tables);
      
    } catch (error) {
      console.error('❌ ERRO NA ANÁLISE COMPLETA:', error.message);
    }
  }
  
  async discoverAllTables() {
    console.log('\n📋 DESCOBRINDO TODAS AS TABELAS');
    console.log('-'.repeat(50));
    
    const discoveredTables = [];
    
    // Método 1: Tentar listar via information_schema (se disponível)
    try {
      const { data, error } = await supabase.rpc('get_all_tables');
      
      if (!error && data) {
        console.log('✅ Usando função get_all_tables');
        return data.map(t => t.table_name);
      }
    } catch (e) {
      // Função não existe, continuar com outros métodos
    }
    
    // Método 2: Tentar tabelas conhecidas do projeto
    const knownTables = [
      // Tabelas de usuários
      'profiles', 'user_profiles', 'usuarios',
      
      // Tabelas principais do sistema
      'medicos', 'pacientes', 'consultas',
      'locais_atendimento', 'especialidades',
      
      // Tabelas de agendamento
      'horarios_funcionamento', 'horarios_disponibilidade',
      'bloqueios_agenda', 'disponibilidade_medicos',
      
      // Tabelas de documentos e prontuários
      'prontuarios', 'documentos_digitais', 'prescricoes',
      'atestados', 'pedidos_exame',
      
      // Tabelas de pagamento
      'pagamentos', 'transacoes', 'faturas',
      
      // Tabelas de comunicação
      'mensagens', 'notificacoes', 'emails',
      
      // Tabelas de auditoria
      'auditoria_logs', 'logs_sistema', 'historico_consultas',
      'historico_reagendamentos',
      
      // Tabelas de configuração
      'configuracoes_sistema', 'parametros_globais',
      
      // Tabelas de família/dependentes
      'familiares', 'dependentes', 'responsaveis',
      
      // Tabelas de integração
      'integracao_externa', 'webhooks', 'api_logs',
      
      // Tabelas de relatórios
      'relatorios', 'metricas', 'analytics',
      
      // Outras possíveis
      'cidades', 'estados', 'ceps', 'enderecos',
      'medicamentos', 'cid10', 'procedimentos'
    ];
    
    console.log('🔍 Testando tabelas conhecidas...');
    
    for (const tableName of knownTables) {
      try {
        const { error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          discoveredTables.push(tableName);
          console.log(`✅ ${tableName}`);
        }
      } catch (e) {
        // Tabela não existe, ignorar
      }
    }
    
    // Método 3: Tentar variações de nomes
    const variations = [
      'user', 'users', 'usuario', 'medico', 'paciente', 'consulta',
      'agendamento', 'appointment', 'doctor', 'patient', 'schedule'
    ];
    
    console.log('\n🔍 Testando variações de nomes...');
    
    for (const base of variations) {
      const variants = [
        base, base + 's', base + '_data', base + '_info',
        'tb_' + base, 'tbl_' + base, base + '_table'
      ];
      
      for (const variant of variants) {
        if (!discoveredTables.includes(variant)) {
          try {
            const { error } = await supabase
              .from(variant)
              .select('*', { count: 'exact', head: true });
            
            if (!error) {
              discoveredTables.push(variant);
              console.log(`✅ ${variant} (descoberta)`);
            }
          } catch (e) {
            // Ignorar
          }
        }
      }
    }
    
    console.log(`\n📊 TOTAL DE TABELAS ENCONTRADAS: ${discoveredTables.length}`);
    
    return discoveredTables;
  }
  
  async analyzeTable(tableName) {
    console.log(`\n🔍 ANALISANDO TABELA: ${tableName.toUpperCase()}`);
    console.log('='.repeat(60));
    
    try {
      // 1. Contar registros
      const { count, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.log(`❌ Erro ao contar registros: ${countError.message}`);
        return;
      }
      
      console.log(`📊 Total de registros: ${count || 0}`);
      
      // 2. Analisar estrutura (primeiros registros)
      if (count > 0) {
        const { data: sample, error: sampleError } = await supabase
          .from(tableName)
          .select('*')
          .limit(3);
        
        if (sampleError) {
          console.log(`❌ Erro ao buscar amostra: ${sampleError.message}`);
        } else {
          console.log('\n📋 ESTRUTURA DA TABELA:');
          if (sample && sample.length > 0) {
            const columns = Object.keys(sample[0]);
            console.log(`Colunas (${columns.length}): ${columns.join(', ')}`);
            
            console.log('\n📄 EXEMPLO DE REGISTRO:');
            console.log(JSON.stringify(sample[0], null, 2));
            
            // Analisar tipos de dados
            console.log('\n🔍 ANÁLISE DE TIPOS:');
            for (const [key, value] of Object.entries(sample[0])) {
              const type = this.getDataType(value);
              console.log(`  ${key}: ${type}`);
            }
          }
        }
      } else {
        console.log('⚠️ Tabela vazia - tentando analisar estrutura via inserção de teste');
        await this.analyzeEmptyTableStructure(tableName);
      }
      
      // 3. Verificar RLS
      await this.checkTableRLS(tableName);
      
      // 4. Verificar índices e chaves (se possível)
      await this.analyzeTableConstraints(tableName);
      
    } catch (error) {
      console.log(`❌ Erro na análise da tabela ${tableName}: ${error.message}`);
    }
  }
  
  getDataType(value) {
    if (value === null) return 'NULL';
    if (typeof value === 'string') {
      if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) return 'TIMESTAMP';
      if (value.match(/^\d{4}-\d{2}-\d{2}$/)) return 'DATE';
      if (value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) return 'UUID';
      if (value.match(/^[\w\.-]+@[\w\.-]+\.\w+$/)) return 'EMAIL';
      return `TEXT(${value.length})`;
    }
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'INTEGER' : 'NUMERIC';
    }
    if (typeof value === 'boolean') return 'BOOLEAN';
    if (Array.isArray(value)) return `ARRAY[${value.length}]`;
    if (typeof value === 'object') return 'JSONB';
    return typeof value;
  }
  
  async analyzeEmptyTableStructure(tableName) {
    try {
      // Tentar inserir um registro vazio para descobrir campos obrigatórios
      const { error } = await supabase
        .from(tableName)
        .insert({});
      
      if (error) {
        console.log('💡 Campos obrigatórios identificados pelo erro:');
        console.log(`   ${error.message}`);
        
        // Extrair informações do erro
        if (error.message.includes('null value in column')) {
          const matches = error.message.match(/null value in column "([^"]+)"/g);
          if (matches) {
            console.log('📋 Campos NOT NULL identificados:');
            matches.forEach(match => {
              const field = match.match(/"([^"]+)"/)[1];
              console.log(`   - ${field}`);
            });
          }
        }
      }
    } catch (e) {
      console.log(`⚠️ Não foi possível analisar estrutura vazia: ${e.message}`);
    }
  }
  
  async checkTableRLS(tableName) {
    console.log('\n🔒 VERIFICANDO RLS:');
    
    try {
      // Testar com usuário anônimo
      const supabaseAnon = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.VITE_SUPABASE_ANON_KEY
      );
      
      const { data: anonData, error: anonError } = await supabaseAnon
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (anonError) {
        console.log(`✅ RLS ATIVO - Usuário anônimo bloqueado: ${anonError.message}`);
      } else {
        console.log(`⚠️ RLS INATIVO ou PERMISSIVO - Usuário anônimo pode acessar ${anonData?.length || 0} registros`);
        if (anonData && anonData.length > 0) {
          console.log('🚨 VAZAMENTO DE DADOS DETECTADO!');
        }
      }
    } catch (e) {
      console.log(`✅ RLS bloqueou acesso: ${e.message}`);
    }
  }
  
  async analyzeTableConstraints(tableName) {
    console.log('\n🔗 ANALISANDO RELACIONAMENTOS:');
    
    try {
      // Procurar por campos que parecem chaves estrangeiras
      const { data: sample } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (sample && sample.length > 0) {
        const columns = Object.keys(sample[0]);
        const foreignKeys = columns.filter(col => 
          col.endsWith('_id') || 
          col.includes('user_id') || 
          col.includes('medico_id') || 
          col.includes('paciente_id')
        );
        
        if (foreignKeys.length > 0) {
          console.log('🔑 Possíveis chaves estrangeiras encontradas:');
          foreignKeys.forEach(fk => {
            console.log(`   - ${fk}: ${sample[0][fk]}`);
          });
        } else {
          console.log('⚠️ Nenhuma chave estrangeira óbvia encontrada');
        }
      }
    } catch (e) {
      console.log(`⚠️ Não foi possível analisar relacionamentos: ${e.message}`);
    }
  }
  
  async analyzeRelationships(tables) {
    console.log('\n🔗 ANÁLISE DE RELACIONAMENTOS ENTRE TABELAS');
    console.log('='.repeat(60));
    
    const relationships = [];
    
    for (const table of tables) {
      try {
        const { data: sample } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (sample && sample.length > 0) {
          const columns = Object.keys(sample[0]);
          
          for (const col of columns) {
            if (col.endsWith('_id') && col !== 'id') {
              const referencedTable = col.replace('_id', '');
              const pluralTable = referencedTable + 's';
              
              if (tables.includes(referencedTable) || tables.includes(pluralTable)) {
                relationships.push({
                  from: table,
                  to: tables.includes(referencedTable) ? referencedTable : pluralTable,
                  column: col,
                  value: sample[0][col]
                });
              }
            }
          }
        }
      } catch (e) {
        // Ignorar erros
      }
    }
    
    console.log(`📊 Relacionamentos identificados: ${relationships.length}`);
    
    relationships.forEach(rel => {
      console.log(`🔗 ${rel.from}.${rel.column} → ${rel.to}`);
    });
  }
  
  async analyzeOrphanUsers() {
    console.log('\n👥 ANÁLISE DE USUÁRIOS ÓRFÃOS');
    console.log('='.repeat(60));
    
    try {
      // Verificar se conseguimos acessar auth.users indiretamente
      console.log('🔍 Investigando usuários na autenticação...');
      
      // Tentar criar um usuário de teste para ver se o sistema funciona
      const testEmail = `teste-${Date.now()}@example.com`;
      
      const { data: authResult, error: authError } = await supabase.auth.signUp({
        email: testEmail,
        password: 'teste123456'
      });
      
      if (authError) {
        console.log('❌ Sistema de autenticação com problema:', authError.message);
      } else {
        console.log('✅ Sistema de autenticação funcionando');
        
        if (authResult.user) {
          console.log(`📧 Usuário teste criado: ${authResult.user.email}`);
          console.log(`🆔 ID: ${authResult.user.id}`);
          
          // Aguardar um pouco e verificar se apareceu nas tabelas
          setTimeout(async () => {
            console.log('\n🔍 Verificando se usuário apareceu nas tabelas...');
            
            const userTables = ['profiles', 'user_profiles', 'usuarios'];
            let found = false;
            
            for (const table of userTables) {
              try {
                const { data } = await supabase
                  .from(table)
                  .select('*')
                  .eq('id', authResult.user.id);
                
                if (data && data.length > 0) {
                  console.log(`✅ Usuário encontrado em ${table}:`, data[0]);
                  found = true;
                }
              } catch (e) {
                // Tabela não existe
              }
            }
            
            if (!found) {
              console.log('🚨 PROBLEMA IDENTIFICADO: Usuário criado na autenticação mas NÃO aparece nas tabelas!');
              console.log('💡 Possíveis causas:');
              console.log('   1. Trigger handle_new_user ausente ou com erro');
              console.log('   2. RLS bloqueando inserção automática');
              console.log('   3. Tabela profiles não configurada corretamente');
              console.log('   4. Função de sincronização desabilitada');
            }
          }, 3000);
        }
      }
    } catch (error) {
      console.log('❌ Erro na análise de usuários órfãos:', error.message);
    }
  }
  
  async generateSummary(tables) {
    console.log('\n📊 RESUMO FINAL DA ANÁLISE');
    console.log('='.repeat(60));
    
    let totalRecords = 0;
    const tableStats = [];
    
    for (const table of tables) {
      try {
        const { count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        totalRecords += count || 0;
        tableStats.push({ table, count: count || 0 });
      } catch (e) {
        tableStats.push({ table, count: 'ERRO' });
      }
    }
    
    // Ordenar por número de registros
    tableStats.sort((a, b) => {
      if (typeof a.count === 'number' && typeof b.count === 'number') {
        return b.count - a.count;
      }
      return 0;
    });
    
    console.log(`📋 Total de tabelas analisadas: ${tables.length}`);
    console.log(`📊 Total de registros no sistema: ${totalRecords}`);
    console.log('\n📈 RANKING DE TABELAS POR VOLUME:');
    
    tableStats.forEach((stat, index) => {
      const position = (index + 1).toString().padStart(2, '0');
      const count = typeof stat.count === 'number' ? stat.count.toString().padStart(6, ' ') : 'ERRO  ';
      console.log(`${position}. ${stat.table.padEnd(25, ' ')} ${count} registros`);
    });
    
    // Identificar tabelas vazias
    const emptyTables = tableStats.filter(s => s.count === 0);
    if (emptyTables.length > 0) {
      console.log(`\n⚠️ TABELAS VAZIAS (${emptyTables.length}):`);
      emptyTables.forEach(t => console.log(`   - ${t.table}`));
    }
    
    // Identificar tabelas com problemas
    const errorTables = tableStats.filter(s => s.count === 'ERRO');
    if (errorTables.length > 0) {
      console.log(`\n❌ TABELAS COM PROBLEMAS (${errorTables.length}):`);
      errorTables.forEach(t => console.log(`   - ${t.table}`));
    }
    
    console.log('\n✅ ANÁLISE COMPLETA FINALIZADA!');
  }
}

// Executar análise completa
async function main() {
  const analyzer = new CompleteTableAnalyzer();
  await analyzer.analyzeAllTables();
}

main().catch(console.error);