// Pure metric computations for the Health Dashboard. Kept separate from the
// data hook so the hook stays focused on fetching and the file stays under
// the 300-line convention.

export const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function monthsBack(date, n) {
  return new Date(date.getFullYear(), date.getMonth() - n, 1);
}

export function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

export function totalsByMonth(now, months = 6) {
  const buckets = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = monthsBack(now, i);
    buckets.push({
      year: d.getFullYear(),
      monthIndex: d.getMonth(),
      label: d.toLocaleDateString('en-US', { month: 'short' })
    });
  }
  return buckets;
}

export function computeCollection(tenants, year, monthIndex) {
  let expected = 0;
  let collected = 0;
  tenants.forEach(t => {
    if (t.status === 'current' || t.status === 'late') {
      expected += t.rent_amount || 0;
    }
    const log = Array.isArray(t.payment_log) ? t.payment_log : [];
    log.forEach(p => {
      const d = parseDate(p.date);
      if (d && d.getFullYear() === year && d.getMonth() === monthIndex) {
        collected += p.amount || 0;
      }
    });
  });
  return { expected, collected, rate: expected > 0 ? (collected / expected) * 100 : 0 };
}

export function computeOccupancyAt(tenants, properties, atDate) {
  const totalUnits = properties.reduce((sum, p) => sum + (p.units || 0), 0);
  if (totalUnits === 0) return 0;
  const occupied = tenants.reduce((count, t) => {
    if (t.status !== 'current' && t.status !== 'late' && t.status !== 'past') return count;
    const start = parseDate(t.lease_start);
    const moveOut = parseDate(t.move_out_date) || parseDate(t.lease_end);
    if (!start || start > atDate) return count;
    if (moveOut && moveOut < atDate) return count;
    return count + 1;
  }, 0);
  return Math.min(100, (occupied / totalUnits) * 100);
}

export function computeExpensesForMonth(properties, year, monthIndex) {
  let total = 0;
  properties.forEach(p => {
    const expenses = Array.isArray(p.expenses) ? p.expenses : [];
    expenses.forEach(e => {
      const d = parseDate(e.date);
      if (d && d.getFullYear() === year && d.getMonth() === monthIndex) {
        total += e.amount || 0;
      }
    });
  });
  return total;
}

export function computeAverageDaysVacant(tenants, now) {
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const turns = [];
  const byProperty = new Map();
  tenants.forEach(t => {
    const key = t.property_id || t.property;
    if (!key) return;
    if (!byProperty.has(key)) byProperty.set(key, []);
    byProperty.get(key).push(t);
  });
  byProperty.forEach(list => {
    list.filter(t => t.status === 'past' && parseDate(t.move_out_date)).forEach(past => {
      const out = parseDate(past.move_out_date);
      if (!out || out < oneYearAgo) return;
      const replacement = list.find(t => {
        if (t.id === past.id) return false;
        const start = parseDate(t.lease_start);
        return start && start > out;
      });
      const refill = replacement ? parseDate(replacement.lease_start) : now;
      const days = Math.max(0, Math.round((refill - out) / MS_PER_DAY));
      turns.push(days);
    });
  });
  if (turns.length === 0) return { days: 0, turnedCount: 0 };
  const avg = turns.reduce((s, n) => s + n, 0) / turns.length;
  return { days: Math.round(avg), turnedCount: turns.length };
}

export function buildActivityFeed(tenants, maintenanceRequests, applications, limit = 10) {
  const events = [];

  tenants.forEach(t => {
    if (t.status === 'current' || t.status === 'late') {
      const date = parseDate(t.lease_start);
      if (date) {
        events.push({
          kind: 'move_in',
          timestamp: date.toISOString(),
          description: `${t.name} moved in at ${t.property || 'a property'}`,
          tenantId: t.id
        });
      }
    }
    if (t.status === 'past') {
      const date = parseDate(t.move_out_date);
      if (date) {
        events.push({
          kind: 'move_out',
          timestamp: date.toISOString(),
          description: `${t.name} moved out of ${t.property || 'a property'}`,
          tenantId: t.id
        });
      }
    }
    const log = Array.isArray(t.payment_log) ? t.payment_log : [];
    log.forEach(p => {
      const d = parseDate(p.date);
      if (d) {
        events.push({
          kind: 'payment',
          timestamp: d.toISOString(),
          description: `Payment of $${(p.amount || 0).toLocaleString()} from ${t.name}`,
          tenantId: t.id
        });
      }
    });
  });

  maintenanceRequests.forEach(m => {
    const d = parseDate(m.created_at);
    if (d) {
      events.push({
        kind: 'maintenance',
        timestamp: d.toISOString(),
        description: `${m.issue || 'Maintenance request'} reported at ${m.property || 'a property'}`,
        maintenanceId: m.id
      });
    }
  });

  applications.forEach(a => {
    const d = parseDate(a.created_at);
    if (d) {
      const name = [a.first_name, a.last_name].filter(Boolean).join(' ') || 'New applicant';
      events.push({
        kind: 'application',
        timestamp: d.toISOString(),
        description: `${name} submitted an application`,
        applicationId: a.id
      });
    }
  });

  return events
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
}

export function summarizeOccupancyByType(tenants, properties) {
  const byType = new Map();
  properties.forEach(p => {
    const type = p.type || 'Other';
    if (!byType.has(type)) byType.set(type, { units: 0, occupied: 0 });
    byType.get(type).units += p.units || 0;
  });
  tenants.forEach(t => {
    if (t.status !== 'current' && t.status !== 'late') return;
    const property = properties.find(p => p.id === t.property_id);
    if (!property) return;
    const bucket = byType.get(property.type) || byType.get('Other');
    if (bucket) bucket.occupied += 1;
  });
  return Array.from(byType.entries())
    .filter(([, v]) => v.units > 0)
    .map(([type, v]) => ({
      type,
      rate: v.units > 0 ? (v.occupied / v.units) * 100 : 0,
      occupied: v.occupied,
      units: v.units
    }));
}

export function computeActions(tenants, maintenanceRequests, properties, now) {
  const sixtyDaysOut = new Date(now.getTime() + 60 * MS_PER_DAY);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * MS_PER_DAY);
  const leasesExpiring = tenants.filter(t => {
    if (t.status !== 'current') return false;
    const end = parseDate(t.lease_end);
    return end && end >= now && end <= sixtyDaysOut;
  }).length;
  const lateTenants = tenants.filter(t => t.status === 'late').length;
  const stuckMaintenance = maintenanceRequests.filter(m => {
    if (m.status !== 'open') return false;
    const created = parseDate(m.created_at);
    return created && created < thirtyDaysAgo;
  }).length;
  const vacantProperties = properties.filter(p => (p.units || 0) > 0 && (p.occupied || 0) === 0).length;
  const prospects = tenants.filter(t => t.status === 'prospect').length;
  return { leasesExpiring, lateTenants, stuckMaintenance, vacantProperties, prospects };
}
