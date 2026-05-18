import { MS_PER_DAY, parseDate } from './mainDashboardMetrics.js';

// Due Dates panel rows. Pulls upcoming lease expirations, tenants more
// than 5 days late on rent, and maintenance requests open for over 30
// days. Sorted ascending by the "due" date so the nearest thing is at
// the top. Vendor follow-ups are not yet wired (no vendor payments
// table in the demo schema).

export function computeDueDates(data, now = new Date(), { horizonDays = 14, limit = 8 } = {}) {
  if (!data) return { rows: [], total: 0 };
  const { tenants = [], maintenanceRequests = [] } = data;
  const horizon = new Date(now.getTime() + horizonDays * MS_PER_DAY);
  const fiveDaysAgo = new Date(now.getTime() - 5 * MS_PER_DAY);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * MS_PER_DAY);

  const rows = [];

  // Lease expirations within the horizon.
  tenants.forEach(t => {
    if (t.status !== 'current') return;
    const end = parseDate(t.lease_end);
    if (!end || end < now || end > horizon) return;
    const days = Math.max(0, Math.round((end - now) / MS_PER_DAY));
    rows.push({
      kind: 'lease',
      sortAt: end,
      tone: days <= 3 ? 'urgent' : 'warning',
      label: t.name ? (t.name + "'s lease expires") : 'Lease expires',
      detail: (t.property || 'No property') + ' - in ' + days + ' day' + (days === 1 ? '' : 's'),
      navTarget: { tab: 'tenants', recordId: t.id }
    });
  });

  // Tenants over 5 days late on rent. Only show after the 5th since
  // before then "late" status is normal early-month timing. Uses the
  // same "late" definition as the Tenants tab (status current,
  // payment_status late). Hook returns raw Supabase rows (snake_case),
  // so read payment_status directly rather than the camelCase form
  // used in App.jsx state.
  if (now.getDate() > 5) {
    tenants.forEach(t => {
      const isLate = (t.status === 'current' || t.status === 'Current') && t.payment_status === 'late';
      if (!isLate) return;
      const daysLate = now.getDate();
      rows.push({
        kind: 'late_rent',
        sortAt: fiveDaysAgo,
        tone: 'urgent',
        label: (t.name || 'Tenant') + ' is late on rent',
        detail: (t.property || 'No property') + ' - ' + daysLate + ' day' + (daysLate === 1 ? '' : 's') + ' into the month',
        navTarget: { tab: 'tenants', recordId: t.id }
      });
    });
  }

  // Maintenance open over 30 days.
  maintenanceRequests.forEach(m => {
    if (m.status !== 'open') return;
    const created = parseDate(m.created_at);
    if (!created || created >= thirtyDaysAgo) return;
    const age = Math.round((now - created) / MS_PER_DAY);
    rows.push({
      kind: 'maintenance',
      sortAt: created,
      tone: 'warning',
      label: m.issue || 'Maintenance request',
      detail: (m.property || 'No property') + ' - open for ' + age + ' days',
      navTarget: { tab: 'maintenance', recordId: m.id }
    });
  });

  rows.sort((a, b) => a.sortAt - b.sortAt);
  return { rows: rows.slice(0, limit), total: rows.length };
}
