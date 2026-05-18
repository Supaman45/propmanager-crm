import { colors, spacing, radius, shadow, typography } from '../../shared/styles/tokens.js';
import { useMainDashboard } from './useMainDashboard.js';
import { timeOfDayGreeting, formatHeaderDate } from './mainDashboardMetrics.js';
import { KPICard } from '../reports/KPICard.jsx';
import { DueDatesPanel } from './DueDatesPanel.jsx';
import { MainDashboardCharts } from './MainDashboardCharts.jsx';

// Operator command center. Greeting + the single most important thing to
// do today at the top, then KPI strip, Due Dates panel, YoY charts,
// Action Items, and Recent Activity below. Sections 2-6 are placeholders
// in this commit and get fleshed out in subsequent commits.

export default function MainDashboard({ displayName, onNavigate }) {
  const { loading, error, data, refresh } = useMainDashboard();

  if (loading) {
    return <CenteredMessage>Loading dashboard</CenteredMessage>;
  }
  if (error) {
    return (
      <CenteredMessage tone="danger">
        Could not load dashboard. {error}
        <button onClick={refresh} style={inlineRetry()}>Retry</button>
      </CenteredMessage>
    );
  }
  if (!data) return null;

  const now = new Date();
  const greeting = timeOfDayGreeting(now);
  const dateLine = formatHeaderDate(now);
  const item = data.mostImportantItem;
  const summary = item
    ? item.message
    : 'All clear. Your portfolio is on track for ' + now.toLocaleDateString('en-US', { month: 'long' }) + '.';
  const summaryColor = item
    ? (item.level === 'urgent' ? colors.status.danger : item.level === 'warning' ? colors.status.warning : colors.neutral[700])
    : colors.status.success;
  const summaryClickable = item && item.navTarget && typeof onNavigate === 'function';

  return (
    <div style={{
      maxWidth: 1400,
      margin: '0 auto',
      padding: spacing.xl,
      display: 'flex',
      flexDirection: 'column',
      gap: spacing.xl,
      fontFamily: typography.fontFamily
    }}>
      {/* Section 1: Greeting + most-important-item */}
      <section>
        <div style={{
          fontSize: typography.sizes.xs,
          color: colors.neutral[500],
          fontWeight: typography.weights.medium,
          letterSpacing: '0.06em',
          marginBottom: spacing.xs
        }}>
          {dateLine}
        </div>
        <h1 style={{
          margin: 0,
          fontSize: typography.sizes['3xl'],
          fontWeight: typography.weights.semibold,
          color: colors.neutral[900],
          letterSpacing: '-0.01em'
        }}>
          {greeting}, {displayName || 'there'}
        </h1>
        <button
          type="button"
          onClick={summaryClickable ? () => onNavigate(item.navTarget) : undefined}
          disabled={!summaryClickable}
          style={{
            marginTop: spacing.sm,
            padding: 0,
            border: 'none',
            background: 'transparent',
            fontFamily: typography.fontFamily,
            fontSize: typography.sizes.md,
            color: summaryColor,
            textAlign: 'left',
            cursor: summaryClickable ? 'pointer' : 'default'
          }}
        >
          {summary}
        </button>
      </section>

      {data.kpis ? (
        <section style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: spacing.lg
        }}>
          <KPICard
            label="Collection Rate"
            value={data.kpis.collection.value}
            subLine={data.kpis.collection.subLine}
            sparkline={data.kpis.collection.series}
            band={data.kpis.collection.band}
            trend={data.kpis.collection.trend}
          />
          <KPICard
            label="Occupancy"
            value={data.kpis.occupancy.value}
            subLine={data.kpis.occupancy.subLine}
            sparkline={data.kpis.occupancy.series}
            band={data.kpis.occupancy.band}
            trend={data.kpis.occupancy.trend}
          />
          <KPICard
            label="Net Operating Income"
            value={data.kpis.noi.value}
            subLine={data.kpis.noi.subLine}
            sparkline={data.kpis.noi.series}
            band={data.kpis.noi.band}
            trend={data.kpis.noi.trend}
          />
          <KPICard
            label="Open Maintenance"
            value={data.kpis.openMaintenance.value}
            subLine={data.kpis.openMaintenance.subLine}
            sparkline={data.kpis.openMaintenance.series}
            band={data.kpis.openMaintenance.band}
            trend={data.kpis.openMaintenance.trend}
            invert={true}
          />
        </section>
      ) : null}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: spacing.lg
      }}>
        <DueDatesPanel
          dueDates={data.dueDates}
          onNavigate={onNavigate}
          onSeeAll={() => onNavigate && onNavigate({ tab: 'tenants' })}
        />
        <MainDashboardCharts
          revenue={data.yoyRevenue}
          occupancy={data.yoyOccupancy}
          year={data.year}
        />
      </div>

      <SectionPlaceholder title="Action items" note="Top 3-5 things to act on, sorted by impact." />

      <SectionPlaceholder title="Recent activity" note="Last 5 maintenance updates, payments, messages." />
    </div>
  );
}

function SectionPlaceholder({ title, note }) {
  return (
    <div style={{
      background: colors.surface.background,
      border: `1px dashed ${colors.surface.border}`,
      borderRadius: radius.lg,
      boxShadow: shadow.sm,
      padding: spacing.xl,
      color: colors.neutral[500]
    }}>
      <div style={{ fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.neutral[700], marginBottom: spacing.xs }}>
        {title}
      </div>
      <div style={{ fontSize: typography.sizes.sm }}>{note}</div>
    </div>
  );
}

function CenteredMessage({ children, tone }) {
  const color = tone === 'danger' ? colors.status.danger : colors.neutral[500];
  return (
    <div style={{
      padding: spacing['3xl'],
      textAlign: 'center',
      color,
      fontFamily: typography.fontFamily
    }}>
      {children}
    </div>
  );
}

function inlineRetry() {
  return {
    marginLeft: spacing.md,
    background: 'transparent',
    border: 'none',
    color: colors.brand.primary,
    cursor: 'pointer',
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.base
  };
}
