// Demo 500-door portfolio generator.
//
// Orchestrates inserts in dependency order: owners -> properties ->
// tenants -> maintenance -> applications + screening results.
// Returns a summary object with counts of each entity created.

import { buildOwnerRows } from './owners.js';
import { buildPropertyRows, stripInternal as stripPropertyInternals } from './properties.js';
import { buildTenantRows } from './tenants.js';
import { buildMaintenanceRows } from './maintenance.js';
import { buildApplicationRows, buildScreeningResults } from './applications.js';

const CHUNK = 100;

async function insertInChunks(supabase, table, rows, { returning = true } = {}) {
  const inserted = [];
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    const query = supabase.from(table).insert(slice);
    const { data, error } = returning ? await query.select() : await query;
    if (error) {
      console.error(`[demo500] Insert into ${table} FAILED at chunk starting index ${i}`);
      console.error('[demo500] Supabase error:', JSON.stringify(error, null, 2));
      console.error('[demo500] First failing row payload (keys + types):',
        Object.entries(slice[0]).map(([k, v]) => `${k}: ${typeof v}${v === null ? ' (null)' : v && typeof v === 'object' ? ` [${Array.isArray(v) ? 'array' : 'object'}]` : ` = ${JSON.stringify(v).slice(0, 60)}`}`).join('\n  ')
      );
      console.error('[demo500] First failing row (full):', JSON.stringify(slice[0], null, 2));
      throw new Error(`Insert into ${table} failed: ${error.message} (details: ${error.details || 'none'}, hint: ${error.hint || 'none'})`);
    }
    if (data) inserted.push(...data);
    console.log(`[demo500] ${table}: inserted ${Math.min(i + CHUNK, rows.length)} / ${rows.length}`);
  }
  return inserted;
}

async function clearExistingData(supabase, userId) {
  console.log('[demo500] Clearing existing data for user');
  // Delete screening_results, rental_references, application_documents first
  // since they reference tenant_applications by application_id.
  const { data: appsForUser } = await supabase
    .from('tenant_applications')
    .select('id')
    .eq('user_id', userId);
  const appIds = (appsForUser || []).map(a => a.id);
  if (appIds.length > 0) {
    await supabase.from('screening_results').delete().in('application_id', appIds);
    await supabase.from('application_documents').delete().in('application_id', appIds);
    await supabase.from('rental_references').delete().in('application_id', appIds);
  }
  await supabase.from('tenant_applications').delete().eq('user_id', userId);
  await supabase.from('sms_messages').delete().eq('user_id', userId);
  await supabase.from('maintenance_requests').delete().eq('user_id', userId);
  // owner_properties cascades from owners or properties deletion, but delete
  // explicitly first so it never blocks parent deletes for any reason.
  const { data: ownerIdsForUser } = await supabase
    .from('owners')
    .select('id')
    .eq('user_id', userId);
  const ownerIdList = (ownerIdsForUser || []).map(o => o.id);
  if (ownerIdList.length > 0) {
    await supabase.from('owner_properties').delete().in('owner_id', ownerIdList);
  }
  await supabase.from('tenants').delete().eq('user_id', userId);
  await supabase.from('properties').delete().eq('user_id', userId);
  await supabase.from('owners').delete().eq('user_id', userId);
}

