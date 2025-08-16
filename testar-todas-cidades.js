#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnvVars() {
    const envPath = path.join(__dirname, '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    envContent.split('\n').forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
            const [key, ...valueParts] = trimmedLine.split('=');
            if (key && valueParts.length > 0) {
                envVars[key.trim()] = valueParts.join('=').trim();
            }
        }
    });
    return envVars;
}

const envVars = loadEnvVars();
const supabaseUrl = envVars['VITE_SUPABASE_URL'];
const supabaseAnonKey = envVars['VITE_SUPABASE_ANON_KEY'];

async function makeRequest(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${supabaseAnonKey}`,
                ...options.headers
            },
            ...options
        });
        const data = await response.json();
        return { success: response.ok, status: response.status, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function testarTodasCidades() {
    console.log('🔍 TESTANDO TODAS AS CIDADES COM MÉDICOS CADASTRADOS\n');

    // Primeiro, buscar todos os estados disponíveis
    console.log('📋 1. ESTADOS DISPONÍVEIS:');
    const estados = await makeRequest(`${supabaseUrl}/rest/v1/rpc/get_available_states`, {
        method: 'POST',
        body: JSON.stringify({})
    });

    if (estados.success) {
        console.log(`   Total de estados: ${estados.data?.length || 0}`);
        estados.data?.forEach((e, i) => {
            console.log(`   ${i + 1}. ${e.uf} - ${e.nome || e.uf}`);
        });
    }

    // Para cada estado, buscar cidades e médicos
    if (estados.success && estados.data?.length > 0) {
        for (const estado of estados.data) {
            console.log(`\n🗺️ ESTADO: ${estado.uf}`);
            console.log('━'.repeat(50));

            // Buscar cidades do estado
            const cidades = await makeRequest(`${supabaseUrl}/rest/v1/rpc/get_available_cities`, {
                method: 'POST',
                body: JSON.stringify({ state_uf: estado.uf })
            });

            if (cidades.success && cidades.data?.length > 0) {
                console.log(`   📍 Cidades em ${estado.uf}: ${cidades.data.length}`);

                for (const cidade of cidades.data) {
                    console.log(`\n   🏙️ ${cidade.cidade}/${estado.uf} (${cidade.total_medicos} médicos)`);

                    // Testar especialidades principais
                    const especialidadesTeste = ['Cardiologia', 'Pediatria', 'Anestesiologia', 'Dermatologia', 'Ginecologia', 'Infectologia', 'Medicina de Família'];

                    for (const especialidade of especialidadesTeste) {
                        const medicos = await makeRequest(`${supabaseUrl}/rest/v1/rpc/get_doctors_by_location_and_specialty`, {
                            method: 'POST',
                            body: JSON.stringify({
                                p_specialty: especialidade,
                                p_city: cidade.cidade,
                                p_state: estado.uf
                            })
                        });

                        if (medicos.success && medicos.data?.length > 0) {
                            console.log(`      ✅ ${especialidade}: ${medicos.data.length} médicos`);
                            medicos.data.forEach(m => {
                                console.log(`         - ${m.display_name} (CRM: ${m.crm})`);
                                console.log(`           Local: ${m.local_nome || 'SEM NOME'}`);
                            });
                        }
                    }
                }
            } else {
                console.log(`   ❌ Nenhuma cidade encontrada em ${estado.uf}`);
            }
        }
    }

    // Resumo final
    console.log('\n📊 RESUMO GERAL');
    console.log('━'.repeat(50));

    // Contar total de médicos por estado/cidade
    const resumo = await makeRequest(`${supabaseUrl}/rest/v1/locais_atendimento?select=cidade,estado,medico_id&cidade=not.is.null&estado=not.is.null`);

    if (resumo.success) {
        const cidadesPorEstado = {};
        resumo.data.forEach(local => {
            const key = `${local.estado}`;
            if (!cidadesPorEstado[key]) {
                cidadesPorEstado[key] = new Set();
            }
            cidadesPorEstado[key].add(local.cidade);
        });

        console.log('   Estados e cidades com médicos:');
        Object.keys(cidadesPorEstado).sort().forEach(estado => {
            const cidades = Array.from(cidadesPorEstado[estado]).sort();
            console.log(`   ${estado}: ${cidades.join(', ')}`);
        });
    }
}

testarTodasCidades().catch(console.error);