// src/config/supabase.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_KEY'
];

const missingEnvVars = requiredEnvVars.filter((name) => !process.env[name]);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Supabase configuration error: missing environment variable(s): ${missingEnvVars.join(', ')}. ` +
      'Configure these values using a secure environment manager before starting the backend.'
  );
}

const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY } = process.env;

/**
 * Cria um cliente Supabase com a chave anônima para operações públicas
 */
const createAnonClient = () => {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
};

/**
 * Cria um cliente Supabase com a chave de serviço para operações administrativas
 */
const createServiceClient = () => {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

module.exports = {
  createAnonClient,
  createServiceClient,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_KEY
};
