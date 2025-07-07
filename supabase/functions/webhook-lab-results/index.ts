import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

interface LabResult {
  patient_identifier: string; // CPF or other unique identifier
  patient_name: string;
  test_name: string;
  test_type: string;
  value: any; // Can be numeric or complex object
  unit?: string;
  reference_range?: string;
  status: 'normal' | 'abnormal' | 'critical';
  collected_at: string; // ISO timestamp
  reported_at: string; // ISO timestamp
  lab_order_id?: string;
  notes?: string;
}

interface WebhookPayload {
  source: string;
  results: LabResult[];
  metadata?: {
    lab_name: string;
    batch_id?: string;
    version: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate API key from header
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      console.error('Missing API key in request header');
      return new Response(JSON.stringify({ error: 'API key required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify API key against external_data_sources
    const { data: dataSource, error: sourceError } = await supabase
      .from('external_data_sources')
      .select('id, name, is_active')
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .single();

    if (sourceError || !dataSource) {
      console.error('Invalid or inactive API key:', apiKey);
      await logIntegration(supabase, null, null, 'authentication', 'failed', 
        { api_key: apiKey }, 'Invalid or inactive API key');
      return new Response(JSON.stringify({ error: 'Invalid API key' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse webhook payload
    const payload: WebhookPayload = await req.json();
    console.log('Received webhook from:', dataSource.name, 'with', payload.results.length, 'results');

    const processedResults = [];
    const errors = [];

    // Process each result
    for (const result of payload.results) {
      try {
        // Find patient by identifier (assuming CPF is stored in profiles)
        const { data: patient, error: patientError } = await supabase
          .from('profiles')
          .select('id, display_name')
          .or(`email.eq.${result.patient_identifier},display_name.ilike.%${result.patient_name}%`)
          .single();

        if (patientError || !patient) {
          console.warn('Patient not found:', result.patient_identifier, result.patient_name);
          errors.push(`Patient not found: ${result.patient_identifier}`);
          await logIntegration(supabase, dataSource.id, null, 'data_received', 'failed', 
            result, 'Patient not found');
          continue;
        }

        // Check consent
        const { data: consent, error: consentError } = await supabase
          .from('user_consents')
          .select('status')
          .eq('patient_id', patient.id)
          .eq('source_id', dataSource.id)
          .eq('status', 'granted')
          .single();

        if (consentError || !consent) {
          console.warn('No consent found for patient:', patient.id, 'source:', dataSource.id);
          errors.push(`No consent for patient: ${result.patient_identifier}`);
          await logIntegration(supabase, dataSource.id, patient.id, 'data_received', 'rejected', 
            result, 'No valid consent');
          continue;
        }

        // Process the lab result - convert to health_metrics format
        const healthMetric = {
          patient_id: patient.id,
          metric_type: mapTestTypeToMetricType(result.test_type),
          value: {
            numeric: typeof result.value === 'number' ? result.value : null,
            text: typeof result.value === 'string' ? result.value : JSON.stringify(result.value),
            lab_result: {
              test_name: result.test_name,
              reference_range: result.reference_range,
              status: result.status,
              lab_order_id: result.lab_order_id,
              notes: result.notes
            }
          },
          unit: result.unit || '',
          recorded_at: result.collected_at,
        };

        // Insert health metric
        const { error: insertError } = await supabase
          .from('health_metrics')
          .insert(healthMetric);

        if (insertError) {
          console.error('Failed to insert health metric:', insertError);
          errors.push(`Failed to store result for ${result.patient_identifier}: ${insertError.message}`);
          await logIntegration(supabase, dataSource.id, patient.id, 'data_received', 'failed', 
            result, insertError.message);
          continue;
        }

        // Also create a document record for the full lab report
        const documentRecord = {
          patient_id: patient.id,
          document_name: `${result.test_name} - ${new Date(result.reported_at).toLocaleDateString('pt-BR')}`,
          document_type: 'exame_laboratorial',
          storage_path: '', // Would be filled if we had the actual PDF/report file
          metadata: {
            source: dataSource.name,
            test_type: result.test_type,
            lab_order_id: result.lab_order_id,
            imported_via_api: true
          }
        };

        // Success log
        await logIntegration(supabase, dataSource.id, patient.id, 'data_received', 'success', 
          result, null);
        
        processedResults.push({
          patient_identifier: result.patient_identifier,
          test_name: result.test_name,
          status: 'processed'
        });

        console.log('Successfully processed result for patient:', patient.display_name);

      } catch (error) {
        console.error('Error processing result:', error);
        errors.push(`Error processing ${result.patient_identifier}: ${error.message}`);
        await logIntegration(supabase, dataSource.id, null, 'data_received', 'failed', 
          result, error.message);
      }
    }

    // Return summary
    const response = {
      success: true,
      source: dataSource.name,
      processed: processedResults.length,
      errors: errors.length,
      details: {
        processed_results: processedResults,
        errors: errors
      }
    };

    console.log('Webhook processing complete:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in webhook-lab-results function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to map lab test types to our metric types
function mapTestTypeToMetricType(testType: string): string {
  const mappings: Record<string, string> = {
    'blood_pressure': 'blood_pressure',
    'glucose': 'glucose',
    'cholesterol': 'cholesterol',
    'hemoglobin': 'hemoglobin',
    'white_blood_cells': 'wbc_count',
    'red_blood_cells': 'rbc_count',
    // Add more mappings as needed
  };
  
  return mappings[testType.toLowerCase()] || 'lab_result';
}

// Helper function to log integration events
async function logIntegration(
  supabase: any,
  sourceId: string | null,
  patientId: string | null,
  action: string,
  status: string,
  payload: any,
  errorMessage: string | null
) {
  try {
    await supabase
      .from('integration_logs')
      .insert({
        source_id: sourceId,
        patient_id: patientId,
        action,
        status,
        payload,
        error_message: errorMessage
      });
  } catch (error) {
    console.error('Failed to log integration event:', error);
  }
}