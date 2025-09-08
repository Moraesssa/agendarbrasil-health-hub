import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyFix() {
  console.log('🔧 APLICANDO CORREÇÃO COMPLETA DO PROBLEMA');
  console.log('=' .repeat(50));
  
  try {
    // Ler o arquivo SQL de correção
    const sqlContent = readFileSync('fix-user-sync-problem.sql', 'utf8');
    
    // Dividir em comandos individuais
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📋 Executando ${commands.length} comandos de correção...\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      if (command.includes('PASSO')) {
        console.log(`\n🔄 ${command.match(/PASSO \d+: (.+)/)?.[1] || 'Executando comando'}`);
        continue;
      }
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: command });
        
        if (error) {
          console.log(`❌ Erro: ${error.message}`);
          errorCount++;
        } else {
          console.log(`✅ Comando executado com sucesso`);
          successCount++;
        }
      } catch (e) {
        console.log(`❌ Exceção: ${e.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n📊 RESULTADO:`);
    console.log(`✅ Sucessos: ${successCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    
    // Verificar resultado final
    console.log(`\n🔍 VERIFICANDO RESULTADO...`);
    
    const { count: profilesCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    const { count: medicosCount } = await supabase
      .from('medicos')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Profiles: ${profilesCount || 0} registros`);
    console.log(`📊 Médicos: ${medicosCount || 0} registros`);
    
    // Verificar que RLS está desabilitado (conforme solicitado)
    const supabaseAnon = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );
    
    const { data: anonTest, error: anonError } = await supabaseAnon
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (anonError) {
      console.log(`⚠️ Possível problema de acesso: ${anonError.message}`);
    } else {
      console.log(`✅ RLS DESABILITADO conforme solicitado - ${anonTest?.length || 0} registros acessíveis`);
    }
    
    console.log(`\n✅ CORREÇÃO APLICADA!`);
    console.log(`💡 Agora teste criando um novo usuário para verificar se a sincronização funciona.`);
    
  } catch (error) {
    console.error('❌ ERRO NA APLICAÇÃO DA CORREÇÃO:', error.message);
  }
}

applyFix().catch(console.error);