# Design Document - Dashboard Médico V3

## Overview

O Dashboard Médico V3 será uma refatoração completa focada em performance, responsividade e experiência do usuário. A arquitetura será modular, permitindo fácil manutenção e extensão futura.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    DashboardMedicoV3                     │
│                    (Container Page)                      │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌──────▼──────┐  ┌────────▼────────┐
│  Layout Layer  │  │ Data Layer  │  │  State Layer    │
│  - Sidebar     │  │ - Hooks     │  │  - Context      │
│  - Header      │  │ - Services  │  │  - Cache        │
│  - Grid        │  │ - Queries   │  │  - Filters      │
└────────────────┘  └─────────────┘  └─────────────────┘
        │
        │
┌───────▼──────────────────────────────────────────────┐
│              Widget Components                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ Metrics  │ │  Charts  │ │  Lists   │            │
│  │  Cards   │ │          │ │          │            │
│  └──────────┘ └──────────┘ └──────────┘            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │  Alerts  │ │  Quick   │ │ Settings │            │
│  │          │ │ Actions  │ │          │            │
│  └──────────┘ └──────────┘ └──────────┘            │
└───────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
DashboardMedicoV3
├── DashboardLayout
│   ├── AppSidebar (existing)
│   ├── DashboardHeader
│   │   ├── WelcomeMessage
│   │   ├── DateDisplay
│   │   └── RefreshButton
│   └── DashboardGrid
│       ├── AlertsSection (if alerts exist)
│       ├── MetricsSection
│       │   ├── MetricCard (x4)
│       │   └── MetricCardSkeleton
│       ├── ChartsSection
│       │   ├── ConsultasChart
│       │   ├── ReceitaChart
│       │   └── TiposConsultaChart
│       ├── UpcomingAppointmentsWidget
│       │   ├── AppointmentCard
│       │   └── EmptyState
│       ├── QuickActionsWidget
│       │   └── ActionButton (x5)
│       └── ManagementSection (collapsible)
│           ├── LocationsWidget
│           └── ScheduleWidget
└── OnboardingChecklist (if first time)
```

## Components and Interfaces

### 1. DashboardMedicoV3 (Main Container)

**Responsibilities:**
- Orchestrate data fetching
- Manage global dashboard state
- Handle error boundaries
- Coordinate widget visibility

**Props:**
```typescript
// No props - uses AuthContext for user data
```

**State:**
```typescript
interface DashboardState {
  metrics: MetricsData | null;
  appointments: Appointment[];
  alerts: Alert[];
  loading: boolean;
  error: Error | null;
  filters: DashboardFilters;
  preferences: UserPreferences;
}

interface DashboardFilters {
  period: 'today' | 'week' | 'month' | 'year';
  dateRange: { start: Date; end: Date };
}

interface UserPreferences {
  hiddenWidgets: string[];
  widgetOrder: string[];
  defaultPeriod: string;
}
```

### 2. DashboardHeader

**Responsibilities:**
- Display welcome message with doctor name
- Show current date/time
- Provide refresh button
- Show last updated timestamp

**Props:**
```typescript
interface DashboardHeaderProps {
  doctorName: string;
  lastUpdated: Date | null;
  onRefresh: () => void;
  isRefreshing: boolean;
}
```

### 3. MetricsSection

**Responsibilities:**
- Display 4 key metrics cards
- Handle loading states
- Manage metric card interactions

**Props:**
```typescript
interface MetricsSectionProps {
  metrics: MetricsData;
  loading: boolean;
  period: string;
  onPeriodChange: (period: string) => void;
}

interface MetricsData {
  totalConsultas: number;
  consultasChange: number; // % change from previous period
  receitaTotal: number;
  receitaChange: number;
  taxaOcupacao: number;
  ocupacaoChange: number;
  pacientesUnicos: number;
  pacientesChange: number;
}
```

**Metrics Cards:**
1. **Total de Consultas**
   - Icon: Calendar
   - Color: Blue gradient
   - Shows: Number + % change
   
2. **Receita Total**
   - Icon: DollarSign
   - Color: Green gradient
   - Shows: Currency + % change
   
3. **Taxa de Ocupação**
   - Icon: TrendingUp
   - Color: Purple gradient
   - Shows: Percentage + trend
   
4. **Pacientes Únicos**
   - Icon: Users
   - Color: Orange gradient
   - Shows: Number + % change

### 4. ChartsSection

**Responsibilities:**
- Display interactive charts
- Handle chart interactions
- Manage chart data transformations

**Charts:**

#### ConsultasChart (Bar Chart)
```typescript
interface ConsultasChartProps {
  data: ChartDataPoint[];
  period: string;
  loading: boolean;
}