export async function generateDemo500Portfolio(supabase, userId) {
  if (!userId) throw new Error('generateDemo500Portfolio requires userId');
  const summary = {
    owners: 0,
    properties: 0,
    tenants: 0,
    maintenance: 0,
    applications: 0,
    screeningResults: 0
  };

  const startedAt = Date.now();
  console.log('[demo500] Starting generation');

  await clearExistingData(supabase, userId);

  // 1. Owners.
  const ownerRows = buildOwnerRows(userId, 40);
  const insertedOwners = await insertInChunks(supabase, 'owners', ownerRows);
  summary.owners = insertedOwners.length;

  // 2. Properties. Keep an in-memory copy with __baseRent, __rentRange, and
  // __ownerId for downstream linking. Strip those before insert.
  const propertyRowsRich = buildPropertyRows(userId, insertedOwners);
  const propertyRowsForInsert = propertyRowsRich.map(stripPropertyInternals);
  const insertedProps = await insertInChunks(supabase, 'properties', propertyRowsForInsert);
  summary.properties = insertedProps.length;

  // Stitch DB-generated ids back into the rich rows by position. Supabase
  // returns inserted rows in the same order as the request payload within
  // each chunk, and insertInChunks concatenates chunks in order.
  if (insertedProps.length !== propertyRowsRich.length) {
    console.warn(`[demo500] Property insert returned ${insertedProps.length} rows, expected ${propertyRowsRich.length}`);
  }
  propertyRowsRich.forEach((rich, idx) => {
    const inserted = insertedProps[idx];
    rich.__insertedId = inserted ? inserted.id : null;
  });
  // Log a sample so we can verify id type is BIGINT (number/digit-string), not UUID.
  if (insertedProps[0]) {
    console.log(`[demo500] First inserted property id: ${JSON.stringify(insertedProps[0].id)} (type: ${typeof insertedProps[0].id})`);
  }

  // 2b. Owner-property junction so the Owners tab can resolve owner -> properties.
  // owner_properties: owner_id UUID, property_id BIGINT, ownership_percentage DECIMAL.
  const junctionRows = propertyRowsRich
    .filter(p => p.__insertedId && p.__ownerId)
    .map(p => ({
      owner_id: p.__ownerId,
      property_id: p.__insertedId,
      ownership_percentage: 100
    }));
  if (junctionRows.length > 0) {
    await insertInChunks(supabase, 'owner_properties', junctionRows, { returning: false });
    console.log(`[demo500] owner_properties: inserted ${junctionRows.length} links`);
  }

  // 3. Tenants. Build rows that reference property indexes, then patch them
  // with the real DB ids before insert.
  const { tenantRows, occupiedCounts, revenuePer } = buildTenantRows(userId, propertyRowsRich, 650);

  // Patch property_id + property string + back-reference for maintenance later.
  const tenantsForInsert = tenantRows.map(t => {
    const propertyIndex = t.__propertyIndex;
    const propRich = propertyIndex != null ? propertyRowsRich[propertyIndex] : null;
    const propertyId = propRich ? propRich.__insertedId : null;
    const { __propertyIndex, ...rest } = t;
    return { ...rest, property_id: propertyId };
  });

  const insertedTenants = await insertInChunks(supabase, 'tenants', tenantsForInsert);
  summary.tenants = insertedTenants.length;

  // Correlate by position since Supabase preserves insert order within and across chunks.
  if (insertedTenants.length !== tenantsForInsert.length) {
    console.warn(`[demo500] Tenant insert returned ${insertedTenants.length} rows, expected ${tenantsForInsert.length}`);
  }
  const tenantsWithIds = tenantsForInsert.map((t, idx) => ({
    ...t,
    __insertedId: insertedTenants[idx] ? insertedTenants[idx].id : null
  }));
  if (insertedTenants[0]) {
    console.log(`[demo500] First inserted tenant id: ${JSON.stringify(insertedTenants[0].id)} (type: ${typeof insertedTenants[0].id})`);
  }

  // 4. Update properties with occupied/monthly_revenue based on tenant placement.
  console.log('[demo500] Updating property occupancy and revenue');
  for (let i = 0; i < propertyRowsRich.length; i++) {
    const propertyId = propertyRowsRich[i].__insertedId;
    if (!propertyId) continue;
    const occupied = occupiedCounts[i] || 0;
    const monthly = revenuePer[i] || 0;
    if (occupied === 0 && monthly === 0) continue;
    const { error } = await supabase
      .from('properties')
      .update({ occupied, monthly_revenue: monthly })
      .eq('id', propertyId);
    if (error) console.warn(`[demo500] Failed to update property ${propertyId}: ${error.message}`);
  }

  // 5. Maintenance.
  const maintenanceRows = buildMaintenanceRows(userId, tenantsWithIds, 150);
  const insertedMaintenance = await insertInChunks(supabase, 'maintenance_requests', maintenanceRows, { returning: false });
  // returning=false leaves insertedMaintenance empty; count from source rows.
  summary.maintenance = maintenanceRows.length;
  void insertedMaintenance;

  // 6. Tenant applications + screening results.
  const applicationRows = buildApplicationRows(userId, propertyRowsRich, 20);
  const insertedApplications = await insertInChunks(supabase, 'tenant_applications', applicationRows);
  summary.applications = insertedApplications.length;

  const screeningRows = buildScreeningResults(insertedApplications.map(a => a.id), 4);
  if (screeningRows.length > 0) {
    const { error: screeningErr } = await supabase.from('screening_results').insert(screeningRows);
    if (screeningErr) {
      console.warn('[demo500] Screening results insert failed:', screeningErr.message);
    } else {
      summary.screeningResults = screeningRows.length;
    }
  }

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`[demo500] Done in ${elapsed}s`, summary);
  return summary;
}
