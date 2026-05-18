import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { colors, spacing, radius, shadow, typography } from '../../shared/styles/tokens.js';

// Two grouped bar charts side by side: revenue YoY and occupancy YoY.
// When the prior-year series is entirely empty we drop the comparison
// bars and render a single-year chart with a "Limited prior-year data"
// note instead of fabricating numbers.

export function MainDashboardCharts({ revenue, occupancy, year }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
      gap: spacing.lg
    }}>
      <YoyChart
        title="Revenue"
        subtitle={revenue?.hasPriorYearData ? 'This year vs last year' : 'Limited prior-year data'}
        data={revenue?.months || []}
        hasPriorYear={!!revenue?.hasPriorYearData}
        year={year}
        valueFormatter={formatCurrency}
        yAxisFormatter={(v) => '$' + Math.round(v / 1000) + 'K'}
        domain={[0, 'auto']}
      />
      <YoyChart
        title="Occupancy"
        subtitle={occupancy?.hasPriorYearData ? 'This year vs last year' : 'Limited prior-year data'}
        data={occupancy?.months || []}
        hasPriorYear={!!occupancy?.hasPriorYearData}
        year={year}
        valueFormatter={(v) => v + '%'}
        yAxisFormatter={(v) => v + '%'}
        domain={[0, 100]}
      />
    </div>
  );
}

function YoyChart({ title, subtitle, data, hasPriorYear, year, valueFormatter, yAxisFormatter, domain }) {
  return (
    <section style={{
      background: colors.surface.background,
      border: `1px solid ${colors.surface.border}`,
      borderRadius: radius.lg,
      boxShadow: shadow.sm,
      padding: spacing.xl,
      display: 'flex',
      flexDirection: 'column',
      gap: spacing.md
    }}>
      <header>
        <h3 style={{
          margin: 0,
          fontSize: typography.sizes.lg,
          fontWeight: typography.weights.semibold,
          color: colors.neutral[900]
        }}>
          {title}
        </h3>
        <p style={{
          margin: `${spacing.xs}px 0 0`,
          fontSize: typography.sizes.sm,
          color: colors.neutral[500]
        }}>
          {subtitle}
        </p>
      </header>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.neutral[200]} />
          <XAxis dataKey="month" stroke={colors.neutral[500]} tick={{ fontSize: 12 }} />
          <YAxis
            stroke={colors.neutral[500]}
            tickFormatter={yAxisFormatter}
            tick={{ fontSize: 12 }}
            domain={domain}
          />
          <Tooltip
            formatter={(value, _name) => valueFormatter(value)}
            labelFormatter={(label, payload) => formatTooltipLabel(label, payload, valueFormatter)}
          />
          {hasPriorYear ? <Legend wrapperStyle={{ paddingTop: spacing.md, fontSize: 12 }} /> : null}
          {hasPriorYear ? (
            <Bar dataKey="lastYear" name={String(year - 1)} fill={colors.neutral[300]} />
          ) : null}
          <Bar dataKey="thisYear" name={String(year)} fill={colors.brand.primary} />
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}

function formatCurrency(value) {
  const num = Math.round(value || 0);
  if (Math.abs(num) >= 1000000) return '$' + (num / 1000000).toFixed(1) + 'M';
  if (Math.abs(num) >= 1000) return '$' + Math.round(num / 1000) + 'K';
  return '$' + num.toLocaleString();
}

function formatTooltipLabel(label, payload, valueFormatter) {
  if (!Array.isArray(payload) || payload.length < 2) return label;
  const thisYear = payload.find(p => p.dataKey === 'thisYear');
  const lastYear = payload.find(p => p.dataKey === 'lastYear');
  if (!thisYear || !lastYear || !lastYear.value) return label;
  const pct = ((thisYear.value - lastYear.value) / lastYear.value) * 100;
  const sign = pct >= 0 ? '+' : '';
  return label + ' (' + sign + pct.toFixed(0) + '% YoY)';
}
