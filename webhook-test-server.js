/**
 * Servidor de teste para receber webhooks do Supabase
 * Execute este servidor na porta 3000 para testar o webhook
 */

const express = require('express');
const app = express();
const PORT = 3000;

// Middleware para parsing JSON
app.use(express.json());
app.use(express.raw({ type: 'application/json' }));

// Log de todas as requisições
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`\n[${timestamp}] ${req.method} ${req.url}`);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('Body:', JSON.stringify(req.body, null, 2));
    }
    
    next();
});

// Endpoint principal para receber webhooks
app.post('/', (req, res) => {
    console.log('\n🎯 WEBHOOK RECEBIDO!');
    console.log('═══════════════════════════════════════');
    
    try {
        const payload = req.body;
        
        console.log('📦 Payload recebido:');
        console.log(JSON.stringify(payload, null, 2));
        
        console.log('\n📋 Detalhes da requisição:');
        console.log(`   Método: ${req.method}`);
        console.log(`   URL: ${req.url}`);
        console.log(`   Content-Type: ${req.headers['content-type']}`);
        console.log(`   User-Agent: ${req.headers['user-agent']}`);
        
        // Resposta de sucesso
        res.status(200).json({
            success: true,
            message: 'Webhook recebido com sucesso',
            timestamp: new Date().toISOString(),
            receivedData: payload
        });
        
        console.log('✅ Resposta enviada com sucesso');
        
    } catch (error) {
        console.error('❌ Erro ao processar webhook:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
    
    console.log('═══════════════════════════════════════\n');
});

// Endpoint GET para verificar se o servidor está funcionando
app.get('/', (req, res) => {
    console.log('\n🔍 Health check recebido');
    res.status(200).json({
        status: 'OK',
        message: 'Servidor de webhook funcionando',
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

// Endpoint para testar conectividade
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Capturar todas as outras rotas
app.all('*', (req, res) => {
    console.log(`\n⚠️  Rota não encontrada: ${req.method} ${req.url}`);
    res.status(404).json({
        error: 'Rota não encontrada',
        method: req.method,
        url: req.url,
        timestamp: new Date().toISOString()
    });
});

// Tratamento de erros
app.use((error, req, res, next) => {
    console.error('❌ Erro no servidor:', error.message);
    res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message,
        timestamp: new Date().toISOString()
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log('🚀 Servidor de teste de webhook iniciado');
    console.log('═══════════════════════════════════════');
    console.log(`   📡 Porta: ${PORT}`);
    console.log(`   🌐 URL: http://localhost:${PORT}`);
    console.log(`   🐳 Docker: http://host.docker.internal:${PORT}`);
    console.log('═══════════════════════════════════════');
    console.log('\n📋 Endpoints disponíveis:');
    console.log('   POST / - Receber webhooks');
    console.log('   GET /  - Health check');
    console.log('   GET /health - Status detalhado');
    console.log('\n⏳ Aguardando webhooks...\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n🛑 Encerrando servidor...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n\n🛑 Servidor encerrado');
    process.exit(0);
});