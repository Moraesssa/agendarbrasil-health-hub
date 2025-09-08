import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSchedulingService() {
  console.log('🧪 TESTANDO SCHEDULING SERVICE CORRIGIDO');
  console.log('=' .repeat(50));
  
  try {
    // Simular o método searchDoctorsWithFilters corrigido
    console.log('\n1. Testando query básica de médicos...');
    
    let query = supabase
      .from('medicos')
      .select(`
        *,
        profiles!inner(display_name, email)
      `);
    
    const { data: medicos, error } = await query.limit(5);
    
    if (error) {
      console.log('❌ Erro na query:', error.message);
      return;
    }
    
    console.log('✅ Query básica funcionou!');
    console.log(`Encontrados ${medicos?.length || 0} médicos`);
    
    if (medicos && medicos.length > 0) {
      console.log('Exemplo de médico:', {
        id: medicos[0].id,
        crm: medicos[0].crm,
        especialidades: medicos[0].especialidades,
        nome: medicos[0].profiles?.display_name,
        email: medicos[0].profiles?.email
      });
    }
    
    // Teste 2: Filtro por especialidade
    console.log('\n2. Testando filtro por especialidade...');
    
    const { data: medicosCard, error: errorCard } = await supabase
      .from('medicos')
      .select(`
        *,
        profiles!inner(display_name, email)
      `)
      .contains('especialidades', ['Cardiologia'])
      .limit(3);
    
    if (errorCard) {
      console.log('❌ Erro no filtro de especialidade:', errorCard.message);
    } else {
      console.log('✅ Filtro por especialidade funcionou!');
      console.log(`Cardiologistas encontrados: ${medicosCard?.length || 0}`);
    }
    
    // Teste 3: Filtro por localização
    console.log('\n3. Testando filtro por localização...');
    
    const { data: locais } = await supabase
      .from('locais_atendimento')
      .select('medico_id')
      .eq('ativo', true)
      .ilike('cidade', '%São Paulo%');
    
    if (locais && locais.length > 0) {
      const medicoIds = locais.map(l => l.medico_id);
      
      const { data: medicosSP, error: errorSP } = await supabase
        .from('medicos')
        .select(`
          *,
          profiles!inner(display_name, email)
        `)
        .in('user_id', medicoIds)
        .limit(3);
      
      if (errorSP) {
        console.log('❌ Erro no filtro de localização:', errorSP.message);
      } else {
        console.log('✅ Filtro por localização funcionou!');
        console.log(`Médicos em São Paulo: ${medicosSP?.length || 0}`);
      }
    } else {
      console.log('⚠️ Nenhum local em São Paulo encontrado');
    }
    
    // Teste 4: Teste de segurança com usuário anônimo
    console.log('\n4. Testando segurança com usuário anônimo...');
    
    const supabaseAnon = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );
    
    const { data: medicosAnon, error: errorAnon } = await supabaseAnon
      .from('medicos')
      .select('*')
      .limit(1);
    
    if (errorAnon) {
      console.log('✅ RLS funcionando - usuário anônimo bloqueado:', errorAnon.message);
    } else {
      console.log('⚠️ VAZAMENTO DE SEGURANÇA - usuário anônimo pode acessar:', medicosAnon?.length || 0, 'registros');
    }
    
    console.log('\n✅ TESTE COMPLETO FINALIZADO');
    
  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error.message);
  }
}

testSchedulingService().catch(console.error);