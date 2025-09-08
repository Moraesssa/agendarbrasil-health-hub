
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

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: corsHeaders,
      })
    }

    const url = new URL(req.url)
    
    if (req.method === 'GET') {
      // Handle FHIR search parameters
      const patientId = url.searchParams.get('patient')
      const category = url.searchParams.get('category')
      const code = url.searchParams.get('code')
      const _count = url.searchParams.get('_count') || '50'

      if (!patientId) {
        return new Response(JSON.stringify({
          resourceType: 'OperationOutcome',
          issue: [{
            severity: 'error',
            code: 'required',
            diagnostics: 'Patient parameter is required'
          }]
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/fhir+json' },
        })
      }

      // Get health metrics for the patient
      const query = supabaseClient
        .from('health_metrics')
        .select('*')
        .eq('patient_id', patientId)
        .limit(parseInt(_count))
        .order('recorded_at', { ascending: false })

      const { data: metrics, error } = await query

      if (error) {
        console.error('Error fetching health metrics:', error)
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
          status: 500,
          headers: corsHeaders,
        })
      }

      // Convert metrics to FHIR Observations
      const observations = []
      for (const metric of metrics || []) {
        const { data: fhirObservation, error: conversionError } = await supabaseClient.rpc('convert_health_metric_to_fhir', {
          metric_id: metric.id
        })

        if (!conversionError && fhirObservation) {
          observations.push(fhirObservation)
        }
      }

      // Create FHIR Bundle response
      const bundle = {
        resourceType: 'Bundle',
        id: crypto.randomUUID(),
        type: 'searchset',
        total: observations.length,
        link: [{
          relation: 'self',
          url: req.url
        }],
        entry: observations.map(obs => ({
          fullUrl: `${url.origin}/fhir/Observation/${obs.id}`,
          resource: obs,
          search: {
            mode: 'match'
          }
        }))
      }

      return new Response(JSON.stringify(bundle), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/fhir+json' },
      })
    }

    if (req.method === 'POST') {
      // Create new FHIR Observation
      const observation = await req.json()

      if (observation.resourceType !== 'Observation') {
        return new Response(JSON.stringify({
          resourceType: 'OperationOutcome',
          issue: [{
            severity: 'error',
            code: 'invalid',
            diagnostics: 'Resource must be of type Observation'
          }]
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/fhir+json' },
        })
      }

      // Extract patient ID from subject reference
      const patientRef = observation.subject?.reference
      const patientId = patientRef?.replace('Patient/', '')

      if (!patientId) {
        return new Response(JSON.stringify({
          resourceType: 'OperationOutcome',
          issue: [{
            severity: 'error',
            code: 'required',
            diagnostics: 'Patient reference is required'
          }]
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/fhir+json' },
        })
      }

      // Store FHIR resource directly
      const resourceId = crypto.randomUUID()
      observation.id = resourceId

      const { data, error } = await supabaseClient
        .from('fhir_resources')
        .insert({
          id: resourceId,
          patient_id: patientId,
          resource_type: 'Observation',
          resource_content: observation
        })
        .select()
        .single()

      if (error) {
        console.error('Error storing FHIR Observation:', error)
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
          status: 500,
          headers: corsHeaders,
        })
      }

      return new Response(JSON.stringify(observation), {
        status: 201,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/fhir+json',
          'Location': `${url.origin}/fhir/Observation/${resourceId}`
        },
      })
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders,
    })

  } catch (error) {
    console.error('Error in fhir-observation function:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: corsHeaders,
    })
  }
})
