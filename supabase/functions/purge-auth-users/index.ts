import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔥 Purge auth users function called');
    
    const { purge_secret } = await req.json();
    
    // Verify purge secret
    const PURGE_SECRET = Deno.env.get('PURGE_SECRET');
    if (!PURGE_SECRET || purge_secret !== PURGE_SECRET) {
      console.error('❌ Invalid or missing purge secret');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create admin supabase client using service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('❌ Missing Supabase configuration');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log('🔍 Listing all auth users...');
    
    let totalDeleted = 0;
    let page = 1;
    const perPage = 1000;
    
    while (true) {
      // List users with pagination
      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });

      if (listError) {
        console.error('❌ Error listing users:', listError);
        throw new Error(`Failed to list users: ${listError.message}`);
      }

      if (!users || users.users.length === 0) {
        console.log(`✅ No more users found on page ${page}. Finished.`);
        break;
      }

      console.log(`📄 Page ${page}: Found ${users.users.length} users to delete`);

      // Delete each user
      for (const user of users.users) {
        console.log(`🗑️ Deleting user: ${user.email || user.id} (${user.id})`);
        
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
        
        if (deleteError) {
          console.error(`❌ Failed to delete user ${user.id}:`, deleteError);
          // Continue with other users even if one fails
        } else {
          totalDeleted++;
          console.log(`✅ Deleted user ${user.id}`);
        }
      }

      page++;
      
      // Safety check to prevent infinite loops
      if (page > 100) {
        console.error('❌ Safety limit reached (100 pages). Stopping.');
        break;
      }
    }

    // Final cleanup: Truncate profiles table again to ensure sync
    console.log('🧹 Final cleanup: Truncating profiles table...');
    const { error: truncateError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (truncateError) {
      console.error('❌ Error during final cleanup:', truncateError);
    } else {
      console.log('✅ Final cleanup completed');
    }

    console.log(`🎉 Purge completed! Total users deleted: ${totalDeleted}`);

    return new Response(JSON.stringify({ 
      success: true, 
      totalDeleted,
      message: `Successfully deleted ${totalDeleted} auth users and cleaned up profiles` 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Error in purge-auth-users function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});