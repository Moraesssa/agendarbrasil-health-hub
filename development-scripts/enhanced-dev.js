#!/usr/bin/env node

/**
 * Script Enhanced Dev - npm run dev com superpoderes
 * Combina Vite + Monitor + Relatórios em tempo real
 */

import { spawn } from 'child_process';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

class EnhancedDev {
  constructor() {
    this.viteProcess = null;
    this.monitorProcess = null;
    this.isRunning = false;
  }

  // Banner inicial
  showBanner() {
    console.clear();
    console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════╗
║                    🚀 ENHANCED DEV MODE 🚀                   ║
║                                                              ║
║  Vite + Monitor + Relatórios + Otimizações em Tempo Real    ║
║                                                              ║
║  Servidor: http://127.0.0.1:8083/                           ║
║  Status: Iniciando...                                        ║
╚══════════════════════════════════════════════════════════════╝
    `));
  }

  // Inicia o Vite com configurações otimizadas
  startVite() {
    return new Promise((resolve, reject) => {
      this.log('info', 'Iniciando servidor Vite...');
      
      this.viteProcess = spawn('npm', ['run', 'dev'], {
        stdio: ['inherit', 'pipe', 'pipe'],
        shell: true
      });

      let serverReady = false;

      this.viteProcess.stdout.on('data', (data) => {
        const output = data.toString();
        
        // Detecta quando o servidor está pronto
        if (output.includes('Local:') || output.includes('localhost')) {
          if (!serverReady) {
            serverReady = true;
            this.log('success', 'Servidor Vite iniciado com sucesso! 🎉');
            resolve();
          }
        }

        // Filtra e exibe logs importantes
        if (output.includes('error') || output.includes('Error')) {
          this.log('error', 'Erro no Vite:', output.trim());
        } else if (output.includes('warning') || output.includes('Warning')) {
          this.log('warning', 'Aviso do Vite:', output.trim());
        } else if (output.includes('hmr update') || output.includes('page reload')) {
          this.log('info', '🔄 Hot reload executado');
        }
      });

      this.viteProcess.stderr.on('data', (data) => {
        const error = data.toString();
        if (!error.includes('ExperimentalWarning')) {
          this.log('error', 'Erro Vite:', error.trim());
        }
      });

      this.viteProcess.on('close', (code) => {
        if (code !== 0) {
          this.log('error', `Vite finalizou com código ${code}`);
          reject(new Error(`Vite process exited with code ${code}`));
        }
      });

      // Timeout de 30 segundos para inicialização
      setTimeout(() => {
        if (!serverReady) {
          this.log('warning', 'Vite demorou para iniciar, mas continuando...');
          resolve();
        }
      }, 30000);
    });
  }

  // Monitora arquivos e mudanças
  startFileWatcher() {
    this.log('info', 'Iniciando monitoramento de arquivos...');
    
    const watchPaths = ['src/', 'public/', 'package.json', 'vite.config.ts'];
    
    watchPaths.forEach(watchPath => {
      if (fs.existsSync(watchPath)) {
        fs.watch(watchPath, { recursive: true }, (eventType, filename) => {
          if (filename && !filename.includes('node_modules')) {
            if (filename.endsWith('.ts') || filename.endsWith('.tsx')) {
              this.log('info', `📝 Arquivo TypeScript modificado: ${filename}`);
            } else if (filename.endsWith('.css') || filename.endsWith('.scss')) {
              this.log('info', `🎨 Estilo modificado: ${filename}`);
            } else if (filename === 'package.json') {
              this.log('warning', '📦 package.json modificado - considere reiniciar');
            }
          }
        });
      }
    });
  }

  // Verifica saúde do projeto
  async checkProjectHealth() {
    const checks = [];

    // Verifica se .env existe
    if (!fs.existsSync('.env')) {
      checks.push({ type: 'warning', message: 'Arquivo .env não encontrado' });
    }

    // Verifica node_modules
    if (!fs.existsSync('node_modules')) {
      checks.push({ type: 'error', message: 'node_modules não encontrado - execute npm install' });
    }

    // Verifica arquivos essenciais
    const essentialFiles = ['package.json', 'vite.config.ts', 'tsconfig.json'];
    essentialFiles.forEach(file => {
      if (!fs.existsSync(file)) {
        checks.push({ type: 'error', message: `Arquivo essencial não encontrado: ${file}` });
      }
    });

    // Exibe resultados
    if (checks.length === 0) {
      this.log('success', '✅ Projeto saudável - todos os arquivos essenciais encontrados');
    } else {
      checks.forEach(check => {
        this.log(check.type, check.message);
      });
    }

    return checks.filter(c => c.type === 'error').length === 0;
  }

  // Sistema de logs colorido
  log(type, message, details = null) {
    const timestamp = new Date().toLocaleTimeString();
    const colors = {
      error: chalk.red,
      warning: chalk.yellow,
      success: chalk.green,
      info: chalk.blue
    };

    const prefix = {
      error: '❌',
      warning: '⚠️ ',
      success: '✅',
      info: 'ℹ️ '
    };

    console.log(`${chalk.gray(timestamp)} ${prefix[type]} ${colors[type](message)}`);
    if (details) {
      console.log(chalk.gray(`   └─ ${details}`));
    }
  }

  // Exibe estatísticas em tempo real
  showStats() {
    const stats = {
      uptime: Math.round((Date.now() - this.startTime) / 1000),
      memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      pid: process.pid
    };

    console.log(chalk.cyan(`
📊 Estatísticas (${new Date().toLocaleTimeString()})
   ⏱️  Tempo ativo: ${stats.uptime}s
   🧠 Memória: ${stats.memory}MB
   🆔 PID: ${stats.pid}
   🌐 Servidor: http://127.0.0.1:8083/
    `));
  }

  // Cleanup ao sair
  setupCleanup() {
    const cleanup = () => {
      this.log('info', 'Finalizando Enhanced Dev Mode...');
      
      if (this.viteProcess) {
        this.viteProcess.kill();
      }
      
      if (this.monitorProcess) {
        this.monitorProcess.kill();
      }
      
      this.log('success', 'Enhanced Dev Mode finalizado. Até logo! 👋');
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
  }

  // Inicia tudo
  async start() {
    this.startTime = Date.now();
    this.showBanner();
    this.setupCleanup();

    try {
      // Verifica saúde do projeto
      const isHealthy = await this.checkProjectHealth();
      if (!isHealthy) {
        this.log('error', 'Projeto com problemas - corrija os erros antes de continuar');
        return;
      }

      // Inicia monitoramento de arquivos
      this.startFileWatcher();

      // Inicia Vite
      await this.startVite();

      // Exibe estatísticas a cada 2 minutos
      setInterval(() => {
        this.showStats();
      }, 120000);

      // Primeira exibição de stats após 10 segundos
      setTimeout(() => {
        this.showStats();
      }, 10000);

      this.isRunning = true;
      this.log('success', '🎉 Enhanced Dev Mode totalmente operacional!');
      
    } catch (error) {
      this.log('error', 'Falha ao iniciar Enhanced Dev Mode:', error.message);
      process.exit(1);
    }
  }
}

// Inicia o Enhanced Dev
const enhancedDev = new EnhancedDev();
enhancedDev.start();