interface ChartDataPoint {
  date: string;
  value: number;
  label: string;
}
```

#### ReceitaChart (Line Chart)
```typescript
interface ReceitaChartProps {
  data: RevenueDataPoint[];
  period: string;
  loading: boolean;
}

interface RevenueDataPoint {
  date: string;
  receita: number;
  meta?: number; // optional goal line
}
```

#### TiposConsultaChart (Donut Chart)
```typescript
interface TiposConsultaChartProps {
  data: ConsultationTypeData[];
  loading: boolean;
}

interface ConsultationTypeData {
  type: 'presencial' | 'teleconsulta';
  count: number;
  percentage: number;
  color: string;
}
```

### 5. UpcomingAppointmentsWidget

**Responsibilities:**
- Display next 5 appointments
- Show appointment details
- Handle appointment actions (view details)
- Show empty state when no appointments

**Props:**
```typescript
interface UpcomingAppointmentsProps {
  appointments: Appointment[];
  loading: boolean;
  onAppointmentClick: (id: string) => void;
}

interface Appointment {
  id: string;
  patientName: string;
  patientAvatar?: string;
  scheduledTime: Date;
  type: 'presencial' | 'teleconsulta';
  status: 'confirmed' | 'pending';
  isUrgent: boolean; // < 15 min
}
```

### 6. AlertsSection

**Responsibilities:**
- Display important alerts
- Group alerts by priority
- Handle alert dismissal
- Navigate to relevant screens

**Props:**
```typescript
interface AlertsSectionProps {
  alerts: Alert[];
  onAlertClick: (alert: Alert) => void;
  onAlertDismiss: (id: string) => void;
}

interface Alert {
  id: string;
  type: 'payment' | 'confirmation' | 'document' | 'message';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  actionUrl: string;
  count?: number;
}
```

### 7. QuickActionsWidget

**Responsibilities:**
- Provide shortcuts to common actions
- Navigate to relevant screens
- Show action icons and labels

**Actions:**
```typescript
interface QuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  url: string;
  color: string;
}

const quickActions: QuickAction[] = [
  { id: 'new-appointment', label: 'Nova Consulta', icon: Plus, url: '/agenda-medico', color: 'blue' },
  { id: 'view-schedule', label: 'Ver Agenda', icon: Calendar, url: '/agenda-medico', color: 'purple' },
  { id: 'patients', label: 'Pacientes', icon: Users, url: '/pacientes-medico', color: 'green' },
  { id: 'locations', label: 'Locais', icon: MapPin, url: '/gerenciar-locais', color: 'orange' },
  { id: 'schedule-config', label: 'Horários', icon: Clock, url: '/gerenciar-agenda', color: 'red' },
];
```

### 8. ManagementSection

**Responsibilities:**
- Display collapsible sections for locations and schedule
- Allow inline editing
- Show summary information

**Sub-components:**
- LocationsWidget: Shows list of locations with quick edit
- ScheduleWidget: Shows schedule summary with quick edit

## Data Models

### Dashboard Data Structure

```typescript
interface DashboardData {
  metrics: {
    consultas: {
      total: number;
      hoje: number;
      semana: number;
      mes: number;
      change: number;
    };
    receita: {
      total: number;
      media: number;
      mes: number;
      change: number;
    };
    ocupacao: {
      taxa: number;
      horasDisponiveis: number;
      horasOcupadas: number;
      change: number;
    };
    pacientes: {
      total: number;
      novos: number;
      recorrentes: number;
      change: number;
    };
  };
  
  charts: {
    consultasPorDia: ChartDataPoint[];
    receitaPorMes: RevenueDataPoint[];
    tiposConsulta: ConsultationTypeData[];
  };
  
  appointments: {
    upcoming: Appointment[];
    today: Appointment[];
  };
  
  alerts: Alert[];
  
