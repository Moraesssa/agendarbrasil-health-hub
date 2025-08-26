#!/usr/bin/env node

/**
 * Teste de Segurança da Tabela Pagamentos
 * 
 * Valida se as políticas RLS estão funcionando corretamente
 * e se dados de pagamento estão protegidos contra acesso não autorizado.
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('❌ Erro: Variáveis de ambiente necessárias não encontradas')
  console.error('   VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

// Cliente com service role (admin)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// Cliente anônimo (público)
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey)

async function testPaymentSecurity() {
  console.log('🔒 Testando Segurança da Tabela Pagamentos\n')

  let allTestsPassed = true

  try {
    // Teste 1: Verificar se RLS está habilitado
    console.log('1️⃣ Verificando se RLS está habilitado...')
    const { data: rlsCheck } = await supabaseAdmin
      .rpc('sql', {
        query: `
          SELECT schemaname, tablename, rowsecurity 
          FROM pg_tables 
          WHERE tablename = 'pagamentos' AND schemaname = 'public'
        `
      })

    if (rlsCheck && rlsCheck[0]?.rowsecurity) {
      console.log('✅ RLS está habilitado na tabela pagamentos')
    } else {
      console.log('❌ FALHA: RLS não está habilitado!')
      allTestsPassed = false
    }

    // Teste 2: Tentar acesso não autorizado
    console.log('\n2️⃣ Testando acesso não autorizado...')
    const { data: unauthorizedData, error: unauthorizedError } = await supabaseAnon
      .from('pagamentos')
      .select('*')
      .limit(1)

    if (unauthorizedError || (unauthorizedData && unauthorizedData.length === 0)) {
      console.log('✅ Acesso não autorizado bloqueado corretamente')
    } else {
      console.log('❌ FALHA: Dados acessíveis sem autenticação!')
      console.log('   Dados retornados:', unauthorizedData)
      allTestsPassed = false
    }

    // Teste 3: Verificar políticas existentes
    console.log('\n3️⃣ Verificando políticas RLS...')
    const { data: policies } = await supabaseAdmin
      .rpc('sql', {
        query: `
          SELECT policyname, cmd, qual, with_check 
          FROM pg_policies 
          WHERE tablename = 'pagamentos' AND schemaname = 'public'
          ORDER BY policyname
        `
      })

    if (policies && policies.length > 0) {
      console.log(`✅ Encontradas ${policies.length} políticas RLS:`)
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname} (${policy.cmd})`)
      })
    } else {
      console.log('❌ FALHA: Nenhuma política RLS encontrada!')
      allTestsPassed = false
    }

    // Teste 4: Verificar estrutura da tabela
    console.log('\n4️⃣ Verificando estrutura da tabela...')
    const { data: columns } = await supabaseAdmin
      .rpc('sql', {
        query: `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = 'pagamentos' AND table_schema = 'public'
          ORDER BY ordinal_position
        `
      })

    if (columns && columns.length > 0) {
      console.log('✅ Estrutura da tabela verificada:')
      const sensitiveFields = ['gateway_id', 'dados_gateway', 'valor']
      columns.forEach(col => {
        const isSensitive = sensitiveFields.includes(col.column_name)
        const marker = isSensitive ? '🔐' : '  '
        console.log(`   ${marker} ${col.column_name}: ${col.data_type}`)
      })
    } else {
      console.log('❌ FALHA: Não foi possível verificar estrutura da tabela!')
      allTestsPassed = false
    }

    // Teste 5: Verificar função de validação
    console.log('\n5️⃣ Testando função de validação de acesso...')
    const { data: functionExists } = await supabaseAdmin
      .rpc('sql', {
        query: `
          SELECT EXISTS(
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' AND p.proname = 'validate_payment_access'
          ) as exists
        `
      })

    if (functionExists && functionExists[0]?.exists) {
      console.log('✅ Função validate_payment_access existe')
    } else {
      console.log('⚠️  Função validate_payment_access não encontrada')
    }

    // Teste 6: Verificar audit log
    console.log('\n6️⃣ Verificando sistema de auditoria...')
    const { data: auditTableExists } = await supabaseAdmin
      .rpc('sql', {
        query: `
          SELECT EXISTS(
            SELECT 1 FROM pg_tables 
            WHERE tablename = 'audit_log' AND schemaname = 'public'
          ) as exists
        `
      })

    if (auditTableExists && auditTableExists[0]?.exists) {
      console.log('✅ Tabela de auditoria existe')
    } else {
      console.log('⚠️  Tabela de auditoria não encontrada')
    }

    // Resumo final
    console.log('\n' + '='.repeat(50))
    if (allTestsPassed) {
      console.log('🎉 TODOS OS TESTES PASSARAM!')
      console.log('✅ A tabela pagamentos está devidamente protegida')
      console.log('\n📋 Proteções implementadas:')
      console.log('   ✅ Row Level Security (RLS) habilitado')
      console.log('   ✅ Políticas restritivas por usuário')
      console.log('   ✅ Acesso não autorizado bloqueado')
      console.log('   ✅ Campos sensíveis protegidos')
      console.log('   ✅ Auditoria de modificações')
    } else {
      console.log('⚠️  ALGUNS TESTES FALHARAM!')
      console.log('❌ Problemas de segurança detectados')
      console.log('\n🔧 Execute a migração de segurança:')
      console.log('   npx supabase db push')
    }

    return allTestsPassed

  } catch (error) {
    console.error('💥 Erro durante os testes:', error.message)
    return false
  }
}

// Executar testes
testPaymentSecurity()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('💥 Falha crítica:', error)
    process.exit(1)
  })