
import { supabase } from '@/integrations/supabase/client';
import {
  FhirPatient,
  FhirObservation,
  FhirBundle,
  FhirDocumentReference,
  FhirOperationOutcome
} from '@/types/fhir';

const DEFAULT_FHIR_BASE_URL = 'https://ulebotjrsgheybhpdnxd.supabase.co/functions/v1';
const FHIR_BASE_URL = import.meta.env.VITE_FHIR_BASE_URL || DEFAULT_FHIR_BASE_URL;

try {
  // Validate that the base URL is a proper URL
  new URL(FHIR_BASE_URL);
} catch {
  throw new Error('Invalid FHIR base URL configuration');
}

class FhirService {
  private async getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/fhir+json',
      'Authorization': `Bearer ${session?.access_token}`,
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = await this.getAuthHeaders();
    try {
      const response = await fetch(`${FHIR_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...(options.headers || {})
        }
      });

      if (!response.ok) {
        let body: any = {};
        try {
          body = await response.json();
        } catch {
          // Ignore JSON parsing errors
        }
        const status = response.status;
        const message = body?.message || body?.error || response.statusText;
        throw new Error(`HTTP ${status}: ${message}`);
      }

      return response.json();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Network error: ${message}`);
    }
  }

  async getPatient(patientId: string): Promise<FhirPatient> {
    return this.request<FhirPatient>(`/fhir-patient/${patientId}`);
  }

  async searchObservations(params: {
    patient: string;
    category?: string;
    code?: string;
    _count?: number;
  }): Promise<FhirBundle> {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return this.request<FhirBundle>(`/fhir-observation?${searchParams.toString()}`);
  }

  async createObservation(observation: FhirObservation): Promise<FhirObservation> {
    return this.request<FhirObservation>(`/fhir-observation`, {
      method: 'POST',
      body: JSON.stringify(observation)
    });
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
