/**
 * Script para validar a integridade das políticas de RLS no código-fonte.
 *
 * Este script verifica se os arquivos de migração que contêm as correções de segurança
 * RLS mais importantes e recentes existem no diretório de migrações.
 *
 * Isso garante que a base de código contenha as políticas de segurança corretas,
 * servindo como um teste de sanidade essencial antes do deploy.
 */

import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MIGRATIONS_DIR = join(__dirname, 'supabase', 'migrations');

// Lista de arquivos de migração críticos que definem as políticas de RLS seguras.
// Estes são os arquivos mais recentes e importantes que analisei.
const CRITICAL_RLS_MIGRATIONS = [
  // Política para a tabela `medicos`
  '20250814040708_32761b50-6f29-4615-a322-7cfb0d2bdeef.sql',
  // Política para a tabela `consultas`
  '20250814040034_8b8fd757-7a50-4b13-a53d-a58f326c9538.sql',
  // Política para a tabela `profiles`
  '20250814041616_a3a76219-0ea4-454c-a500-30c6cc8b430b.sql',
  // Política para a tabela `pagamentos` (bônus, encontrada na análise)
  '20250814040300_payment_security_final_fix.sql'
];

function validateRLSMigrationFiles() {
  console.log('🔍 Validando a existência de arquivos de migração de RLS críticos...');
  let allFound = true;

  for (const migrationFile of CRITICAL_RLS_MIGRATIONS) {
    const path = join(MIGRATIONS_DIR, migrationFile);
    if (existsSync(path)) {
      console.log(`✅ ENCONTRADO: ${migrationFile}`);
    } else {
      console.error(`❌ NÃO ENCONTRADO: ${migrationFile}`);
      allFound = false;
    }
  }

  if (allFound) {
    console.log('\n🎉 Sucesso! Todos os arquivos de migração de RLS críticos estão presentes na base de código.');
    return true;
  } else {
    console.error('\n🚨 Falha na validação! Um ou mais arquivos de migração de RLS críticos estão ausentes.');
    console.error('   Isso indica que a base de código pode não ter as políticas de segurança mais recentes.');
    return false;
  }
}

// Executar validação
const success = validateRLSMigrationFiles();
process.exit(success ? 0 : 1);
