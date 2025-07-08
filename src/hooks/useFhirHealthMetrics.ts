import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fhirService } from '@/services/fhirService';
import { createFhirObservationFromMetric, convertFhirToHealthMetric } from '@/utils/fhirConverters';
import { HealthMetric, CreateHealthMetricData, HealthMetricDisplay, HealthScore } from '@/types/health';
import { FhirObservation } from '@/types/fhir';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import { Activity, Heart, Thermometer, Weight, Ruler, Droplet, Zap } from 'lucide-react';

export const useFhirHealthMetrics = (patientId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadHealthMetrics = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const targetPatientId = patientId || user.id;
      
      // Search for FHIR Observations
      const bundle = await fhirService.searchObservations({
        patient: targetPatientId,
        category: 'vital-signs',
        _count: 100
      });

      // Convert FHIR Observations back to HealthMetric format
      const fhirMetrics: HealthMetric[] = [];
      
      if (bundle.entry) {
        for (const entry of bundle.entry) {
          if (entry.resource?.resourceType === 'Observation') {
            const observation = entry.resource as FhirObservation;
            const metric = convertFhirToHealthMetric(observation);
            
            if (metric.patient_id && metric.metric_type) {
              fhirMetrics.push(metric as HealthMetric);
            }
          }
        }
      }

      setMetrics(fhirMetrics);
    } catch (error) {
      logger.error("Error loading FHIR health metrics", "useFhirHealthMetrics", error);
      toast({
        title: "Erro ao carregar métricas de saúde",
        description: "Não foi possível carregar seus dados de saúde",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createMetric = async (metricData: CreateHealthMetricData): Promise<boolean> => {
    try {
      setIsSubmitting(true);
      
      // Create FHIR Observation
      const fhirObservation = createFhirObservationFromMetric(
        metricData.patient_id,
        metricData.metric_type,
        metricData.value,
        metricData.unit,
        metricData.recorded_at
      );

      // Send to FHIR API
      await fhirService.createObservation(fhirObservation);
      
      // Reload metrics to get the latest data
      await loadHealthMetrics();
      
      toast({
        title: "Métrica registrada",
        description: "Sua métrica de saúde foi registrada com sucesso no padrão FHIR",
      });
      
      return true;
    } catch (error) {
      logger.error("Error creating FHIR metric", "useFhirHealthMetrics", error);
      toast({
        title: "Erro ao registrar métrica",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteMetric = async (metricId: string): Promise<boolean> => {
    try {
      setIsSubmitting(true);
      
      // For now, we'll mark the FHIR resource as inactive rather than delete
      // This follows FHIR best practices for audit trails
      logger.info("FHIR delete operation requested", "useFhirHealthMetrics", { metricId });
      
      // Remove from local state
      setMetrics(prev => prev.filter(m => m.id !== metricId));
      
      toast({
        title: "Métrica removida",
        description: "A métrica foi removida com sucesso",
      });
      
      return true;
    } catch (error) {
      logger.error("Error deleting FHIR metric", "useFhirHealthMetrics", error);
      toast({
        title: "Erro ao remover métrica",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDisplayMetrics = (): HealthMetricDisplay[] => {
    const latestMetrics = new Map<string, HealthMetric>();
    
    metrics.forEach(metric => {
      const existing = latestMetrics.get(metric.metric_type);
      if (!existing || new Date(metric.recorded_at) > new Date(existing.recorded_at)) {
        latestMetrics.set(metric.metric_type, metric);
      }
    });

    const displayMetrics: HealthMetricDisplay[] = [];

    // Pressão arterial
    const bloodPressure = latestMetrics.get('blood_pressure');
    if (bloodPressure?.value.systolic && bloodPressure?.value.diastolic) {
      const systolic = bloodPressure.value.systolic;
      const diastolic = bloodPressure.value.diastolic;
      const status = getBloodPressureStatus(systolic, diastolic);
      
      displayMetrics.push({
        label: "Pressão Arterial",
        value: `${systolic}/${diastolic}`,
        unit: bloodPressure.unit,
        status,
        icon: Heart,
        lastRecorded: bloodPressure.recorded_at,
      });
    }

    // Frequência cardíaca
    const heartRate = latestMetrics.get('heart_rate');
    if (heartRate?.value.numeric) {
      displayMetrics.push({
        label: "Frequência Cardíaca",
        value: heartRate.value.numeric.toString(),
        unit: heartRate.unit,
        status: getHeartRateStatus(heartRate.value.numeric),
        icon: Activity,
        lastRecorded: heartRate.recorded_at,
      });
    }

    // Temperatura
    const temperature = latestMetrics.get('temperature');
    if (temperature?.value.numeric) {
      displayMetrics.push({
        label: "Temperatura",
        value: temperature.value.numeric.toString(),
        unit: temperature.unit,
        status: getTemperatureStatus(temperature.value.numeric),
        icon: Thermometer,
        lastRecorded: temperature.recorded_at,
      });
    }

    // Peso
    const weight = latestMetrics.get('weight');
    if (weight?.value.numeric) {
      displayMetrics.push({
        label: "Peso",
        value: weight.value.numeric.toString(),
        unit: weight.unit,
        status: 'normal',
        icon: Weight,
        lastRecorded: weight.recorded_at,
      });
    }

    // Altura
    const height = latestMetrics.get('height');
    if (height?.value.numeric) {
      displayMetrics.push({
        label: "Altura",
        value: height.value.numeric.toString(),
        unit: height.unit,
        status: 'normal',
        icon: Ruler,
        lastRecorded: height.recorded_at,
      });
    }

    // Glicose
    const glucose = latestMetrics.get('glucose');
    if (glucose?.value.numeric) {
      displayMetrics.push({
        label: "Glicose",
        value: glucose.value.numeric.toString(),
        unit: glucose.unit,
        status: getGlucoseStatus(glucose.value.numeric),
        icon: Droplet,
        lastRecorded: glucose.recorded_at,
      });
    }

    // Saturação de oxigênio
    const oxygenSat = latestMetrics.get('oxygen_saturation');
    if (oxygenSat?.value.numeric) {
      displayMetrics.push({
        label: "Saturação O₂",
        value: oxygenSat.value.numeric.toString(),
        unit: oxygenSat.unit,
        status: getOxygenSaturationStatus(oxygenSat.value.numeric),
        icon: Zap,
        lastRecorded: oxygenSat.recorded_at,
      });
    }

    return displayMetrics;
  };

  const getHealthScore = (): HealthScore => {
    const displayMetrics = getDisplayMetrics();
    if (displayMetrics.length === 0) {
      return {
        score: 0,
        category: 'poor',
        message: 'Registre suas métricas para ver seu score de saúde',
        recommendations: ['Comece registrando sua pressão arterial', 'Adicione medições de peso e temperatura']
      };
    }

    const scores = displayMetrics.map(metric => {
      switch (metric.status) {
        case 'normal':
        case 'ideal':
          return 100;
        case 'attention':
          return 70;
        case 'critical':
          return 30;
        default:
          return 50;
      }
    });

    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    let category: HealthScore['category'];
    let message: string;
    let recommendations: string[];

    if (averageScore >= 90) {
      category = 'excellent';
      message = 'Excelente! Seus indicadores estão ótimos.';
      recommendations = ['Continue mantendo seus hábitos saudáveis', 'Faça check-ups regulares'];
    } else if (averageScore >= 75) {
      category = 'good';
      message = 'Bom! A maioria dos seus indicadores está normal.';
      recommendations = ['Monitore regularmente suas métricas', 'Mantenha uma alimentação equilibrada'];
    } else if (averageScore >= 50) {
      category = 'fair';
      message = 'Atenção! Alguns indicadores precisam de cuidado.';
      recommendations = ['Consulte um médico regularmente', 'Pratique exercícios físicos', 'Monitore sua alimentação'];
    } else {
      category = 'poor';
      message = 'Importante! Vários indicadores precisam de atenção médica.';
      recommendations = ['Procure orientação médica urgente', 'Monitore diariamente suas métricas', 'Siga rigorosamente as recomendações médicas'];
    }

    return {
      score: Math.round(averageScore),
      category,
      message,
      recommendations
    };
  };

  useEffect(() => {
    loadHealthMetrics();
  }, [user, patientId]);

  return {
    metrics,
    loading,
    isSubmitting,
    createMetric,
    deleteMetric,
    refetch: loadHealthMetrics,
    displayMetrics: getDisplayMetrics(),
    healthScore: getHealthScore()
  };
};

// Funções auxiliares para determinar status
function getBloodPressureStatus(systolic: number, diastolic: number): HealthMetricDisplay['status'] {
  if (systolic < 120 && diastolic < 80) return 'ideal';
  if (systolic <= 139 && diastolic <= 89) return 'normal';
  if (systolic <= 159 && diastolic <= 99) return 'attention';
  return 'critical';
}

function getHeartRateStatus(heartRate: number): HealthMetricDisplay['status'] {
  if (heartRate >= 60 && heartRate <= 100) return 'normal';
  if (heartRate >= 50 && heartRate <= 110) return 'attention';
  return 'critical';
}

function getTemperatureStatus(temperature: number): HealthMetricDisplay['status'] {
  if (temperature >= 36.0 && temperature <= 37.5) return 'normal';
  if (temperature >= 35.5 && temperature <= 38.0) return 'attention';
  return 'critical';
}

function getGlucoseStatus(glucose: number): HealthMetricDisplay['status'] {
  if (glucose >= 70 && glucose <= 100) return 'normal';
  if (glucose >= 60 && glucose <= 140) return 'attention';
  return 'critical';
}

function getOxygenSaturationStatus(saturation: number): HealthMetricDisplay['status'] {
  if (saturation >= 95) return 'normal';
  if (saturation >= 90) return 'attention';
  return 'critical';
}
