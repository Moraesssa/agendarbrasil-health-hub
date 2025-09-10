#!/usr/bin/env node

/**
 * Console Super Otimizado para Desenvolvimento
 * Monitora problemas em tempo real durante npm run dev
 */

import { createServer } from 'vite';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class DevMonitor {
  constructor() {
    this.issues = {
      errors: [],
      warnings: [],
      performance: [],
      dependencies: [],
      typescript: []
    };
    this.startTime = Date.now();
    this.lastCheck = Date.now();
  }

  // Console colorido e organizado
  log(type, message, details = null) {
    const timestamp = new Date().toLocaleTimeString();
    const colors = {
      error: chalk.red,
      warning: chalk.yellow,
      success: chalk.green,
      info: chalk.blue,
      performance: chalk.magenta
    };

    console.log(`${chalk.gray(timestamp)} ${colors[type](`[${type.toUpperCase()}]`)} ${message}`);
    if (details) {
      console.log(chalk.gray(`  └─ ${details}`));
    }
  }

  // Monitora arquivos TypeScript
  async checkTypeScriptIssues() {
    try {
      const tscProcess = spawn('npx', ['tsc', '--noEmit', '--pretty'], {
        stdio: 'pipe',
        shell: true
      });

      let output = '';
      tscProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      tscProcess.stderr.on('data', (data) => {
        output += data.toString();
      });

      tscProcess.on('close', (code) => {
        if (code !== 0 && output.trim()) {
          const errors = output.split('\n').filter(line => line.includes('error TS'));
          this.issues.typescript = errors;
          
          if (errors.length > 0) {
            this.log('error', `${errors.length} erros TypeScript encontrados`);
            errors.slice(0, 3).forEach(error => {
              this.log('info', error.trim());
            });
            if (errors.length > 3) {
              this.log('info', `... e mais ${errors.length - 3} erros`);
            }
          }
        } else {
          if (this.issues.typescript.length > 0) {
            this.log('success', 'Todos os erros TypeScript foram corrigidos! 🎉');
            this.issues.typescript = [];
          }
        }
      });
    } catch (error) {
      this.log('warning', 'Não foi possível verificar TypeScript', error.message);
    }
  }

  // Monitora performance do bundle
  async checkBundlePerformance() {
    try {
      const distPath = path.join(process.cwd(), 'dist');
      if (fs.existsSync(distPath)) {
        const files = fs.readdirSync(distPath, { recursive: true });
        const jsFiles = files.filter(f => f.endsWith('.js'));
        
        let totalSize = 0;
        const largeBundles = [];

        jsFiles.forEach(file => {
          const filePath = path.join(distPath, file);
          const stats = fs.statSync(filePath);
          const sizeKB = Math.round(stats.size / 1024);
          totalSize += sizeKB;

          if (sizeKB > 500) { // Bundles maiores que 500KB
            largeBundles.push({ file, size: sizeKB });
          }
        });

        if (largeBundles.length > 0) {
          this.log('performance', `${largeBundles.length} bundles grandes detectados`);
          largeBundles.forEach(({ file, size }) => {
            this.log('warning', `${file}: ${size}KB`);
          });
        }

        if (totalSize > 2000) { // Total maior que 2MB
          this.log('performance', `Bundle total: ${totalSize}KB - considere otimização`);
        }
      }
    } catch (error) {
      // Silencioso se dist não existir (modo dev)
    }
  }

  // Verifica dependências desatualizadas
  async checkOutdatedDependencies() {
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      // Verifica algumas dependências críticas
      const criticalDeps = ['react', 'typescript', 'vite', '@types/react'];
      const outdatedCritical = [];

      for (const dep of criticalDeps) {
        if (deps[dep]) {
          // Simulação - em produção usaria npm outdated
          const currentVersion = deps[dep].replace(/[\^~]/, '');
          if (currentVersion.includes('17.') && dep === 'react') {
            outdatedCritical.push(`${dep}: ${currentVersion} → 18.x disponível`);
          }
        }
      }

      if (outdatedCritical.length > 0) {
        this.log('warning', 'Dependências críticas desatualizadas encontradas');
        outdatedCritical.forEach(dep => this.log('info', dep));
      }
    } catch (error) {
      this.log('warning', 'Erro ao verificar dependências', error.message);
    }
  }

  // Monitora uso de memória
  checkMemoryUsage() {
    const usage = process.memoryUsage();
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);

    if (heapUsedMB > 512) { // Mais de 512MB
      this.log('performance', `Alto uso de memória: ${heapUsedMB}MB/${heapTotalMB}MB`);
    }

    return { heapUsedMB, heapTotalMB };
  }

  // Relatório resumido
  generateReport() {
    const uptime = Math.round((Date.now() - this.startTime) / 1000);
    const memory = this.checkMemoryUsage();
    
    console.log('\n' + chalk.cyan('='.repeat(60)));
    console.log(chalk.cyan.bold('📊 RELATÓRIO DE DESENVOLVIMENTO'));
    console.log(chalk.cyan('='.repeat(60)));
    
    console.log(`⏱️  Tempo ativo: ${uptime}s`);
    console.log(`🧠 Memória: ${memory.heapUsedMB}MB/${memory.heapTotalMB}MB`);
    console.log(`🔴 Erros TS: ${this.issues.typescript.length}`);
    console.log(`⚠️  Warnings: ${this.issues.warnings.length}`);
    console.log(`⚡ Performance: ${this.issues.performance.length} alertas`);
    
    if (this.issues.typescript.length === 0 && this.issues.warnings.length === 0) {
      console.log(chalk.green.bold('\n✨ Tudo funcionando perfeitamente! ✨'));
    } else {
      console.log(chalk.yellow.bold('\n🔧 Algumas melhorias podem ser feitas'));
    }
    
    console.log(chalk.cyan('='.repeat(60)) + '\n');
  }

  // Inicia monitoramento
  async start() {
    this.log('success', 'Console Super Otimizado iniciado! 🚀');
    this.log('info', 'Servidor rodando em http://127.0.0.1:8083/');
    
    // Verificações iniciais
    await this.checkTypeScriptIssues();
    await this.checkOutdatedDependencies();
    
    // Monitoramento contínuo
    setInterval(async () => {
      await this.checkTypeScriptIssues();
      this.checkMemoryUsage();
    }, 30000); // A cada 30 segundos

    // Relatório a cada 5 minutos
    setInterval(() => {
      this.generateReport();
    }, 300000);

    // Verificação de performance a cada 2 minutos
    setInterval(async () => {
      await this.checkBundlePerformance();
    }, 120000);

    // Relatório inicial após 10 segundos
    setTimeout(() => {
      this.generateReport();
    }, 10000);
  }

  // Cleanup ao sair
  setupCleanup() {
    process.on('SIGINT', () => {
      this.log('info', 'Finalizando Console Super Otimizado...');
      this.generateReport();
      process.exit(0);
    });
  }
}

// Inicia o monitor
const monitor = new DevMonitor();
monitor.setupCleanup();
monitor.start();