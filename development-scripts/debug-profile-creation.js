/**
 * DEBUG SCRIPT: CRIAÇÃO MANUAL DE PERFIL DE USUÁRIO
 * 
 * PROBLEMA: Usuário c18291c9-b93e-4077-ad0f-86f5ae88b85d não possui perfil
 * 
 * INSTRUÇÕES:
 * 1. Abra o Console do navegador (F12)
 * 2. Cole este código
 * 3. Execute pressionando Enter
 * 4. Verifique o resultado
 */

console.log('🔧 [DEBUG] Iniciando criação manual de perfil...');

// Função para criar perfil manualmente
async function createUserProfileManually() {
  try {
    const userId = 'c18291c9-b93e-4077-ad0f-86f5ae88b85d';
    
    console.log('🔍 [DEBUG] Verificando usuário autenticado...');
    
    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ [DEBUG] Erro ao obter usuário:', authError);
      return;
    }
    
    if (!user) {
      console.error('❌ [DEBUG] Usuário não está autenticado');
      return;
    }
    
    console.log('✅ [DEBUG] Usuário autenticado:', user.id);
    
    // Verificar se o perfil já existe
    console.log('🔍 [DEBUG] Verificando se perfil existe...');
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (checkError) {
      console.error('❌ [DEBUG] Erro ao verificar perfil existente:', checkError);
      return;
    }
    
    if (existingProfile) {
      console.log('✅ [DEBUG] Perfil já existe:', existingProfile);
      return existingProfile;
    }
    
    // Criar perfil manualmente
    console.log('🔧 [DEBUG] Criando perfil manualmente...');
    
    const profileData = {
      id: userId,
      email: user.email,
      display_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email,
      photo_url: user.user_metadata?.avatar_url || null,
      user_type: null, // Será definido no onboarding
      onboarding_completed: false,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();
    
    if (createError) {
      console.error('❌ [DEBUG] Erro ao criar perfil:', createError);
      
      // Tentar upsert se insert falhar
      console.log('🔄 [DEBUG] Tentando upsert...');
      const { data: upsertProfile, error: upsertError } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' })
        .select()
        .single();
      
      if (upsertError) {
        console.error('❌ [DEBUG] Erro no upsert:', upsertError);
        return;
      }
      
      console.log('✅ [DEBUG] Perfil criado via upsert:', upsertProfile);
      return upsertProfile;
    }
    
    console.log('✅ [DEBUG] Perfil criado com sucesso:', newProfile);
    return newProfile;
    
  } catch (error) {
    console.error('❌ [DEBUG] Erro inesperado:', error);
  }
}

// Função para verificar o estado atual
async function debugProfileState() {
  try {
    const userId = 'c18291c9-b93e-4077-ad0f-86f5ae88b85d';
    
    console.log('🔍 [DEBUG] === DIAGNÓSTICO COMPLETO ===');
    
    // 1. Verificar auth state
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('👤 [DEBUG] Auth user:', user ? { id: user.id, email: user.email } : 'Não autenticado');
    
    // 2. Verificar session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('🔐 [DEBUG] Session:', session ? 'Ativa' : 'Não encontrada');
    
    // 3. Verificar perfil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    console.log('👤 [DEBUG] Profile:', profile || 'Não encontrado');
    console.log('❌ [DEBUG] Profile error:', profileError || 'Nenhum');
    
    // 4. Verificar permissões RLS
    const { data: allProfiles, error: rlsError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    console.log('🔒 [DEBUG] RLS test:', rlsError ? 'Bloqueado - ' + rlsError.message : 'OK');
    
    return { user, session, profile, profileError };
    
  } catch (error) {
    console.error('❌ [DEBUG] Erro no diagnóstico:', error);
  }
}

// Executar diagnóstico
debugProfileState().then(state => {
  if (!state.profile) {
    console.log('🔧 [DEBUG] Perfil não encontrado. Criando...');
    createUserProfileManually().then(() => {
      console.log('🔄 [DEBUG] Recarregando página em 2 segundos...');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    });
  } else {
    console.log('✅ [DEBUG] Perfil já existe. Problema pode ser outro.');
  }
});

// Também disponibilizar as funções globalmente para uso manual
window.debugProfile = {
  create: createUserProfileManually,
  check: debugProfileState
};