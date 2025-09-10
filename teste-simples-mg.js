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
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      ...options.headers
    },
    ...options
  });
  return response;
}

async function testMGCities() {
  console.log('🔍 Testing MG cities...');
  
  try {
    const response = await makeRequest(`${supabaseUrl}/rest/v1/rpc/get_cities_by_state`, {
      method: 'POST',
      body: JSON.stringify({ uf: 'MG' })
    });
    
    if (response.ok) {
      const cities = await response.json();
      console.log(`✅ Found ${cities.length} cities in MG`);
      console.log('Sample cities:', cities.slice(0, 5).map(c => c.nome));
    } else {
      console.error('❌ Failed to fetch cities:', response.status);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testMGCities().catch(console.error);