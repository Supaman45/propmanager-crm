import { MS_PER_DAY, parseDate } from './mainDashboardMetrics.js';

// Top 3-5 action items for the operator, sorted by impact descending.
// Impact ranking (highest first): urgent stuck maintenance, leases
// expiring within 14 days, late tenants over 5 days into the month,
// long-vacant properties, prospects in pipeline. Each item carries an
// icon name (resolved at render), a tone for the count pill, and a
// navTarget that routes through the same onNavigate handler the
// Due Dates panel uses.

const IMPACT = {
  urgent_maintenance: 100,
  lease_expiring: 80,
  late_rent: 70,
  long_vacant: 50,
  prospect_pipeline: 30
};

export function computeActionItems(data, now = new Date(), { limit = 5 } = {}) {
  if (!data) return [];
  const { tenants = [], properties = [], maintenanceRequests = [] } = data;
  const fourteenDaysOut = new Date(now.getTime() + 14 * MS_PER_DAY);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * MS_PER_DAY);

  const items = [];

  // Urgent maintenance over 30 days old.
  const urgentStuck = maintenanceRequests.filter(m => {
    if (m.status !== 'open') return false;
    const created = parseDate(m.created_at);
    return created && created < thirtyDaysAgo;
  });
  if (urgentStuck.length > 0) {
    items.push({
      kind: 'urgent_maintenance',
      iconName: 'wrench',
      tone: 'urgent',
      count: urgentStuck.length,
      label: 'Review ' + urgentStuck.length + ' maintenance request' + (urgentStuck.length === 1 ? '' : 's') + ' over 30 days old',
      navTarget: { tab: 'maintenance', filter: 'open' },
      impact: IMPACT.urgent_maintenance
    });
  }

  // Leases expiring within 14 days.
  const expiring = tenants.filter(t => {
    if (t.status !== 'current') return false;
    const end = parseDate(t.lease_end);
    return end && end >= now && end <= fourteenDaysOut;
  });
  if (expiring.length > 0) {
    items.push({
      kind: 'lease_expiring',
      iconName: 'calendar',
      tone: 'warning',
      count: expiring.length,
      label: expiring.length === 1
        ? 'Renew lease for ' + (expiring[0].name || 'tenant')
        : 'Renew ' + expiring.length + ' leases expiring in the next 14 days',
      navTarget: expiring.length === 1
        ? { tab: 'tenants', recordId: expiring[0].id }
        : { tab: 'tenants', filter: 'expiring' },
      impact: IMPACT.lease_expiring
    });
  }

  // Late rent past day 5. Uses the same "late" definition as the Tenants
  // tab kanban (status is current, payment_status is late) so the
  // click-through lands on a populated list. Note: this hook returns raw
  // Supabase rows (snake_case), unlike App.jsx state which is transformed
  // to camelCase. Read payment_status directly here.
  if (now.getDate() > 5) {
    const lateTenants = tenants.filter(t =>
      (t.status === 'current' || t.status === 'Current') && t.payment_status === 'late'
    );
    if (lateTenants.length > 0) {
      items.push({
        kind: 'late_rent',
        iconName: 'alert',
        tone: 'urgent',
        count: lateTenants.length,
        label: lateTenants.length === 1
          ? 'Follow up with ' + (lateTenants[0].name || 'tenant') + ', late on rent'
          : 'Follow up with ' + lateTenants.length + ' tenants late on rent',
        navTarget: lateTenants.length === 1
          ? { tab: 'tenants', recordId: lateTenants[0].id }
          : { tab: 'tenants', filter: 'late' },
        impact: IMPACT.late_rent
      });
    }
  }

  // Properties vacant over 30 days.
  const longVacant = properties.filter(p => {
    if ((p.units || 0) === 0) return false;
    if ((p.occupied || 0) !== 0) return false;
    const updated = parseDate(p.updated_at);
    return updated && updated < thirtyDaysAgo;
  });
  if (longVacant.length > 0) {
    items.push({
      kind: 'long_vacant',
      iconName: 'home',
      tone: 'warning',
      count: longVacant.length,
      label: longVacant.length === 1
        ? 'List the vacant unit at ' + (longVacant[0].address || 'property')
        : longVacant.length + ' properties vacant over 30 days, list them',
      navTarget: { tab: 'properties' },
      impact: IMPACT.long_vacant
    });
  }

  // Prospects in pipeline.
  const prospects = tenants.filter(t => t.status === 'prospect');
  if (prospects.length > 0) {
    items.push({
      kind: 'prospect_pipeline',
      iconName: 'user',
      tone: 'info',
      count: prospects.length,
      label: prospects.length + ' prospect' + (prospects.length === 1 ? '' : 's') + ' in the pipeline',
      navTarget: { tab: 'tenants', filter: 'prospect' },
      impact: IMPACT.prospect_pipeline
    });
  }

  items.sort((a, b) => b.impact - a.impact);
  return items.slice(0, limit);
}
