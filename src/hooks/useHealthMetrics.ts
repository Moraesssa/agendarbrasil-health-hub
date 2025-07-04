import { useState, useEffect } from 'react'
import { getHealthMetricsForPatient } from '@/services/healthService'
import { Tables } from '@/integrations/supabase/types'
import type { HealthSummaryProps, HealthMetric } from '@/components/HealthSummary'
import { HeartPulse, Weight, Thermometer, Droplets } from 'lucide-react'

// Define a type for the raw metric from the DB
type HealthMetricFromDB = Tables<'health_metrics'>

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
    'systolic' in bpMetric.value
  ) {
    const systolic = (bpMetric.value as { systolic: number }).systolic
    if (systolic > 130) {
      score -= 15
    }
  }

  // Rule 2: Weight
  const weightMetric = metrics.find((m) => m.metric_type === 'weight')
  if (weightMetric && typeof weightMetric.value === 'number') {
    if (weightMetric.value > 90) {
      score -= 10
    }
  }

  return Math.max(0, score) // Ensure score doesn't go below 0
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

    return {
      icon: visuals.icon,
      label: metric.metric_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
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
  }, [patientId])

  return { summaryData, isLoading, error }
}