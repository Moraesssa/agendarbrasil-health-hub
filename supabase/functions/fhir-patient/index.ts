
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const patientId = pathParts[pathParts.length - 1]

    if (req.method === 'GET') {
      // Get FHIR Patient resource
      const { data, error } = await supabaseClient.rpc('convert_profile_to_fhir_patient', {
        profile_id: patientId
      })

      if (error) {
        console.error('Error converting to FHIR Patient:', error)
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/fhir+json' },
        })
      }

      if (!data) {
        return new Response(JSON.stringify({
          resourceType: 'OperationOutcome',
          issue: [{
            severity: 'error',
            code: 'not-found',
            diagnostics: `Patient with id ${patientId} not found`
          }]
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/fhir+json' },
        })
      }

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/fhir+json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders,
    })

  } catch (error) {
    console.error('Error in fhir-patient function:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: corsHeaders,
    })
  }
})
