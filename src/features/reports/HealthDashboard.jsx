import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { colors, spacing, radius, shadow, typography } from '../../shared/styles/tokens.js';
import { useHealthDashboard } from './useHealthDashboard.js';
import { KPICard } from './KPICard.jsx';
import { ActionItem } from './ActionItem.jsx';
import { ActivityFeedItem } from './ActivityFeedItem.jsx';
import { formatCurrencyShort, formatCurrencyFull, formatPercent, hexToRgba } from './formatters.js';
import {
  CalendarIcon, AlertIcon, WrenchIcon, HomeIcon, UserIcon,
  DollarIcon, FileTextIcon, CheckCircleIcon, ActivityIcon
} from './icons.jsx';

// Per-KPI bands calibrated to operator norms. NOI is intentionally
// neutral - too context-dependent for a fixed threshold.
function collectionBand(rate) {
  if (rate >= 90) return 'good';
  if (rate >= 75) return 'warn';
  return 'bad';
}
function occupancyBand(rate) {
  if (rate >= 90) return 'good';
  if (rate >= 80) return 'warn';
  return 'bad';
}
function vacancyBand(days) {
  if (days <= 30) return 'good';
  if (days <= 60) return 'warn';
  return 'bad';
}

function buildSummary(data) {
  if (!data) return '';
  const { collection, occupancy, counts } = data;
  const ratePart = 'This month you collected ' + Math.round(collection.rate) + ' percent of expected rent across ' + counts.properties + ' properties.';
  // Single source of truth for the late count: computeCollectionSnapshot
  // uses the canonical compound rule (status=current + payment_status=late)
  // plus a legacy fallback. computeActions.lateTenants still uses the old
  // top-level status==='late' rule and would report 0 on current demo data.
  const latePart = collection.lateCount + ' tenants are behind on rent.';
  const occPart = 'Occupancy is at ' + Math.round(occupancy.rate) + ' percent.';
  return ratePart + ' ' + latePart + ' ' + occPart;
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div style={{
      background: colors.surface.background,
      border: `1px solid ${colors.surface.border}`,
      borderRadius: radius.lg,
      boxShadow: shadow.sm,
      padding: spacing.xl,
      display: 'flex',
      flexDirection: 'column',
      minHeight: 320
    }}>
      <div style={{ marginBottom: spacing.lg }}>
        <h3 style={{ margin: 0, fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: colors.neutral[900] }}>{title}</h3>
        <p style={{ margin: `${spacing.xs}px 0 0`, fontSize: typography.sizes.sm, color: colors.neutral[500] }}>{subtitle}</p>
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <div style={{
      background: colors.surface.background,
      border: `1px solid ${colors.surface.border}`,
      borderRadius: radius.lg,
      boxShadow: shadow.sm,
      overflow: 'hidden'
    }}>
      <div style={{ padding: `${spacing.lg}px ${spacing.xl}px`, borderBottom: `1px solid ${colors.surface.border}` }}>
        <h3 style={{ margin: 0, fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: colors.neutral[900] }}>{title}</h3>
        {subtitle ? <p style={{ margin: `${spacing.xs}px 0 0`, fontSize: typography.sizes.sm, color: colors.neutral[500] }}>{subtitle}</p> : null}
      </div>
      {children}
    </div>
  );
}

