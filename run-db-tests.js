import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase URL or Service Role Key is not defined in .env file.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
});

const logTest = (name, result) => {
  console.log(`\n--- Running Test: ${name} ---`);
  if (result.error) {
    console.error('Test FAILED ❌');
    console.error('Error:', result.error);
    return false;
  } else {
    console.log('Test PASSED ✅');
    if (result.data && result.data.length > 20) {
        console.log(`Data (first 20 of ${result.data.length} rows):`, result.data.slice(0, 20));
    } else {
        console.log('Data:', result.data);
    }
    return true;
  }
};

const runDbTests = async () => {
  console.log('--- Starting Database Function Tests ---');
  let allTestsPassed = true;

  // 1. Test get_specialties
  const specialtiesResult = await supabase.rpc('get_specialties');
  if (!logTest('get_specialties', specialtiesResult)) allTestsPassed = false;

  // 2. Test get_available_states
  const statesResult = await supabase.rpc('get_available_states');
  if (!logTest('get_available_states', statesResult)) allTestsPassed = false;

  // 3. Test get_available_cities - Corrected parameter name
  const citiesResult = await supabase.rpc('get_available_cities', { state_uf: 'SP' });
  if (!logTest("get_available_cities (for SP)", citiesResult)) allTestsPassed = false;

  // 4. Test get_doctors_by_location_and_specialty - Corrected parameter name
  const doctorsResult = await supabase.rpc('get_doctors_by_location_and_specialty', {
    p_specialty: 'Cardiologia',
    p_city: 'São Paulo',
    p_state: 'SP' // Corrected from p_state_uf
  });
  if (!logTest("get_doctors_by_location_and_specialty (Cardiologia in São Paulo, SP)", doctorsResult)) allTestsPassed = false;

  // Note: Cannot run pg_catalog queries or data integrity checks that join across tables with RLS easily from JS client.
  // The function tests cover the most critical parts of the backend logic accessible via RPC.

  console.log('\n--- Test Summary ---');
  if (allTestsPassed) {
    console.log('All database function tests passed! ✅');
  } else {
    console.error('Some database function tests failed. ❌');
  }
};

runDbTests();
