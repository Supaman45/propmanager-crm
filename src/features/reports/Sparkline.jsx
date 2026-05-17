import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { colors } from '../../shared/styles/tokens.js';

// Tiny line chart for KPI cards. Expects an array of numbers.
export function Sparkline({ values, color = colors.brand.primary, height = 40 }) {
  const safe = Array.isArray(values) && values.length > 0 ? values : [0, 0, 0, 0, 0, 0];
  const data = safe.map((v, i) => ({ x: i, y: Number.isFinite(v) ? v : 0 }));
  const min = Math.min(...data.map(d => d.y));
  const max = Math.max(...data.map(d => d.y));
  const padding = (max - min) * 0.15 || 1;

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <YAxis hide domain={[min - padding, max + padding]} />
          <Line
            type="monotone"
            dataKey="y"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