function OccupancyTypeChart({ rows }) {
  const data = rows.map(r => ({
    type: r.type,
    rate: Math.round(r.rate),
    label: r.occupied + ' of ' + r.units
  }));
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.neutral[200]} horizontal={false} />
        <XAxis type="number" domain={[0, 100]} stroke={colors.neutral[500]} tickFormatter={(v) => v + '%'} />
        <YAxis type="category" dataKey="type" stroke={colors.neutral[500]} width={110} tick={{ fontSize: 12 }} />
        <Tooltip formatter={(v, _name, ctx) => [v + '% (' + ctx.payload.label + ')', 'Occupancy']} />
        <Bar dataKey="rate" name="Occupancy" fill={colors.brand.primary}>
          {data.map((entry, idx) => {
            const fill = entry.rate >= 95 ? colors.status.success : entry.rate >= 85 ? colors.status.warning : colors.status.danger;
            return <Cell key={idx} fill={fill} />;
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function RevenueVsExpensesChart({ rows }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={rows} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.neutral[200]} />
        <XAxis dataKey="month" stroke={colors.neutral[500]} tick={{ fontSize: 12 }} />
        <YAxis stroke={colors.neutral[500]} tickFormatter={(v) => '$' + Math.round(v / 1000) + 'K'} tick={{ fontSize: 12 }} />
        <Tooltip formatter={(v) => formatCurrencyShort(v)} />
        <Legend wrapperStyle={{ paddingTop: spacing.md }} />
        <Bar dataKey="revenue" name="Revenue" fill={colors.brand.primary} />
        <Bar dataKey="expenses" name="Expenses" fill={colors.status.warning} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function HealthDashboard({ onNavigate }) {
  const { loading, error, data, refresh } = useHealthDashboard();

  if (loading) {
    return (
      <div style={{ padding: spacing['3xl'], textAlign: 'center', color: colors.neutral[500], fontFamily: typography.fontFamily }}>
        Loading dashboard
      </div>
    );
  }
  if (error) {
    return (
      <div style={{
        padding: spacing.xl,
        background: hexToRgba(colors.status.danger, 0.08),
        border: `1px solid ${colors.status.danger}`,
        borderRadius: radius.lg,
        color: colors.status.danger,
        fontFamily: typography.fontFamily
      }}>
        Could not load dashboard. {error}
        <button onClick={refresh} style={{ marginLeft: spacing.md, background: 'transparent', border: 'none', color: colors.brand.primary, cursor: 'pointer' }}>Retry</button>
      </div>
    );
  }
  if (!data) return null;

  const summary = buildSummary(data);
  const noiDir = data.noi.current >= data.noi.previous ? 'up' : 'down';

  const allActionsZero = Object.values(data.actions).every(v => !v);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: spacing.xl,
      padding: spacing.xl,
      fontFamily: typography.fontFamily
    }}>
      {/* Section 1: Conversational banner */}
      <div style={{
        background: hexToRgba(colors.brand.primary, 0.08),
        border: `1px solid ${hexToRgba(colors.brand.primary, 0.18)}`,
        borderRadius: radius.lg,
        padding: spacing.xl,
        fontSize: typography.sizes.lg,
        color: colors.neutral[900],
        lineHeight: 1.5
      }}>
        {summary}
      </div>

      {/* Section 2: KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: spacing.lg }}>
        <KPICard
          label="Collection Rate"
          value={formatPercent(data.collection.rate)}
          subLine={formatCurrencyShort(data.collection.collected) + ' of ' + formatCurrencyShort(data.collection.expected) + ' expected'}
          sparkline={data.collection.series}
          band={collectionBand(data.collection.rate)}
        />
        <KPICard
          label="Occupancy"
          value={formatPercent(data.occupancy.rate)}
          subLine={data.occupancy.occupied + ' of ' + data.occupancy.units + ' units'}
          sparkline={data.occupancy.series}
          band={occupancyBand(data.occupancy.rate)}
        />
        <KPICard
          label="Net Operating Income"
          value={formatCurrencyShort(data.noi.current)}
          subLine={'vs ' + formatCurrencyShort(data.noi.previous) + ' last month'}
          sparkline={data.noi.series}
          trend={{ direction: noiDir, label: '' }}
        />
        {data.vacancy.turnedCount < 5 ? (
          <KPICard
            label="Average Days Vacant"
            emptyMessage="Not enough data yet. Need at least 5 completed turns in the last 12 months."
          />
        ) : (
          <KPICard
            label="Average Days Vacant"
            value={String(data.vacancy.days)}
            subLine={'across ' + data.vacancy.turnedCount + ' completed turns in the last 12 months'}
            sparkline={data.vacancy.series}
            band={vacancyBand(data.vacancy.days)}
          />
        )}
      </div>

      {/* Section 3: Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: spacing.lg }}>
        <ChartCard title="Revenue vs Expenses" subtitle="Last 12 months">
          <RevenueVsExpensesChart rows={data.revenueVsExpenses} />
        </ChartCard>
        <ChartCard title="Occupancy by Property Type" subtitle="Current snapshot">
          {data.occupancyByType.length === 0
            ? <div style={{ padding: spacing.xl, color: colors.neutral[500] }}>No property data yet</div>
            : <OccupancyTypeChart rows={data.occupancyByType} />}
        </ChartCard>
      </div>

      {/* Section 4: Action items */}
      <Section title="Action Items" subtitle="Things that need your attention">
        {allActionsZero ? (
          <div style={{ padding: spacing['2xl'], textAlign: 'center', color: colors.neutral[500] }}>
            <CheckCircleIcon size={32} color={colors.status.success} />
            <div style={{ marginTop: spacing.md, fontSize: typography.sizes.base }}>
              All clear, nothing needs attention right now
            </div>
          </div>
        ) : (
          <div>
            <ActionItem
              icon={CalendarIcon}
              label={data.actions.leasesExpiring + ' leases expiring in next 60 days'}
              count={data.actions.leasesExpiring}
              tone="warning"
              onClick={() => onNavigate && onNavigate('tenants', { filter: 'expiring' })}
            />
            {/* Late count reads from collection.lateCount (the canonical
                compound rule via computeCollectionSnapshot) rather than
                actions.lateTenants, which is still on the legacy
                status==='late' rule and reports 0 against current demo data. */}
            <ActionItem
              icon={AlertIcon}
              label={data.collection.lateCount + ' tenants behind on rent'}
              count={data.collection.lateCount}
              tone="urgent"
              onClick={() => onNavigate && onNavigate('tenants', { filter: 'late' })}
            />
            <ActionItem
              icon={WrenchIcon}
              label={data.actions.stuckMaintenance + ' maintenance requests open over 30 days'}
              count={data.actions.stuckMaintenance}
              tone="urgent"
              onClick={() => onNavigate && onNavigate('maintenance', { filter: 'open' })}
            />
            <ActionItem
              icon={HomeIcon}
              label={data.actions.vacantProperties + ' properties vacant'}
              count={data.actions.vacantProperties}
              tone="warning"
              onClick={() => onNavigate && onNavigate('properties', { filter: 'vacant' })}
            />
            <ActionItem
              icon={UserIcon}
              label={data.actions.prospects + ' prospects in pipeline'}
              count={data.actions.prospects}
              tone="info"
              onClick={() => onNavigate && onNavigate('tenants', { filter: 'prospect' })}
            />
          </div>
        )}
      </Section>

      {/* Section 5: Activity feed */}
      <Section title="Recent Activity" subtitle="Last 10 events across the portfolio">
        {data.activity.length === 0 ? (
          <div style={{ padding: spacing['2xl'], textAlign: 'center', color: colors.neutral[500] }}>No recent activity</div>
        ) : (
          <div>
            {data.activity.map((event, idx) => (
              <ActivityFeedItem
                key={idx}
                icon={
                  event.kind === 'payment' ? DollarIcon
                    : event.kind === 'maintenance' ? WrenchIcon
                    : event.kind === 'application' ? FileTextIcon
                    : event.kind === 'move_out' ? HomeIcon
                    : event.kind === 'move_in' ? UserIcon
                    : ActivityIcon
                }
                description={event.description}
                timestamp={event.timestamp}
              />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
