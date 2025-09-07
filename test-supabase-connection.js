import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Connection...\n');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Missing');
  process.exit(1);
}

console.log('✅ Environment variables found');
console.log('📍 Supabase URL:', supabaseUrl);
console.log('🔑 Anon Key:', supabaseKey.substring(0, 20) + '...\n');

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('🔄 Testing database connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Database connection successful!');
    
    // Test authentication
    console.log('\n🔄 Testing authentication service...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Auth service error:', authError.message);
      return false;
    }
    
    console.log('✅ Authentication service working!');
    console.log('👤 Current session:', authData.session ? 'Active' : 'No active session');
    
    return true;
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return false;
  }
}

// Run the test
testConnection().then(success => {
  if (success) {
    console.log('\n🎉 Supabase connection test completed successfully!');
    console.log('Your database is ready to use.');
  } else {
    console.log('\n💥 Connection test failed. Please check your configuration.');
  }
});