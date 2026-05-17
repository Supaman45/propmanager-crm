import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase.js';
import {
  totalsByMonth,
  computeCollection,
  computeOccupancyAt,
  computeExpensesForMonth,
  computeAverageDaysVacant,
  buildActivityFeed,
  summarizeOccupancyByType,
  computeActions
} from './dashboardMetrics.js';

// Health Dashboard data hook. Fetches the four core tables in parallel and
// derives every metric the dashboard renders. All math lives in
// dashboardMetrics.js so this file stays focused on fetching + assembly.

export function useHealthDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const [tenantsRes, propertiesRes, maintenanceRes, applicationsRes] = await Promise.all([
        supabase.from('tenants').select('*').eq('user_id', user.id),
        supabase.from('properties').select('*').eq('user_id', user.id),
        supabase.from('maintenance_requests').select('*').eq('user_id', user.id),
        supabase.from('tenant_applications').select('*').eq('user_id', user.id)
      ]);

      if (tenantsRes.error) throw tenantsRes.error;
      if (propertiesRes.error) throw propertiesRes.error;
      if (maintenanceRes.error) throw maintenanceRes.error;
      if (applicationsRes.error) throw applicationsRes.error;

      const tenants = tenantsRes.data || [];
      const properties = propertiesRes.data || [];
      const maintenanceRequests = maintenanceRes.data || [];
      const applications = applicationsRes.data || [];

      const now = new Date();
      const months = totalsByMonth(now, 6);

      const collectionSeries = months.map(m => computeCollection(tenants, m.year, m.monthIndex).rate);
      const occupancySeries = months.map(m => computeOccupancyAt(tenants, properties, new Date(m.year, m.monthIndex + 1, 0)));
      const expenseSeries = months.map(m => computeExpensesForMonth(properties, m.year, m.monthIndex));
      const revenueSeries = months.map(m => computeCollection(tenants, m.year, m.monthIndex).collected);
      const noiSeries = revenueSeries.map((rev, i) => rev - expenseSeries[i]);

      const thisMonth = months[months.length - 1];
      const lastMonth = months[months.length - 2] || thisMonth;
      const collectionThis = computeCollection(tenants, thisMonth.year, thisMonth.monthIndex);
      const collectionLast = computeCollection(tenants, lastMonth.year, lastMonth.monthIndex);
      const noiThis = noiSeries[noiSeries.length - 1];
      const noiLast = noiSeries[noiSeries.length - 2] || 0;

      const totalUnits = properties.reduce((sum, p) => sum + (p.units || 0), 0);
      const totalOccupied = tenants.filter(t => t.status === 'current' || t.status === 'late').length;
      const occupancyRate = totalUnits > 0 ? (totalOccupied / totalUnits) * 100 : 0;

      const vacancy = computeAverageDaysVacant(tenants, now);

      const twelveMonths = totalsByMonth(now, 12);
      const revenueVsExpenses = twelveMonths.map(m => ({
        month: new Date(m.year, m.monthIndex, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        revenue: computeCollection(tenants, m.year, m.monthIndex).collected,
        expenses: computeExpensesForMonth(properties, m.year, m.monthIndex)
      }));

      const occupancyByType = summarizeOccupancyByType(tenants, properties);
      const actions = computeActions(tenants, maintenanceRequests, properties, now);
      const activity = buildActivityFeed(tenants, maintenanceRequests, applications, 10);

      setData({
        counts: {
          properties: properties.length,
          tenants: tenants.length,
          totalUnits,
          totalOccupied
        },
        collection: {
          rate: collectionThis.rate,
          collected: collectionThis.collected,
          expected: collectionThis.expected,
          deltaPercent: Math.round(collectionThis.rate - collectionLast.rate),
          series: collectionSeries
        },
        occupancy: {
          rate: occupancyRate,
          occupied: totalOccupied,
          units: totalUnits,
          series: occupancySeries
        },
        noi: {
          current: noiThis,
          previous: noiLast,
          series: noiSeries
        },
        vacancy: {
          days: vacancy.days,
          turnedCount: vacancy.turnedCount,
          series: months.map(() => vacancy.days)
        },
        revenueVsExpenses,
        occupancyByType,
        actions,
        activity
      });
    } catch (err) {
      console.error('[useHealthDashboard]', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { loading, error, data, refresh };
}
