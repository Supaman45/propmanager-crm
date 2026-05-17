// Centralized "wipe everything for this user" helper, shared by the manual
// Clear All Data button in Settings and the 500-door generator's pre-load
// reset.
//
// Child tables (sms_messages, maintenance_requests, payment_requests) are
// cleared by FK rather than by user_id because rows inserted by Edge
// Functions / webhooks using the service role can land with a null user_id
// but a valid tenant_id. Filtering by user_id alone leaves those orphans
// behind and they then block the tenant delete via FK constraints.
//
// Per-table errors are logged with the table name and re-thrown so a
// silent failure can't pile up duplicate data. Tables or columns that
// don't exist in the user's project are treated as soft-skips.

const SOFT_FAIL_CODES = new Set([
  '42P01', // relation does not exist
  '42703', // column does not exist
  'PGRST205' // PostgREST schema cache miss
]);

const ID_CHUNK = 200;

async function runDelete(supabase, table, applyFilter) {
  let query = supabase.from(table).delete();
  query = applyFilter(query);
  const { error } = await query;
  if (error) {
    if (SOFT_FAIL_CODES.has(error.code)) {
      console.log(`[clearAll] ${table}: skipped (${error.code} - ${error.message})`);
      return { ok: true, skipped: true };
    }
    console.error(`[clearAll] DELETE ${table} FAILED:`, JSON.stringify(error, null, 2));
    throw new Error(`Failed to clear ${table}: ${error.message}${error.hint ? ` (hint: ${error.hint})` : ''}`);
  }
  console.log(`[clearAll] cleared ${table}`);
  return { ok: true };
}

async function runDeleteByIds(supabase, table, column, ids) {
  if (!ids || ids.length === 0) return;
  for (let i = 0; i < ids.length; i += ID_CHUNK) {
    const slice = ids.slice(i, i + ID_CHUNK);
    await runDelete(supabase, table, q => q.in(column, slice));
  }
}

async function collectIds(supabase, table, column, filterColumn, filterValue) {
  const { data, error } = await supabase
    .from(table)
    .select(column)
    .eq(filterColumn, filterValue);
  if (error) {
    if (SOFT_FAIL_CODES.has(error.code)) return [];
    console.warn(`[clearAll] could not enumerate ${table}.${column}:`, error.message);
    return [];
  }
  return (data || []).map(row => row[column]).filter(v => v != null);
}

export async function clearAllUserData(supabase, userId) {
  if (!userId) throw new Error('clearAllUserData requires userId');
  console.log('[clearAll] starting wipe for user', userId);

  // Pre-collect FK id lists from the parent tables we trust (user_id-scoped).
  const tenantIds = await collectIds(supabase, 'tenants', 'id', 'user_id', userId);
  const propertyIds = await collectIds(supabase, 'properties', 'id', 'user_id', userId);
  const applicationIds = await collectIds(supabase, 'tenant_applications', 'id', 'user_id', userId);
  const ownerIds = await collectIds(supabase, 'owners', 'id', 'user_id', userId);

  // Application children. screening_results has no user_id - scope via app_id.
  if (applicationIds.length > 0) {
    await runDeleteByIds(supabase, 'screening_results', 'application_id', applicationIds);
  }

  // Applications. Clear by user_id AND by property_id to catch any rows a
  // webhook or import might have inserted with a null user_id.
  await runDelete(supabase, 'tenant_applications', q => q.eq('user_id', userId));
  await runDeleteByIds(supabase, 'tenant_applications', 'property_id', propertyIds);

  // Tenant-scoped child tables. Clear by tenant_id IN first (catches
  // webhook-inserted rows that have no user_id) then by user_id (catches
  // user-created rows that have no tenant_id, like manual maintenance).
  await runDeleteByIds(supabase, 'sms_messages', 'tenant_id', tenantIds);
  await runDelete(supabase, 'sms_messages', q => q.eq('user_id', userId));

  await runDeleteByIds(supabase, 'payment_requests', 'tenant_id', tenantIds);
  await runDelete(supabase, 'payment_requests', q => q.eq('user_id', userId));

  await runDeleteByIds(supabase, 'maintenance_requests', 'tenant_id', tenantIds);
  await runDelete(supabase, 'maintenance_requests', q => q.eq('user_id', userId));

  // User-scoped only.
  await runDelete(supabase, 'record_tags', q => q.eq('added_by', userId));
  await runDelete(supabase, 'files', q => q.eq('user_id', userId));

  // Owner-side junction.
  if (ownerIds.length > 0) {
    await runDeleteByIds(supabase, 'owner_properties', 'owner_id', ownerIds);
  }

  // Parents last. Tenants before properties because tenants.property_id
  // references properties(id).
  await runDelete(supabase, 'tenants', q => q.eq('user_id', userId));
  await runDelete(supabase, 'properties', q => q.eq('user_id', userId));
  await runDelete(supabase, 'owners', q => q.eq('user_id', userId));

  console.log('[clearAll] wipe complete');
}

// Idempotency guard for the demo loader. Throws with a clear message if
// the user still has bulk data left over; prevents accidental double-loads.
export async function assertEmpty(supabase, userId, { threshold = 50 } = {}) {
  const { count, error } = await supabase
    .from('properties')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (error) {
    console.warn('[assertEmpty] could not check property count:', error.message);
    return;
  }
  if ((count || 0) > threshold) {
    throw new Error(`You already have ${count} properties. Run Clear All Data first before loading the demo portfolio.`);
  }
}
