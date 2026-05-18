// Pure metric helpers for the Main Dashboard. Kept separate from the hook
// so the hook stays focused on fetching, and so the priority logic for
// "what is the single most important thing the operator needs to see
// today" can be unit-reasoned about without React.

import {
  monthsBack,
  totalsByMonth,
  computeCollection,
  computeCollectionSnapshot,
  computeOccupancyAt,
  computeExpensesForMonth
} from '../reports/dashboardMetrics.js';

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

function arrowDirection(delta, epsilon = 0) {
  if (Math.abs(delta) <= epsilon) return null;
  return delta > 0 ? 'up' : 'down';
}

// Computes the four KPI cards in one pass. Each card carries its own
// trend marker (or null if there's not enough historical data to compare).
// Reuses helpers from src/features/reports/dashboardMetrics so the math
// stays consistent with the Health Dashboard.
export function computeKpis(data, now = new Date()) {
  if (!data) return null;
  const { tenants = [], properties = [], maintenanceRequests = [] } = data;

  // --- Collection Rate ---
  const collectionSnap = computeCollectionSnapshot(tenants);
  const last6 = totalsByMonth(now, 6);
  const collectionSeries = last6.map(m => {
    if (collectionSnap.expected <= 0) return 0;
    const collected = computeCollection(tenants, m.year, m.monthIndex).collected;
    return Math.round((collected / collectionSnap.expected) * 100);
  });
  // Trend: this month's collected dollars vs last month's. Both come from
  // payment_log dates, which is the only true historical signal we have.
  const lastMonth = monthsBack(now, 1);
  const thisMonthCollected = computeCollection(tenants, now.getFullYear(), now.getMonth()).collected;
  const lastMonthCollected = computeCollection(tenants, lastMonth.getFullYear(), lastMonth.getMonth()).collected;
  const collectionTrend = arrowDirection(thisMonthCollected - lastMonthCollected, collectionSnap.expected * 0.02);

  // --- Occupancy ---
  const totalUnits = properties.reduce((sum, p) => sum + (p.units || 0), 0);
  const activeNow = tenants.filter(t => t.status === 'current' || t.status === 'late').length;
  const occupancyRate = totalUnits > 0 ? (activeNow / totalUnits) * 100 : 0;
  const occupancySeries = last6.map(m => {
    const atDate = new Date(m.year, m.monthIndex + 1, 0);
    return Math.round(computeOccupancyAt(tenants, properties, atDate));
  });
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const lastMonthOccupancy = computeOccupancyAt(tenants, properties, lastMonthEnd);
  const occupancyTrend = arrowDirection(occupancyRate - lastMonthOccupancy, 0.5);

  // --- Net Operating Income (this month) ---
  const expensesThisMonth = computeExpensesForMonth(properties, now.getFullYear(), now.getMonth());
  const noiThisMonth = thisMonthCollected - expensesThisMonth;
  const last12 = totalsByMonth(now, 12);
  const noiSeries = last12.map(m => {
    const rev = computeCollection(tenants, m.year, m.monthIndex).collected;
    const exp = computeExpensesForMonth(properties, m.year, m.monthIndex);
    return rev - exp;
  });
  // YoY: same month last year.
  const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), 1);
  const lastYearRev = computeCollection(tenants, lastYear.getFullYear(), lastYear.getMonth()).collected;
  const lastYearExp = computeExpensesForMonth(properties, lastYear.getFullYear(), lastYear.getMonth());
  const lastYearNoi = lastYearRev - lastYearExp;
  const hasYoyData = lastYearRev > 0 || lastYearExp > 0;
  const noiTrend = hasYoyData ? arrowDirection(noiThisMonth - lastYearNoi, 0) : null;

  // --- Open Maintenance ---
  const openMaintenance = maintenanceRequests.filter(m => m.status === 'open');
  const urgentOpen = openMaintenance.filter(m => m.priority === 'urgent' || m.priority === 'high').length;
  const thirtyDaysAgo = new Date(now.getTime() - 30 * MS_PER_DAY);
  const overThirty = openMaintenance.filter(m => {
    const created = parseDate(m.created_at);
    return created && created < thirtyDaysAgo;
  }).length;
  // Sparkline: requests created each day, last 30 days. Daily volume
  // signals workload pace better than cumulative open count, which we
  // can't compute without close dates.
  const maintenanceSeries = [];
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  for (let i = 29; i >= 0; i--) {
    const dayStart = new Date(todayStart);
    dayStart.setDate(todayStart.getDate() - i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);
    const count = maintenanceRequests.filter(m => {
      const created = parseDate(m.created_at);
      return created && created >= dayStart && created < dayEnd;
    }).length;
    maintenanceSeries.push(count);
  }
  // Trend: requests created in the last 7 days vs the 7 days before that.
  const sevenDaysAgo = new Date(now.getTime() - 7 * MS_PER_DAY);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * MS_PER_DAY);
  const inflowThisWeek = maintenanceRequests.filter(m => {
    const created = parseDate(m.created_at);
    return created && created >= sevenDaysAgo;
  }).length;
  const inflowLastWeek = maintenanceRequests.filter(m => {
    const created = parseDate(m.created_at);
    return created && created >= fourteenDaysAgo && created < sevenDaysAgo;
  }).length;
  // More inflow is bad news. The MainDashboard renders this card with
  // KPICard's invert=true so an up arrow reads red, down reads green.
  const maintenanceTrend = arrowDirection(inflowThisWeek - inflowLastWeek, 0);

  return {
    collection: {
      value: Math.round(collectionSnap.rate) + '%',
      subLine: '$' + Math.round(collectionSnap.collected).toLocaleString() + ' of $' + Math.round(collectionSnap.expected).toLocaleString() + ' expected',
      band: collectionBand(collectionSnap.rate),
      series: collectionSeries,
      trend: collectionTrend ? { direction: collectionTrend, label: 'vs last month' } : null
    },
    occupancy: {
      value: Math.round(occupancyRate) + '%',
      subLine: activeNow + ' of ' + totalUnits + ' units occupied',
      band: occupancyBand(occupancyRate),
      series: occupancySeries,
      trend: occupancyTrend ? { direction: occupancyTrend, label: 'vs last month' } : null
    },
    noi: {
      value: formatNoi(noiThisMonth),
      subLine: hasYoyData
        ? 'vs ' + formatNoi(lastYearNoi) + ' same month last year'
        : 'Limited prior-year data',
      band: null,
      series: noiSeries,
      trend: noiTrend ? { direction: noiTrend, label: 'YoY' } : null
    },
    openMaintenance: {
      value: String(openMaintenance.length),
      subLine: urgentOpen + ' urgent, ' + overThirty + ' over 30 days',
      band: null,
      series: maintenanceSeries,
      trend: maintenanceTrend ? { direction: maintenanceTrend, label: 'vs last week' } : null
    }
  };
}

function formatNoi(value) {
  const v = Math.round(value || 0);
  const sign = v < 0 ? '-' : '';
  const abs = Math.abs(v);
  if (abs >= 1000000) return sign + '$' + (abs / 1000000).toFixed(1) + 'M';
  if (abs >= 1000) return sign + '$' + Math.round(abs / 1000) + 'K';
  return sign + '$' + abs.toLocaleString();
}
