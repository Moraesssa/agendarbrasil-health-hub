# Dashboard Context

Context for managing dashboard state, filters, and user preferences.

## Features

- **Period Filters**: Switch between today, week, month, and year views
- **Date Range**: Custom date range selection
- **User Preferences**: Persist widget visibility, order, and default period
- **Auto-save**: Preferences are automatically saved to Supabase (debounced)

## Usage

### Wrap your dashboard with DashboardProvider

```tsx
import { DashboardProvider } from '@/contexts/DashboardContext';

function DashboardMedicoV3() {
  return (
    <DashboardProvider>
      <YourDashboardContent />
    </DashboardProvider>
  );
}
```

### Use the useDashboard hook

```tsx
import { useDashboard } from '@/contexts/DashboardContext';

function MyComponent() {
  const { 
    filters, 
    setPeriod, 
    preferences,
    toggleWidgetVisibility 
  } = useDashboard();

  return (
    <div>
      <p>Current period: {filters.period}</p>
      <button onClick={() => setPeriod('week')}>
        Switch to Week View
      </button>
    </div>
  );
}
```

## API Reference

### Filters

- `filters.period`: Current period ('today' | 'week' | 'month' | 'year')
- `filters.dateRange`: { start: Date, end: Date }
- `setPeriod(period)`: Change the period filter
- `setDateRange(start, end)`: Set custom date range

### Preferences

- `preferences.hiddenWidgets`: Array of hidden widget IDs
- `preferences.widgetOrder`: Array defining widget display order
- `preferences.defaultPeriod`: Default period on dashboard load
- `toggleWidgetVisibility(widgetId)`: Show/hide a widget
- `reorderWidgets(newOrder)`: Change widget order
- `setDefaultPeriod(period)`: Set default period preference

### State

- `isLoadingPreferences`: Boolean indicating if preferences are loading
- `savePreferences()`: Manually save preferences (auto-save is enabled by default)

## Database Schema

The context uses the `user_preferences` table:

```sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  preference_type VARCHAR(50), -- 'dashboard'
  preferences JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(user_id, preference_type)
);
```

Run `database/create_user_preferences_table.sql` to create the table.

## Widget IDs

Standard widget IDs used in the dashboard:
- `metrics`: Metrics cards section
- `charts`: Charts section
- `appointments`: Upcoming appointments widget
- `alerts`: Alerts section
- `quick-actions`: Quick actions widget
- `management`: Management section (locations & schedule)

## Example: Hide a Widget

```tsx
const { toggleWidgetVisibility, preferences } = useDashboard();

const isHidden = preferences.hiddenWidgets.includes('charts');

<button onClick={() => toggleWidgetVisibility('charts')}>
  {isHidden ? 'Show' : 'Hide'} Charts
</button>
```

## Example: Period Selector

```tsx
const { filters, setPeriod } = useDashboard();

<Select value={filters.period} onValueChange={setPeriod}>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="today">Hoje</SelectItem>
    <SelectItem value="week">Semana</SelectItem>
    <SelectItem value="month">Mês</SelectItem>
    <SelectItem value="year">Ano</SelectItem>
  </SelectContent>
</Select>
```
