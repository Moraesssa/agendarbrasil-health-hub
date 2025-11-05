import React from 'react';
import { MetricsGrid } from './MetricsGrid';
import { AppointmentsList } from './AppointmentsList';
import { AlertsPanel } from './AlertsPanel';
import { ChartsSection } from './ChartsSection';

/**
 * DashboardGrid Component
 * 
 * Responsive grid system that adapts to different screen sizes:
 * - Mobile (< 640px): 1 column
 * - Tablet (640-1024px): 2 columns
 * - Desktop (> 1024px): 4 columns
 */
export const DashboardGrid: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Metrics Section - 4 cards in a row on desktop */}
      <section>
        <MetricsGrid />
      </section>

      {/* Charts Section - 2 charts per row on desktop */}
      <section>
        <ChartsSection />
      </section>

      {/* Lists Section - 2 columns on desktop */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AppointmentsList />
        <AlertsPanel />
      </section>
    </div>
  );
};
