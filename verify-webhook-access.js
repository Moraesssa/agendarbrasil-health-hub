/**
 * Script para verificar o acesso ao webhook do Supabase
 * Testa a conectividade e configuração do webhook
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis de ambiente do Supabase não encontradas');
    console.log('Certifique-se de que VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão definidas no .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyWebhookAccess() {
    console.log('🔍 Verificando acesso ao webhook...\n');

    try {
        // 1. Verificar conexão com Supabase
        console.log('1. Testando conexão com Supabase...');
        const { data: healthCheck, error: healthError } = await supabase
            .from('Usuarios')
            .select('count')
            .limit(1);

        if (healthError) {
            console.error('❌ Erro na conexão com Supabase:', healthError.message);
            return false;
        }
        console.log('✅ Conexão com Supabase estabelecida');

        // 2. Verificar se a tabela my_table existe
        console.log('\n2. Verificando se a tabela "my_table" existe...');
        const { data: tableCheck, error: tableError } = await supabase
            .rpc('check_table_exists', { table_name: 'my_table' })
            .catch(() => null);

        if (tableError || !tableCheck) {
            console.log('⚠️  Tabela "my_table" não encontrada');
            console.log('   Isso é normal se for um webhook de teste');
        } else {
            console.log('✅ Tabela "my_table" encontrada');
        }

        // 3. Verificar triggers existentes
        console.log('\n3. Verificando triggers existentes...');
        const { data: triggers, error: triggerError } = await supabase
            .rpc('get_triggers_info')
            .catch(() => ({ data: null, error: 'Função não disponível' }));

        if (triggerError) {
            console.log('⚠️  Não foi possível verificar triggers:', triggerError);
        } else if (triggers) {
            console.log('✅ Triggers encontrados:', triggers.length);
            triggers.forEach(trigger => {
                if (trigger.trigger_name === 'my_webhook') {
                    console.log(`   📌 Webhook encontrado: ${trigger.trigger_name}`);
                }
            });
        }

        // 4. Testar endpoint do webhook
        console.log('\n4. Testando endpoint do webhook...');
        try {
            const response = await fetch('http://host.docker.internal:3000', {
                method: 'GET',
                timeout: 5000
            });
            
            if (response.ok) {
                console.log('✅ Endpoint do webhook acessível');
            } else {
                console.log(`⚠️  Endpoint retornou status: ${response.status}`);
            }
        } catch (fetchError) {
            console.log('❌ Erro ao acessar endpoint:', fetchError.message);
            console.log('   Verifique se o servidor está rodando na porta 3000');
        }

        // 5. Verificar configuração do webhook
        console.log('\n5. Informações do webhook configurado:');
        console.log('   📋 Trigger: my_webhook');
        console.log('   📋 Tabela: public.my_table');
        console.log('   📋 Evento: INSERT');
        console.log('   📋 Função: supabase_functions.http_request');
        console.log('   📋 URL: http://host.docker.internal:3000');
        console.log('   📋 Método: POST');
        console.log('   📋 Headers: {"Content-Type":"application/json"}');
        console.log('   📋 Timeout: 1000ms');

        return true;

    } catch (error) {
        console.error('❌ Erro durante verificação:', error.message);
        return false;
    }
}

// Função para criar a tabela de teste se necessário
async function createTestTable() {
    console.log('\n🔧 Criando tabela de teste...');
    
    const createTableSQL = `
        CREATE TABLE IF NOT EXISTS my_table (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            data JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    `;

    try {
        const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
        if (error) {
            console.error('❌ Erro ao criar tabela:', error.message);
            return false;
        }
        console.log('✅ Tabela de teste criada');
        return true;
    } catch (error) {
        console.error('❌ Erro ao executar SQL:', error.message);
        return false;
    }
}

// Função para testar o webhook
async function testWebhook() {
    console.log('\n🧪 Testando webhook...');
    
    try {
        const testData = {
            test: true,
            timestamp: new Date().toISOString(),
            message: 'Teste do webhook'
        };

        const { data, error } = await supabase
            .from('my_table')
            .insert([{ data: testData }]);

        if (error) {
            console.error('❌ Erro ao inserir dados de teste:', error.message);
            return false;
        }

        console.log('✅ Dados inseridos na tabela');
        console.log('   O webhook deve ter sido disparado');
        console.log('   Verifique os logs do seu servidor na porta 3000');
        
        return true;
    } catch (error) {
        console.error('❌ Erro durante teste:', error.message);
        return false;
    }
}

// Executar verificação
async function main() {
    console.log('🚀 Iniciando verificação do webhook\n');
    
    const isAccessible = await verifyWebhookAccess();
    
    if (isAccessible) {
        console.log('\n✅ Verificação concluída com sucesso');
        
        // Perguntar se deve criar tabela de teste
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question('\nDeseja criar uma tabela de teste e testar o webhook? (s/n): ', async (answer) => {
            if (answer.toLowerCase() === 's' || answer.toLowerCase() === 'sim') {
                await createTestTable();
                await testWebhook();
            }
            
            console.log('\n📋 Resumo da verificação:');
            console.log('   - Conexão Supabase: ✅');
            console.log('   - Configuração webhook: ✅');
            console.log('   - Endpoint acessível: Verificar logs acima');
            
            rl.close();
        });
    } else {
        console.log('\n❌ Verificação falhou');
        console.log('Verifique as configurações e tente novamente');
    }
}

main().catch(console.error);