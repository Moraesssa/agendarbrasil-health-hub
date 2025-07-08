
import { HealthMetric } from '@/types/health';
import { FhirObservation, FhirPatient, FhirDocumentReference } from '@/types/fhir';

// Valid metric types
type ValidMetricType = 'blood_pressure' | 'heart_rate' | 'temperature' | 'weight' | 'height' | 'glucose' | 'oxygen_saturation';

export const convertHealthMetricToFhir = (metric: HealthMetric): FhirObservation => {
  const observation: FhirObservation = {
    resourceType: 'Observation',
    id: metric.id,
    status: 'final',
    category: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/observation-category',
        code: 'vital-signs',
        display: 'Vital Signs'
      }]
    }],
    code: {
      coding: [getLoincCoding(metric.metric_type as ValidMetricType)]
    },
    subject: {
      reference: `Patient/${metric.patient_id}`
    },
    effectiveDateTime: metric.recorded_at,
    meta: {
      lastUpdated: metric.created_at,
      source: `#${metric.id}`
    }
  };

  // Add value based on metric type
  if (metric.metric_type === 'blood_pressure') {
    observation.component = [
      {
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '8480-6',
            display: 'Systolic blood pressure'
          }]
        },
        valueQuantity: {
          value: metric.value.systolic,
          unit: metric.unit,
          system: 'http://unitsofmeasure.org',
          code: 'mm[Hg]'
        }
      },
      {
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '8462-4',
            display: 'Diastolic blood pressure'
          }]
        },
        valueQuantity: {
          value: metric.value.diastolic,
          unit: metric.unit,
          system: 'http://unitsofmeasure.org',
          code: 'mm[Hg]'
        }
      }
    ];
  } else {
    observation.valueQuantity = {
      value: metric.value.numeric,
      unit: metric.unit,
      system: 'http://unitsofmeasure.org'
    };
  }

  return observation;
};

export const convertFhirToHealthMetric = (observation: FhirObservation): Partial<HealthMetric> => {
  const metricType = getMetricTypeFromLoinc(observation.code.coding?.[0]?.code);
  
  let value: any = {};
  
  if (observation.component) {
    // Blood pressure with components
    const systolic = observation.component.find(c => 
      c.code.coding?.[0]?.code === '8480-6'
    )?.valueQuantity?.value;
    
    const diastolic = observation.component.find(c => 
      c.code.coding?.[0]?.code === '8462-4'
    )?.valueQuantity?.value;
    
    if (systolic && diastolic) {
      value = { systolic, diastolic };
    }
  } else if (observation.valueQuantity) {
    value = { numeric: observation.valueQuantity.value };
  }

  return {
    id: observation.id,
    patient_id: observation.subject?.reference?.replace('Patient/', ''),
    metric_type: metricType,
    value,
    unit: observation.valueQuantity?.unit || observation.component?.[0]?.valueQuantity?.unit || '',
    recorded_at: observation.effectiveDateTime || new Date().toISOString(),
    created_at: observation.meta?.lastUpdated || new Date().toISOString()
  };
};

const getLoincCoding = (metricType: ValidMetricType) => {
  const loincMap: Record<ValidMetricType, { code: string; display: string }> = {
    'blood_pressure': { 
      code: '85354-9', 
      display: 'Blood pressure panel with all children optional' 
    },
    'heart_rate': { 
      code: '8867-4', 
      display: 'Heart rate' 
    },
    'temperature': { 
      code: '8310-5', 
      display: 'Body temperature' 
    },
    'weight': { 
      code: '29463-7', 
      display: 'Body weight' 
    },
    'height': { 
      code: '8302-2', 
      display: 'Body height' 
    },
    'glucose': { 
      code: '33747-0', 
      display: 'Glucose [Mass/volume] in Blood by Glucometer' 
    },
    'oxygen_saturation': { 
      code: '2708-6', 
      display: 'Oxygen saturation in Arterial blood' 
    }
  };

  const loinc = loincMap[metricType];

  return {
    system: 'http://loinc.org',
    code: loinc.code,
    display: loinc.display
  };
};

const getMetricTypeFromLoinc = (loincCode?: string): ValidMetricType => {
  const reverseMap: Record<string, ValidMetricType> = {
    '85354-9': 'blood_pressure',
    '8867-4': 'heart_rate',
    '8310-5': 'temperature',
    '29463-7': 'weight',
    '8302-2': 'height',
    '33747-0': 'glucose',
    '2708-6': 'oxygen_saturation'
  };

  return reverseMap[loincCode || ''] || 'heart_rate'; // Default fallback
};

export const createFhirObservationFromMetric = (
  patientId: string,
  metricType: string,
  value: any,
  unit: string,
  effectiveDateTime?: string
): FhirObservation => {
  const validMetricType = isValidMetricType(metricType) ? metricType : 'heart_rate';
  
  const observation: FhirObservation = {
    resourceType: 'Observation',
    status: 'final',
    category: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/observation-category',
        code: 'vital-signs',
        display: 'Vital Signs'
      }]
    }],
    code: {
      coding: [getLoincCoding(validMetricType)]
    },
    subject: {
      reference: `Patient/${patientId}`
    },
    effectiveDateTime: effectiveDateTime || new Date().toISOString()
  };

  if (validMetricType === 'blood_pressure' && value.systolic && value.diastolic) {
    observation.component = [
      {
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '8480-6',
            display: 'Systolic blood pressure'
          }]
        },
        valueQuantity: {
          value: value.systolic,
          unit: unit,
          system: 'http://unitsofmeasure.org',
          code: 'mm[Hg]'
        }
      },
      {
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '8462-4',
            display: 'Diastolic blood pressure'
          }]
        },
        valueQuantity: {
          value: value.diastolic,
          unit: unit,
          system: 'http://unitsofmeasure.org',
          code: 'mm[Hg]'
        }
      }
    ];
  } else {
    observation.valueQuantity = {
      value: value.numeric || value,
      unit: unit,
      system: 'http://unitsofmeasure.org'
    };
  }

  return observation;
};

// Helper function to validate metric type
function isValidMetricType(type: string): type is ValidMetricType {
  return ['blood_pressure', 'heart_rate', 'temperature', 'weight', 'height', 'glucose', 'oxygen_saturation'].includes(type);
}
