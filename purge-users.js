// Script temporário para apagar TODOS os usuários de autenticação
// Execute: node purge-users.js

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ulebotjrsgheybhpdnxd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsZWJvdGpyc2doZXliaHBkbnhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NDM5MjUsImV4cCI6MjA2NjExOTkyNX0.1OVxsso5wSjnvOClf-i3DfsUUOKkpwkjioEndKB2ux4';

// Substitua pelo valor real do segredo que você configurou
const PURGE_SECRET = 'your-purge-secret-here';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function purgeAllUsers() {
  console.log('🔥 Iniciando limpeza de TODOS os usuários de autenticação...');
  
  try {
    const { data, error } = await supabase.functions.invoke('purge-auth-users', {
      body: {
        purge_secret: PURGE_SECRET
      }
    });

    if (error) {
      console.error('❌ Erro ao chamar função:', error);
      return;
    }

    console.log('✅ Resultado:', data);
    console.log(`🎉 ${data.totalDeleted} usuários foram deletados!`);
    
  } catch (error) {
    console.error('💥 Erro:', error);
  }
}

purgeAllUsers();