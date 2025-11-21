import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyFix() {
    console.log('🔧 APLICANDO CORREÇÃO: ADICIONAR COLUNA CONFIGURACOES');
    console.log('='.repeat(50));

    try {
        const sqlPath = path.join(process.cwd(), 'FIX_MEDICOS_CONFIGURACOES.sql');
        const sqlContent = readFileSync(sqlPath, 'utf8');

        console.log('📄 Lendo arquivo SQL:', sqlPath);

        // Tentar executar o SQL inteiro de uma vez
        console.log('🚀 Executando SQL...');

        const { error } = await supabase.rpc('exec_sql', { sql: sqlContent });

        if (error) {
            console.log(`❌ Erro ao executar via exec_sql: ${error.message}`);
            console.log('⚠️ Tentando executar comandos separadamente...');

            // Fallback: dividir em comandos
            const commands = sqlContent
                .split(';')
                .map(cmd => cmd.trim())
                .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

            for (const command of commands) {
                console.log(`Executing: ${command.substring(0, 50)}...`);
                const { error: cmdError } = await supabase.rpc('exec_sql', { sql: command });
                if (cmdError) {
                    console.log(`❌ Erro no comando: ${cmdError.message}`);
                } else {
                    console.log('✅ Comando OK');
                }
            }
        } else {
            console.log('✅ SQL executado com sucesso!');
        }

        console.log('\n🔍 Verificando se a coluna foi criada...');
        // Não podemos verificar estrutura facilmente via API, mas podemos tentar um select
        const { data, error: verifyError } = await supabase
            .from('medicos')
            .select('configuracoes')
            .limit(1);

        if (verifyError) {
            console.log(`❌ Erro na verificação: ${verifyError.message}`);
        } else {
            console.log('✅ Verificação OK: Coluna configuracoes acessível.');
        }

    } catch (error) {
        console.error('❌ ERRO FATAL:', error);
    }
}

applyFix().catch(console.error);
