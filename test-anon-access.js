// test-anon-access.js
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env variables (simple parser)
const envPath = path.join(__dirname, '.env');
const env = {};
fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...rest] = trimmed.split('=');
    env[key] = rest.join('=').replace(/^"|"$/g, '').trim();
  }
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const anonKey = env['VITE_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !anonKey) {
  console.error('Supabase URL or anon key not found in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, anonKey);

async function test() {
  const { data, error } = await supabase.from('medicos').select('id,crm').limit(1);
  if (error) {
    console.error('Error fetching medicos:', error);
  } else {
    console.log('Anonymous fetch result:', data);
  }
}

test();
