# Dashboard Hooks

Hooks customizados para o Dashboard Médico V3 usando React Query.

## Hooks Disponíveis

### `useDashboardMetrics(period)`
Busca métricas do dashboard (consultas, receita, ocupação, pacientes).

**Parâmetros:**
- `period`: `'today' | 'week' | 'month' | 'year'` (default: `'month'`)

**Retorna:**
- `data`: Objeto `DashboardMetrics` com todas as métricas
- `isLoading`: Boolean indicando carregamento
- `error`: Erro se houver
- `refetch`: Função para forçar atualização

**Cache:** 5 minutos

---

### `useDashboardAppointments(limit)`
Busca próximas consultas do dia.

**Parâmetros:**
- `limit`: Número máximo de consultas (default: `5`)

**Retorna:**
- `data`: Array de `DashboardAppointment`
- `isLoading`: Boolean indicando carregamento
- `error`: Erro se houver
- `refetch`: Função para forçar atualização

**Cache:** 2 minutos (atualiza automaticamente a cada 1 minuto)

---

### `useDashboardAlerts()`
Busca alertas importantes (pagamentos pendentes, confirmações, etc).

**Retorna:**
- `data`: Array de `DashboardAlert`
- `isLoading`: Boolean indicando carregamento
- `error`: Erro se houver
- `refetch`: Função para forçar atualização

**Cache:** 3 minutos

---

### `useConsultasChartData(days)`
Busca dados para gráfico de consultas por dia.

**Parâmetros:**
- `days`: Número de dias (default: `7`)

**Retorna:**
- `data`: Array de `ChartDataPoint`
- `isLoading`: Boolean indicando carregamento
- `error`: Erro se houver

**Cache:** 5 minutos

---

### `useConsultationTypeData(period)`
Busca distribuição de tipos de consulta (presencial vs teleconsulta).

**Parâmetros:**
- `period`: `'month' | 'year'` (default: `'month'`)

**Retorna:**
- `data`: Array de `ConsultationTypeData`
- `isLoading`: Boolean indicando carregamento
- `error`: Erro se houver

**Cache:** 5 minutos

---

## Exemplo de Uso

```typescript
import {
  useDashboardMetrics,
  useDashboardAppointments,
  useDashboardAlerts,
} from '@/hooks/dashboard';

function MyDashboard() {
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics('month');
  const { data: appointments, isLoading: appointmentsLoading } = useDashboardAppointments(5);
  const { data: alerts, isLoading: alertsLoading } = useDashboardAlerts();

  if (metricsLoading || appointmentsLoading || alertsLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <MetricsCards metrics={metrics} />
      <AppointmentsList appointments={appointments} />
      <AlertsSection alerts={alerts} />
    </div>
  );
}
```

## Refresh Manual

Para forçar atualização de todos os dados:

```typescript
import { useQueryClient } from '@tanstack/react-query';

function DashboardHeader() {
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    await queryClient.invalidateQueries({ queryKey: ['dashboard-appointments'] });
    await queryClient.invalidateQueries({ queryKey: ['dashboard-alerts'] });
  };

  return <button onClick={handleRefresh}>Atualizar</button>;
}
```

## Características

- ✅ Cache automático (5 minutos para métricas)
- ✅ Retry automático (2 tentativas com backoff exponencial)
- ✅ Refetch ao focar na janela
- ✅ Refetch ao reconectar internet
- ✅ Loading e error states
- ✅ TypeScript completo
- ✅ Otimizado para performance