  locations: Location[];
  schedule: ScheduleSummary;
}
```

## Error Handling

### Error Boundary Strategy

```typescript
class DashboardErrorBoundary extends React.Component {
  // Catch errors in dashboard widgets
  // Show fallback UI for failed widgets
  // Allow rest of dashboard to function
}
```

### Error States

1. **Network Error**: Show retry button with error message
2. **Data Error**: Show partial data with warning
3. **Permission Error**: Show access denied message
4. **Timeout Error**: Show loading timeout message

### Error Recovery

```typescript
interface ErrorRecovery {
  retry: () => void;
  fallback: React.ReactNode;
  logError: (error: Error) => void;
}
```

## Testing Strategy

### Unit Tests

- Test each widget component in isolation
- Test data transformation functions
- Test error handling logic
- Test responsive behavior

### Integration Tests

- Test data flow from API to UI
- Test widget interactions
- Test navigation between screens
- Test state management

### E2E Tests

```typescript
describe('Dashboard Médico V3', () => {
  it('should load dashboard with all widgets', () => {
    // Test full dashboard load
  });
  
  it('should update metrics when period changes', () => {
    // Test filter functionality
  });
  
  it('should navigate to appointment details', () => {
    // Test navigation
  });
  
  it('should handle errors gracefully', () => {
    // Test error states
  });
});
```

## Performance Optimization

### Code Splitting

```typescript
// Lazy load heavy components
const ChartsSection = lazy(() => import('./ChartsSection'));
const ManagementSection = lazy(() => import('./ManagementSection'));
```

### Data Caching

```typescript
// Use React Query for caching
const { data, isLoading } = useQuery({
  queryKey: ['dashboard-metrics', period],
  queryFn: () => fetchMetrics(period),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
});
```

### Memoization

```typescript
// Memoize expensive calculations
const chartData = useMemo(() => 
  transformConsultasData(consultas, period),
  [consultas, period]
);
```

### Virtual Scrolling

```typescript
// For long lists (> 50 items)
import { useVirtualizer } from '@tanstack/react-virtual';
```

## Responsive Design

### Breakpoints

```typescript
const breakpoints = {
  mobile: '0px',      // < 640px
  tablet: '640px',    // 640px - 1024px
  desktop: '1024px',  // 1024px - 1536px
  wide: '1536px',     // > 1536px
};
```

### Grid Layout

```css
/* Mobile: 1 column */
.dashboard-grid {
  grid-template-columns: 1fr;
}

/* Tablet: 2 columns */
@media (min-width: 640px) {
  .dashboard-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop: 4 columns */
@media (min-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

### Widget Sizing

- **Metrics Cards**: 1 column each (4 total in row on desktop)
- **Charts**: 2 columns each (2 charts per row on desktop)
- **Appointments**: 2 columns (full width on mobile)
- **Quick Actions**: Full width, horizontal scroll on mobile
- **Management**: Full width, collapsible

## Accessibility

### Keyboard Navigation

```typescript
// Tab order
1. Header actions (refresh)
2. Period filter
3. Metric cards (1-4)
4. Charts (interactive elements)
5. Appointments list
6. Quick actions
7. Management sections
```

### ARIA Labels

```typescript
<div role="region" aria-label="Dashboard Metrics">
  <div role="group" aria-label="Total Consultas">
    <span aria-label="Valor atual">150</span>
    <span aria-label="Mudança percentual">+12%</span>
  </div>
</div>
```

### Screen Reader Announcements

```typescript
// Announce data updates
<div role="status" aria-live="polite" aria-atomic="true">
  {loading ? 'Carregando dados...' : 'Dados atualizados'}
</div>
```

## Security Considerations

### Data Access

- All queries must use RLS policies
- User can only see their own data
- Sensitive data (financial) requires additional verification

### API Security

```typescript
// All requests include auth token
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
```

## Migration Strategy

### Phase 1: Create New Component
- Build DashboardMedicoV3 alongside existing
- Test thoroughly
- No impact on production

### Phase 2: Feature Flag
- Add feature flag to toggle between versions
- Allow gradual rollout
- Easy rollback if issues

### Phase 3: Full Migration
- Update route to use V3
- Deprecate old component
- Monitor for issues

### Phase 4: Cleanup
- Remove old component
- Remove feature flag
- Update documentation

---

## Design Decisions

### Why React Query?
- Built-in caching and refetching
- Automatic background updates
- Better error handling
- Reduced boilerplate

### Why Recharts?
- Lightweight and performant
- Good TypeScript support
- Customizable
- Responsive by default

### Why Modular Widgets?
- Easy to test in isolation
- Can be reused elsewhere
- Easy to add/remove features
- Better code organization

### Why Lazy Loading?
- Faster initial load
- Better performance on mobile
- Load charts only when needed
- Reduced bundle size

---

## Future Enhancements

1. **Real-time Updates**: WebSocket for live data
2. **Customizable Widgets**: Drag-and-drop reordering
3. **Export Functionality**: PDF/Excel reports
4. **Advanced Filters**: Custom date ranges, multiple filters
5. **Collaborative Features**: Share dashboard with team
6. **Mobile App**: Native mobile experience
7. **Offline Mode**: Work without internet
8. **AI Insights**: Predictive analytics and recommendations
