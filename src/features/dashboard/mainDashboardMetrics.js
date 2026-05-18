// Pure metric helpers for the Main Dashboard. Kept separate from the hook
// so the hook stays focused on fetching, and so the priority logic for
// "what is the single most important thing the operator needs to see
// today" can be unit-reasoned about without React.

export const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

// Priority-ordered attention buckets. The first bucket with a non-empty
// match wins. Each returns { message, navTarget } where navTarget is a
// hint the page uses to wire the click-through. If nothing matches we
// return null and the caller renders the "all clear" copy.
export function computeMostImportantItem(data, now = new Date()) {
  if (!data) return null;
  const { tenants = [], properties = [], maintenanceRequests = [] } = data;

  const twentyFourHoursAgo = new Date(now.getTime() - 1 * MS_PER_DAY);
  const fourteenDaysOut = new Date(now.getTime() + 14 * MS_PER_DAY);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * MS_PER_DAY);

  // 1. Urgent maintenance over 24 hours old.
  const urgentStale = maintenanceRequests.filter(m => {
    if (m.status !== 'open') return false;
    if (m.priority !== 'urgent' && m.priority !== 'high') return false;
    const created = parseDate(m.created_at);
    return created && created < twentyFourHoursAgo;
  });
  if (urgentStale.length > 0) {
    return {
      level: 'urgent',
      message: `${urgentStale.length} urgent maintenance request${urgentStale.length === 1 ? '' : 's'} need your attention today`,
      navTarget: { tab: 'maintenance', filter: 'open' }
    };
  }

  // 2. Leases expiring within 14 days.
  const expiringSoon = tenants.filter(t => {
    if (t.status !== 'current') return false;
    const end = parseDate(t.lease_end);
    return end && end >= now && end <= fourteenDaysOut;
  });
  if (expiringSoon.length > 0) {
    return {
      level: 'warning',
      message: `${expiringSoon.length} lease${expiringSoon.length === 1 ? '' : 's'} expire in the next 14 days`,
      navTarget: { tab: 'tenants' }
    };
  }

  // 3. Tenants more than 5 days late on rent. We use status="late" plus
  // a heuristic of "today is past the 5th of the month" since the rent
  // due date itself isn't stored per tenant in this schema.
  if (now.getDate() > 5) {
    const lateTenants = tenants.filter(t => t.status === 'late');
    if (lateTenants.length > 0) {
      return {
        level: 'warning',
        message: `${lateTenants.length} tenant${lateTenants.length === 1 ? '' : 's'} more than 5 days late on rent`,
        navTarget: { tab: 'tenants', filter: 'late' }
      };
    }
  }

  // 4. Maintenance over 30 days old.
  const stuckMaintenance = maintenanceRequests.filter(m => {
    if (m.status !== 'open') return false;
    const created = parseDate(m.created_at);
    return created && created < thirtyDaysAgo;
  });
  if (stuckMaintenance.length > 0) {
    return {
      level: 'warning',
      message: `${stuckMaintenance.length} maintenance request${stuckMaintenance.length === 1 ? '' : 's'} over 30 days old`,
      navTarget: { tab: 'maintenance', filter: 'open' }
    };
  }

  // 5. Vacant properties over 30 days. updated_at as proxy since there's
  // no last-vacated-on column in the schema.
  const longVacant = properties.filter(p => {
    if ((p.units || 0) === 0) return false;
    if ((p.occupied || 0) !== 0) return false;
    const updated = parseDate(p.updated_at);
    return updated && updated < thirtyDaysAgo;
  });
  if (longVacant.length > 0) {
    return {
      level: 'info',
      message: `${longVacant.length} propert${longVacant.length === 1 ? 'y has' : 'ies have'} been vacant over 30 days`,
      navTarget: { tab: 'properties' }
    };
  }

  return null; // caller renders the "all clear" line
}

export function timeOfDayGreeting(now = new Date()) {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function formatHeaderDate(now = new Date()) {
  return now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase();
}
