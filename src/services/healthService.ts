import { supabase } from '@/integrations/supabase/client'
import { TablesInsert, TablesUpdate } from '@/integrations/supabase/types'

export type HealthMetric = TablesInsert<'health_metrics'>

/**
 * Fetches the latest health metrics for a specific patient.
 * @param patientId - The UUID of the patient.
 * @returns A promise that resolves to an array of health metrics.
 */
export const getHealthMetricsForPatient = async (patientId: string) => {
  console.log(`[HealthService] Fetching metrics for patient ${patientId} at ${new Date().toISOString()}`);
  const { data, error } = await supabase
    .from('health_metrics')
    .select('*')
    .eq('patient_id', patientId)
    .order('recorded_at', { ascending: false })

  if (error) {
    console.error('Error fetching health metrics:', error)
    throw error
  }

  return data
}

/**
 * Creates a new health metric record.
 * @param metricData - The health metric data to insert.
 * @returns A promise that resolves to the newly created metric data.
 */
export const createHealthMetric = async (metricData: HealthMetric) => {
  const { data, error } = await supabase
    .from('health_metrics')
    .insert(metricData)
    .select()
    .single() // Assumes we are inserting one record and want it back

  if (error) {
    console.error('Error creating health metric:', error)
    throw error
  }

  return data
}
/**
 * Fetches the patient profile for a specific user.
 * @param userId - The UUID of the user.
 * @returns A promise that resolves to the patient profile.
 */
export const getPatientProfileByUserId = async (userId: string) => {
  const { data, error } = await supabase
    .from('pacientes')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching patient profile:', error)
    throw error
  }

  return data
}