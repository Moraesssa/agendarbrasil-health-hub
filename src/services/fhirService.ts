
import { supabase } from '@/integrations/supabase/client';
import { 
  FhirPatient, 
  FhirObservation, 
  FhirBundle, 
  FhirDocumentReference,
  FhirOperationOutcome 
} from '@/types/fhir';

const FHIR_BASE_URL = `https://ulebotjrsgheybhpdnxd.supabase.co/functions/v1`;

class FhirService {
  private async getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/fhir+json',
      'Authorization': `Bearer ${session?.access_token}`,
    };
  }

  async getPatient(patientId: string): Promise<FhirPatient> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${FHIR_BASE_URL}/fhir-patient/${patientId}`, {
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async searchObservations(params: {
    patient: string;
    category?: string;
    code?: string;
    _count?: number;
  }): Promise<FhirBundle> {
    const headers = await this.getAuthHeaders();
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    const response = await fetch(`${FHIR_BASE_URL}/fhir-observation?${searchParams}`, {
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async createObservation(observation: FhirObservation): Promise<FhirObservation> {
    const headers = await this.getAuthHeaders();

    const response = await fetch(`${FHIR_BASE_URL}/fhir-observation`, {
      method: 'POST',
      headers,
      body: JSON.stringify(observation),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Utility function to convert health metric to FHIR Observation
  async convertHealthMetricToFhir(metricId: string): Promise<FhirObservation> {
    const { data, error } = await supabase.rpc('convert_health_metric_to_fhir', {
      metric_id: metricId
    });

    if (error) {
      throw new Error(`Failed to convert health metric: ${error.message}`);
    }

    // Validate that the returned data has the expected structure
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('Invalid FHIR Observation returned from database function');
    }

    const fhirData = data as Record<string, any>;
    if (!fhirData.resourceType) {
      throw new Error('Invalid FHIR Observation returned from database function');
    }

    return fhirData as FhirObservation;
  }

  // Utility function to convert profile to FHIR Patient
  async convertProfileToFhir(profileId: string): Promise<FhirPatient> {
    const { data, error } = await supabase.rpc('convert_profile_to_fhir_patient', {
      profile_id: profileId
    });

    if (error) {
      throw new Error(`Failed to convert profile: ${error.message}`);
    }

    // Validate that the returned data has the expected structure
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('Invalid FHIR Patient returned from database function');
    }

    const fhirData = data as Record<string, any>;
    if (!fhirData.resourceType) {
      throw new Error('Invalid FHIR Patient returned from database function');
    }

    return fhirData as FhirPatient;
  }

  // Store FHIR resource directly in fhir_resources table
  async storeFhirResource(
    patientId: string,
    resourceType: string,
    resourceContent: any
  ): Promise<void> {
    const { error } = await supabase
      .from('fhir_resources')
      .insert({
        patient_id: patientId,
        resource_type: resourceType,
        resource_content: resourceContent
      });

    if (error) {
      throw new Error(`Failed to store FHIR resource: ${error.message}`);
    }
  }

  // Get FHIR resources from fhir_resources table
  async getFhirResources(
    patientId: string,
    resourceType?: string
  ): Promise<any[]> {
    let query = supabase
      .from('fhir_resources')
      .select('*')
      .eq('patient_id', patientId);

    if (resourceType) {
      query = query.eq('resource_type', resourceType);
    }

    const { data, error } = await query.order('last_updated', { ascending: false });

    if (error) {
      throw new Error(`Failed to get FHIR resources: ${error.message}`);
    }

    return data?.map(row => row.resource_content) || [];
  }
}

export const fhirService = new FhirService();
