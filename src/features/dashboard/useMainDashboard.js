import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase.js';
import { computeMostImportantItem } from './mainDashboardMetrics.js';

// Main Dashboard data hook. Mirrors useHealthDashboard's fetch shape so
// the two pages can coexist without leaking concerns. Returns raw lists
// for further computation by subsequent commits (KPI strip, due dates,
// YoY charts, action items, activity feed).
//
// Phase 9 refactor candidate: extract a shared usePortfolioData base hook
// that both this and useHealthDashboard build on. See REFACTOR-FINDINGS.md.

export function useMainDashboard() {
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

      const raw = {
        tenants: tenantsRes.data || [],
        properties: propertiesRes.data || [],
        maintenanceRequests: maintenanceRes.data || [],
        applications: applicationsRes.data || []
      };

      setData({
        ...raw,
        mostImportantItem: computeMostImportantItem(raw, new Date())
      });
    } catch (err) {
      console.error('[useMainDashboard]', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { loading, error, data, refresh };
}
