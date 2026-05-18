import {
  computeCollection,
  computeOccupancyAt
} from '../reports/dashboardMetrics.js';

// Year-over-year series for the Main Dashboard YoY charts. Returns 12
// month buckets (Jan through Dec of the current year) with parallel
// values for the prior year. If the prior-year side is empty across
// the board we flag hasPriorYearData=false so the UI can render a
// single-year view with a "Limited prior-year data" note instead of
// fabricating a comparison.

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function computeYoyRevenue(data, now = new Date()) {
  if (!data) return { months: [], hasPriorYearData: false };
  const { tenants = [] } = data;
  const thisYear = now.getFullYear();
  const lastYear = thisYear - 1;

  let priorTotal = 0;
  const months = MONTH_LABELS.map((label, idx) => {
    const thisYearValue = computeCollection(tenants, thisYear, idx).collected;
    const lastYearValue = computeCollection(tenants, lastYear, idx).collected;
    priorTotal += lastYearValue;
    return { month: label, thisYear: thisYearValue, lastYear: lastYearValue };
  });

  return { months, hasPriorYearData: priorTotal > 0 };
}

export function computeYoyOccupancy(data, now = new Date()) {
  if (!data) return { months: [], hasPriorYearData: false };
  const { tenants = [], properties = [] } = data;
  const thisYear = now.getFullYear();
  const lastYear = thisYear - 1;

  let priorTotal = 0;
  const months = MONTH_LABELS.map((label, idx) => {
    const thisYearEnd = new Date(thisYear, idx + 1, 0);
    const lastYearEnd = new Date(lastYear, idx + 1, 0);
    const thisYearValue = Math.round(computeOccupancyAt(tenants, properties, thisYearEnd));
    const lastYearValue = Math.round(computeOccupancyAt(tenants, properties, lastYearEnd));
    priorTotal += lastYearValue;
    return { month: label, thisYear: thisYearValue, lastYear: lastYearValue };
  });

  return { months, hasPriorYearData: priorTotal > 0 };
}
