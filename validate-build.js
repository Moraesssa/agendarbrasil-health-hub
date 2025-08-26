#!/usr/bin/env node

/**
 * Build Validation Script
 * Validates that the production build works correctly
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

console.log('🔧 Validando build de produção...\n');

try {
  // Test production build
  console.log('1. Executando build de produção...');
  const { stdout, stderr } = await execAsync('npm run build');
  
  if (stderr && !stderr.includes('warning')) {
    console.error('❌ Erro no build:', stderr);
    process.exit(1);
  }
  
  console.log('✅ Build executado com sucesso!');
  console.log('📊 Estatísticas do build:');
  
  // Check if dist folder was created
  const fs = await import('fs');
  const path = await import('path');
  
  const distPath = path.join(process.cwd(), 'dist');
  if (fs.existsSync(distPath)) {
    const files = fs.readdirSync(distPath);
    console.log(`   - Arquivos gerados: ${files.length}`);
    console.log(`   - Arquivos: ${files.join(', ')}`);
  }
  
  console.log('\n🎉 SUCESSO: Build de produção está funcionando!');
  console.log('💡 Suas alterações agora devem refletir em produção.');
  
} catch (error) {
  console.error('❌ FALHA no build:', error.message);
  console.log('\n🔍 Problemas encontrados:');
  console.log('   - Verifique se todas as dependências estão instaladas');
  console.log('   - Execute: npm install');
  console.log('   - Verifique erros de compilação TypeScript');
  process.exit(1);
}