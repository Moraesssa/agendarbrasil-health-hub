import { useState, useEffect } from 'react'
import { useHealthDataCache } from '@/contexts/HealthDataCacheContext'
import { getHealthMetricsForPatient } from '@/services/healthService'
import type { HealthSummaryProps, HealthMetric } from '@/components/HealthSummary'
import { HeartPulse, Weight, Thermometer, Droplets } from 'lucide-react'

// Define a type for the raw metric from the DB
// Manually defined to avoid issues with generated types
interface HealthMetricFromDB {
  id: string
  patient_id: string
  metric_type: string
  value: string | number | { [key: string]: any }
  unit?: string | null
  created_at: string
}

// A simple function to calculate a health score.
// This is a placeholder and should be replaced with a more robust algorithm.
const calculateHealthScore = (metrics: HealthMetricFromDB[]): number => {
  let score = 100

  // Rule 1: Blood Pressure
  const bpMetric = metrics.find((m) => m.metric_type === 'blood_pressure')
  if (
    bpMetric &&
    typeof bpMetric.value === 'object' &&
    bpMetric.value &&
    'systolic' in bpMetric.value &&
    'diastolic' in bpMetric.value
  ) {
    const { systolic, diastolic } = bpMetric.value as { systolic: number; diastolic: number }

    if (systolic > 180 || diastolic > 120) {
      score -= 50 // Hypertensive Crisis
    } else if (systolic >= 140 || diastolic >= 90) {
      score -= 30 // Hypertension Stage 2
    } else if (systolic >= 130 || diastolic >= 80) {
      score -= 20 // Hypertension Stage 1
    } else if (systolic >= 120) {
      score -= 10 // Elevated
    }
  }

  // Rule 2: Weight (example, can be improved with BMI)
  const weightMetric = metrics.find((m) => m.metric_type === 'weight')
  if (weightMetric && typeof weightMetric.value === 'number') {
    // This is a very simplistic model. A real-world scenario would use BMI.
    if (weightMetric.value > 90) {
      // Assuming an average height, this might indicate overweight.
      score -= 10
    }
  }

  return Math.max(0, score) // Ensure score doesn't go below 0
}

const metricTranslations: Record<string, string> = {
  blood_pressure: 'Pressão Arterial',
  weight: 'Peso',
  blood_glucose: 'Glicemia',
  temperature: 'Temperatura',
}

// A function to transform DB data into the format the component expects
const transformMetricsForSummary = (metrics: HealthMetricFromDB[]): HealthSummaryProps => {
  const healthScoreValue = calculateHealthScore(metrics)

  const transformedMetrics = metrics.slice(0, 4).map((metric): HealthMetric => {
    // This is a placeholder transformation.
    // You would need more logic to handle different metric_types.
    let valueDisplay = ''
    if (typeof metric.value === 'object' && metric.value !== null) {
      // Example for blood pressure
      if ('systolic' in metric.value && 'diastolic' in metric.value) {
        valueDisplay = `${metric.value.systolic}/${metric.value.diastolic}`
      } else {
        valueDisplay = JSON.stringify(metric.value)
      }
    } else {
      valueDisplay = String(metric.value)
    }

    // Placeholder logic for icon and color
    const getMetricVisuals = (type: string) => {
      switch (type) {
        case 'blood_pressure':
          return { icon: HeartPulse, color: 'text-red-500' }
        case 'weight':
          return { icon: Weight, color: 'text-blue-500' }
        case 'blood_glucose':
          return { icon: Droplets, color: 'text-orange-500' }
        default:
          return { icon: Thermometer, color: 'text-gray-500' }
      }
    }
    const visuals = getMetricVisuals(metric.metric_type)

    const translatedLabel =
      metricTranslations[metric.metric_type] ||
      metric.metric_type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())

    return {
      icon: visuals.icon,
      label: translatedLabel,
      value: valueDisplay,
      unit: metric.unit,
      status: 'normal', // Placeholder status
      color: visuals.color,
    }
  })

  return {
    healthMetrics: transformedMetrics,
    healthScore: {
      value: healthScoreValue,
      message: healthScoreValue > 80 ? 'Sua saúde está ótima!' : 'Continue cuidando da sua saúde.',
    },
  }
}

export const useHealthMetrics = (patientId: string) => {
  const [summaryData, setSummaryData] = useState<HealthSummaryProps | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { lastUpdated } = useHealthDataCache()

  useEffect(() => {
    if (!patientId) {
      setIsLoading(false)
      return
    }

    const fetchMetrics = async () => {
      try {
        setIsLoading(true)
        const metrics = await getHealthMetricsForPatient(patientId)
        const transformedData = transformMetricsForSummary(metrics)
        setSummaryData(transformedData)
      } catch (err) {
        setError(err as Error)
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMetrics()
  }, [patientId, lastUpdated])

  return { summaryData, isLoading, error }
}