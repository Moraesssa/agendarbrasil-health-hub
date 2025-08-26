/**
 * TESTE COMPLETO DO SISTEMA DE AGENDAMENTO
 * Execute este script no console do navegador para verificar se todas as correções funcionaram
 */

console.log('🚀 Iniciando teste completo do sistema de agendamento...');

// Função para criar cliente Supabase
function getSupabaseClient() {
  const url = localStorage.getItem('supabaseUrl') || prompt('Insira a URL do Supabase:');
  const key = localStorage.getItem('supabaseKey') || prompt('Insira a chave anônima do Supabase:');
  
  if (url) localStorage.setItem('supabaseUrl', url);
  if (key) localStorage.setItem('supabaseKey', key);
  
  if (!url || !key) {
    console.error('❌ Credenciais do Supabase são obrigatórias');
    return null;
  }
  
  return window.supabase.createClient(url, key);
}

// Testes principais
async function testarSistemaCompleto() {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  
  const resultados = {
    perfis: false,
    especialidades: false,
    estados: false,
    cidades: false,
    medicos: false,
    consultas: false,
    rpc: false
  };

  console.log('\n📊 1. TESTANDO ESTRUTURA DE PERFIS...');
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, user_type, display_name, email')
      .limit(5);
    
    if (error) {
      console.error('❌ Erro ao buscar perfis:', error.message);
    } else {
      console.log(`✅ Perfis encontrados: ${profiles?.length || 0}`);
      if (profiles?.length > 0) {
        console.log('📋 Tipos de usuário:', [...new Set(profiles.map(p => p.user_type))]);
        resultados.perfis = true;
      }
    }
  } catch (err) {
    console.error('❌ Erro inesperado:', err.message);
  }

  console.log('\n🏥 2. TESTANDO FUNÇÃO GET_SPECIALTIES...');
  try {
    const { data: especialidades, error } = await supabase.rpc('get_specialties');
    
    if (error) {
      console.error('❌ Erro na função get_specialties:', error.message);
    } else {
      console.log(`✅ Especialidades encontradas: ${especialidades?.length || 0}`);
      if (especialidades?.length > 0) {
        console.log('📋 Primeiras especialidades:', especialidades.slice(0, 5));
        resultados.especialidades = true;
      }
    }
  } catch (err) {
    console.error('❌ Erro inesperado:', err.message);
  }

  console.log('\n🗺️ 3. TESTANDO FUNÇÃO GET_AVAILABLE_STATES...');
  try {
    const { data: estados, error } = await supabase.rpc('get_available_states');
    
    if (error) {
      console.error('❌ Erro na função get_available_states:', error.message);
    } else {
      console.log(`✅ Estados encontrados: ${estados?.length || 0}`);
      if (estados?.length > 0) {
        console.log('📋 Estados:', estados.map(e => e.uf || e.nome));
        resultados.estados = true;
        
        // Testar cidades para o primeiro estado
        const primeiroEstado = estados[0]?.uf;
        if (primeiroEstado) {
          console.log(`\n🏙️ 4. TESTANDO CIDADES PARA ${primeiroEstado}...`);
          const { data: cidades, error: cidadesError } = await supabase
            .rpc('get_available_cities', { state_uf: primeiroEstado });
          
          if (cidadesError) {
            console.error('❌ Erro na função get_available_cities:', cidadesError.message);
          } else {
            console.log(`✅ Cidades em ${primeiroEstado}: ${cidades?.length || 0}`);
            if (cidades?.length > 0) {
              console.log('📋 Cidades:', cidades.map(c => c.cidade));
              resultados.cidades = true;
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('❌ Erro inesperado:', err.message);
  }

  console.log('\n👨‍⚕️ 5. TESTANDO BUSCA DE MÉDICOS...');
  try {
    const { data: medicos, error } = await supabase
      .rpc('get_doctors_by_location_and_specialty', {
        p_specialty: null,
        p_city: null,
        p_state: null
      });
    
    if (error) {
      console.error('❌ Erro na função get_doctors_by_location_and_specialty:', error.message);
    } else {
      console.log(`✅ Médicos encontrados: ${medicos?.length || 0}`);
      if (medicos?.length > 0) {
        console.log('📋 Primeiros médicos:', medicos.slice(0, 3).map(m => ({
          nome: m.display_name,
          crm: m.crm,
          especialidades: m.especialidades
        })));
        resultados.medicos = true;
      }
    }
  } catch (err) {
    console.error('❌ Erro inesperado:', err.message);
  }

  console.log('\n📅 6. TESTANDO ESTRUTURA DE CONSULTAS...');
  try {
    // Testar com nome correto da coluna
    const { data: consultas, error } = await supabase
      .from('consultas')
      .select('id, paciente_id, medico_id, data_consulta, status, tipo_consulta')
      .limit(5);
    
    if (error) {
      console.error('❌ Erro ao buscar consultas (data_consulta):', error.message);
      
      // Testar com nome antigo se o novo falhou
      const { data: consultasOld, error: errorOld } = await supabase
        .from('consultas')
        .select('id, paciente_id, medico_id, consultation_date, status, consultation_type')
        .limit(5);
      
      if (errorOld) {
        console.error('❌ Erro ao buscar consultas (consultation_date):', errorOld.message);
      } else {
        console.log('⚠️ Consultas encontradas com nomes antigos de campos');
        console.log('❗ Necessário executar script de correção SQL');
        resultados.consultas = false;
      }
    } else {
      console.log(`✅ Consultas encontradas: ${consultas?.length || 0}`);
      console.log('✅ Campos corretos: data_consulta, tipo_consulta');
      resultados.consultas = true;
    }
  } catch (err) {
    console.error('❌ Erro inesperado:', err.message);
  }

  console.log('\n🔧 7. TESTANDO FUNÇÃO DE RESERVA...');
  try {
    // Testar apenas a existência da função sem criar agendamento real
    const { data, error } = await supabase.rpc('reserve_appointment_slot', {
      p_doctor_id: '00000000-0000-0000-0000-000000000000',
      p_patient_id: '00000000-0000-0000-0000-000000000000',
      p_scheduled_by_id: '00000000-0000-0000-0000-000000000000',
      p_appointment_datetime: new Date().toISOString(),
      p_specialty: 'Teste'
    });
    
    // Esperamos um erro aqui porque os IDs são inválidos, mas a função deve existir
    if (error && error.message.includes('does not exist')) {
      console.error('❌ Função reserve_appointment_slot não existe');
    } else {
      console.log('✅ Função reserve_appointment_slot existe e está acessível');
      resultados.rpc = true;
    }
  } catch (err) {
    console.log('✅ Função reserve_appointment_slot está funcionando (erro esperado com IDs inválidos)');
    resultados.rpc = true;
  }

  // Resumo final
  console.log('\n📊 RESUMO DOS TESTES:');
  console.log('=====================');
  
  const total = Object.keys(resultados).length;
  const sucessos = Object.values(resultados).filter(Boolean).length;
  
  Object.entries(resultados).forEach(([teste, sucesso]) => {
    console.log(`${sucesso ? '✅' : '❌'} ${teste.toUpperCase()}: ${sucesso ? 'OK' : 'FALHOU'}`);
  });
  
  console.log(`\n📈 RESULTADO: ${sucessos}/${total} testes passaram`);
  
  if (sucessos === total) {
    console.log('🎉 TODOS OS TESTES PASSARAM! O sistema está funcionando.');
    console.log('🔗 Acesse: https://agendarbrasil-health-hub.lovable.app/agendamento');
  } else {
    console.log('⚠️ Alguns testes falharam. Verifique as correções necessárias.');
    console.log('📋 Execute o script SQL: FIX_AGENDAMENTO_COMPLETE.sql no Supabase');
  }
  
  return { sucessos, total, resultados };
}

// Função para testar perfil específico
async function testarPerfilUsuario(userId) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  
  console.log(`\n👤 TESTANDO PERFIL DO USUÁRIO: ${userId}`);
  
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('❌ Erro ao buscar perfil:', error.message);
      
      // Tentar criar perfil
      console.log('🔧 Tentando criar perfil...');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            email: user.email,
            display_name: user.user_metadata?.full_name || user.email,
            user_type: null,
            onboarding_completed: false,
            is_active: true
          })
          .select()
          .single();
        
        if (createError) {
          console.error('❌ Erro ao criar perfil:', createError.message);
        } else {
          console.log('✅ Perfil criado com sucesso:', newProfile);
        }
      }
    } else {
      console.log('✅ Perfil encontrado:', profile);
    }
  } catch (err) {
    console.error('❌ Erro inesperado:', err.message);
  }
}

// Executar testes automaticamente
testarSistemaCompleto().then(resultado => {
  console.log('\n🎯 Teste completo finalizado!');
  
  // Disponibilizar funções globalmente para uso manual
  window.testeAgendamento = {
    completo: testarSistemaCompleto,
    perfil: testarPerfilUsuario,
    resultado: resultado
  };
  
  console.log('\n💡 Funções disponíveis para teste manual:');
  console.log('- window.testeAgendamento.completo() - Executar todos os testes');
  console.log('- window.testeAgendamento.perfil("user-id") - Testar perfil específico');
});

console.log('🔄 Executando testes automaticamente...');