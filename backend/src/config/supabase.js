// src/config/supabase.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Valores padrão para desenvolvimento, mas preferencialmente use variáveis de ambiente
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ulebotjrsgheybhpdnxd.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsZWJvdGpyc2doZXliaHBkbnhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NDM5MjUsImV4cCI6MjA2NjExOTkyNX0.1OVxsso5wSjnvOClf-i3DfsUUOKkpwkjioEndKB2ux4';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsZWJvdGpyc2doZXliaHBkbnhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU0MzkyNSwiZXhwIjoyMDY2MTE5OTI1fQ.SL5dtN5mpITgn5H0mxAJj9AzQ5bB_Fben2av__A1SMU';

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