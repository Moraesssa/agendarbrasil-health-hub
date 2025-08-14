#!/usr/bin/env node

/**
 * Production Readiness Validation Script
 * Validates that the application is ready for production deployment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ProductionValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.score = 10.0;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '✅',
      warn: '⚠️',
      error: '❌'
    }[type];
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  addError(message, impact = 1.0) {
    this.errors.push(message);
    this.score -= impact;
    this.log(message, 'error');
  }

  addWarning(message, impact = 0.2) {
    this.warnings.push(message);
    this.score -= impact;
    this.log(message, 'warn');
  }

  checkFileExists(filePath, required = true) {
    const fullPath = path.join(__dirname, filePath);
    const exists = fs.existsSync(fullPath);
    
    if (!exists && required) {
      this.addError(`Arquivo obrigatório não encontrado: ${filePath}`);
    } else if (!exists) {
      this.addWarning(`Arquivo recomendado não encontrado: ${filePath}`);
    }
    
    return exists;
  }

  checkMockDataUsage() {
    this.log('Verificando uso de dados mock...');
    
    const mockDataPath = path.join(__dirname, 'src/utils/mockData.ts');
    if (fs.existsSync(mockDataPath)) {
      this.addError('Arquivo de dados mock ainda presente em produção', 2.0);
    }

    // Check for mock imports in source files
    const srcDir = path.join(__dirname, 'src');
    this.checkDirectoryForMockUsage(srcDir);
  }

  checkDirectoryForMockUsage(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        this.checkDirectoryForMockUsage(filePath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        // Skip test files - mocking is expected in tests
        if (file.includes('.test.') || file.includes('.spec.') || filePath.includes('__tests__')) {
          return;
        }
        
        const content = fs.readFileSync(filePath, 'utf8');
        
        if (content.includes('mockData') || content.includes('mock')) {
          const relativePath = path.relative(__dirname, filePath);
          this.addError(`Uso de dados mock encontrado em: ${relativePath}`, 1.5);
        }
      }
    }
  }

  checkDisabledFiles() {
    this.log('Verificando arquivos desabilitados...');
    
    const srcDir = path.join(__dirname, 'src');
    this.checkDirectoryForDisabledFiles(srcDir);
  }

  checkDirectoryForDisabledFiles(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        this.checkDirectoryForDisabledFiles(filePath);
      } else if (file.includes('.disabled')) {
        const relativePath = path.relative(__dirname, filePath);
        this.addError(`Arquivo desabilitado encontrado: ${relativePath}`, 1.0);
      }
    }
  }

  checkEnvironmentVariables() {
    this.log('Verificando variáveis de ambiente...');
    
    const requiredVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];

    const optionalVars = [
      'VITE_STRIPE_PUBLISHABLE_KEY',
      'STRIPE_SECRET_KEY',
      'RESEND_API_KEY'
    ];

    // Check .env.example exists
    if (!this.checkFileExists('.env.example')) {
      this.addWarning('Arquivo .env.example não encontrado');
    }

    // Check for hardcoded values in .env.example
    const envExamplePath = path.join(__dirname, '.env.example');
    if (fs.existsSync(envExamplePath)) {
      const content = fs.readFileSync(envExamplePath, 'utf8');
      
      if (content.includes('your-project-ref') || content.includes('your-anon-key')) {
        this.addWarning('Arquivo .env.example contém valores placeholder');
      }
    }
  }

  checkSecurityIssues() {
    this.log('Verificando problemas de segurança...');
    
    // Check for hardcoded secrets in source files
    const srcDir = path.join(__dirname, 'src');
    this.checkDirectoryForSecrets(srcDir);
    
    // Check debug scripts for hardcoded credentials (actual values, not variable names)
    const debugFiles = fs.readdirSync(__dirname).filter(f => f.startsWith('debug-') || f.startsWith('test-'));
    
    for (const file of debugFiles) {
      const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
      
      // Look for actual hardcoded credential values, not variable names or placeholders
      const hardcodedPatterns = [
        /sk_[a-zA-Z0-9]{20,}/g,  // Actual Stripe secret keys
        /pk_[a-zA-Z0-9]{20,}/g,  // Actual Stripe publishable keys  
        /whsec_[a-zA-Z0-9]{20,}/g, // Actual webhook secrets
        /re_[a-zA-Z0-9]{20,}/g,  // Actual Resend API keys
      ];
      
      for (const pattern of hardcodedPatterns) {
        const matches = content.match(pattern);
        if (matches) {
          // Exclude placeholders and examples
          const realCredentials = matches.filter(match => 
            !match.includes('your-') && 
            !match.includes('test_') && 
            !match.includes('example') &&
            match.length > 25 // Real credentials are longer
          );
          
          if (realCredentials.length > 0) {
            this.addError(`Credenciais hardcoded encontradas em: ${file}`, 2.0);
            break;
          }
        }
      }
    }
  }

  checkDirectoryForSecrets(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        this.checkDirectoryForSecrets(filePath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for actual hardcoded credentials (not variable names or imports)
        const secretPatterns = [
          /sk_[a-zA-Z0-9]{20,}/g,  // Real Stripe secret keys
          /pk_[a-zA-Z0-9]{20,}/g,  // Real Stripe publishable keys
          /whsec_[a-zA-Z0-9]{20,}/g, // Real webhook secrets
          /re_[a-zA-Z0-9]{20,}/g,  // Real Resend API keys
          /password\s*[:=]\s*["'][^"']{8,}["']/gi, // Actual passwords
        ];

        for (const pattern of secretPatterns) {
          const matches = content.match(pattern);
          if (matches) {
            // Filter out placeholders and test values
            const realCredentials = matches.filter(match => 
              !match.includes('your-') && 
              !match.includes('test_') && 
              !match.includes('example') &&
              !match.includes('placeholder')
            );
            
            if (realCredentials.length > 0) {
              const relativePath = path.relative(__dirname, filePath);
              this.addError(`Credencial hardcoded encontrada em: ${relativePath}`, 2.0);
              break;
            }
          }
        }
      }
    }
  }

  checkBuildConfiguration() {
    this.log('Verificando configuração de build...');
    
    // Check package.json scripts
    const packagePath = path.join(__dirname, 'package.json');
    if (fs.existsSync(packagePath)) {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      if (!pkg.scripts['build:production']) {
        this.addWarning('Script build:production não encontrado');
      }
      
      if (!pkg.scripts['security:audit']) {
        this.addWarning('Script security:audit não encontrado');
      }
    }

    // Check TypeScript configuration
    if (!this.checkFileExists('tsconfig.json')) {
      this.addError('Configuração TypeScript não encontrada');
    }

    // Check Vite configuration
    if (!this.checkFileExists('vite.config.ts')) {
      this.addError('Configuração Vite não encontrada');
    }
  }

  checkTestCoverage() {
    this.log('Verificando cobertura de testes...');
    
    // Check if test files exist
    const testDir = path.join(__dirname, 'src');
    let testFiles = 0;
    
    this.countTestFiles(testDir, (count) => {
      testFiles = count;
    });

    if (testFiles === 0) {
      this.addWarning('Nenhum arquivo de teste encontrado', 0.5);
    } else if (testFiles < 5) {
      this.addWarning('Cobertura de testes baixa', 0.3);
    }
  }

  countTestFiles(dir, callback) {
    let count = 0;
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        this.countTestFiles(filePath, (subCount) => {
          count += subCount;
        });
      } else if (file.includes('.test.') || file.includes('.spec.')) {
        count++;
      }
    }
    
    callback(count);
  }

  generateReport() {
    this.log('\n=== RELATÓRIO DE PRONTIDÃO PARA PRODUÇÃO ===\n');
    
    console.log(`📊 PONTUAÇÃO FINAL: ${Math.max(0, this.score).toFixed(1)}/10.0\n`);
    
    if (this.errors.length > 0) {
      console.log('❌ ERROS CRÍTICOS:');
      this.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
      console.log('');
    }
    
    if (this.warnings.length > 0) {
      console.log('⚠️  AVISOS:');
      this.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning}`);
      });
      console.log('');
    }

    const readinessLevel = this.score >= 8.5 ? 'PRONTO' : 
                          this.score >= 7.0 ? 'QUASE PRONTO' : 
                          this.score >= 5.0 ? 'NECESSITA MELHORIAS' : 'NÃO PRONTO';
    
    console.log(`🎯 STATUS: ${readinessLevel}\n`);
    
    if (this.score < 8.5) {
      console.log('📋 PRÓXIMOS PASSOS:');
      console.log('   1. Corrigir todos os erros críticos');
      console.log('   2. Revisar e resolver avisos importantes');
      console.log('   3. Executar testes de segurança');
      console.log('   4. Validar configuração de produção');
      console.log('   5. Re-executar esta validação\n');
    }

    return this.score >= 8.5;
  }

  async validate() {
    this.log('Iniciando validação de prontidão para produção...\n');
    
    this.checkMockDataUsage();
    this.checkDisabledFiles();
    this.checkEnvironmentVariables();
    this.checkSecurityIssues();
    this.checkBuildConfiguration();
    this.checkTestCoverage();
    
    const isReady = this.generateReport();
    
    process.exit(isReady ? 0 : 1);
  }
}

// Execute validation
const validator = new ProductionValidator();
validator.validate().catch(console.error);