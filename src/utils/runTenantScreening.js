import { supabase } from '../supabase';

export async function runTenantScreening(applicationId) {
  const session = (await supabase.auth.getSession()).data.session;
  
  const response = await fetch(
    'https://unexucxndxzsqbcqsbyo.supabase.co/functions/v1/screen-tenant',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ applicationId })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Screening failed');
  }

  return await response.json();
}

export default runTenantScreening;
