// Centralized "wipe everything for this user" helper, shared by the manual
// Clear All Data button in Settings and the 500-door generator's pre-load
// reset.
//
// Only targets tables with a direct user-scoping column (user_id, or
// added_by for record_tags). Tables without a direct user_id column
// (inspection_checklists, checklist_items, checklist_photos,
// application_documents, rental_references) are skipped on purpose -
// they're either unused by the demo or handled via FK cascade from their
// parent rows.
//
// Per-table errors are logged with the table name and re-thrown so a
// silent failure can't pile up duplicate data. Tables that don't exist
// in the user's project, or columns that don't exist on a table, are
// treated as soft-skips rather than hard failures.

const SOFT_FAIL_CODES = new Set([
  '42P01', // relation does not exist
  '42703', // column does not exist
  'PGRST205' // PostgREST schema cache miss for the table
]);

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

  // screening_results has no user_id - scope through tenant_applications.
  const applicationIds = await collectIds(supabase, 'tenant_applications', 'id', 'user_id', userId);
  if (applicationIds.length > 0) {
    await runDelete(supabase, 'screening_results', q => q.in('application_id', applicationIds));
  }

  // Applications. tenant_applications has user_id directly.
  await runDelete(supabase, 'tenant_applications', q => q.eq('user_id', userId));

  // User-scoped child tables. Each is best-effort: if the table or column
  // doesn't exist in this project, we log and move on.
  await runDelete(supabase, 'maintenance_requests', q => q.eq('user_id', userId));
  await runDelete(supabase, 'sms_messages', q => q.eq('user_id', userId));
  await runDelete(supabase, 'payment_requests', q => q.eq('user_id', userId));
  await runDelete(supabase, 'record_tags', q => q.eq('added_by', userId));
  await runDelete(supabase, 'files', q => q.eq('user_id', userId));

  // Owner-side junction. owner_properties has no user_id, so scope through
  // the owners we're about to delete.
  const ownerIds = await collectIds(supabase, 'owners', 'id', 'user_id', userId);
  if (ownerIds.length > 0) {
    await runDelete(supabase, 'owner_properties', q => q.in('owner_id', ownerIds));
  }

  // Parents last. Tenants before properties because tenants.property_id
  // references properties(id).
  await runDelete(supabase, 'tenants', q => q.eq('user_id', userId));
  await runDelete(supabase, 'properties', q => q.eq('user_id', userId));
  await runDelete(supabase, 'owners', q => q.eq('user_id', userId));

  console.log('[clearAll] wipe complete');
}

// Idempotency guard for the demo loader. Throws with a clear message if the
// user still has bulk data left over; prevents accidental double-loads.
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
