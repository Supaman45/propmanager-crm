// Maintenance request generation.
// Columns referenced on maintenance_requests: user_id, tenant_id, tenant_name,
// property, issue, priority, status, date, description, source.

const ISSUE_LIBRARY = [
  { title: 'Kitchen faucet dripping', description: 'Slow drip from kitchen faucet, washer likely needs replacement.', priority: 'low' },
  { title: 'Garbage disposal jammed', description: 'Disposal hums but does not spin, reset button is unresponsive.', priority: 'medium' },
  { title: 'Bathroom exhaust fan noisy', description: 'Fan makes grinding noise when running, still functional but loud.', priority: 'low' },
  { title: 'Toilet constantly running', description: 'Main bathroom toilet runs continuously, possible flapper issue.', priority: 'medium' },
  { title: 'Furnace not heating properly', description: 'Furnace cycles on but does not reach set temperature.', priority: 'high' },
  { title: 'No hot water', description: 'Tenant reports complete loss of hot water since last night.', priority: 'urgent' },
  { title: 'AC not cooling', description: 'AC running but blowing warm air, possible refrigerant issue.', priority: 'high' },
  { title: 'Refrigerator not cooling', description: 'Fridge interior at room temperature, food spoiling.', priority: 'high' },
  { title: 'Dishwasher not draining', description: 'Standing water remains in dishwasher after cycle completes.', priority: 'medium' },
  { title: 'Smoke detector chirping', description: 'Hardwired smoke detector chirps continuously even after battery swap.', priority: 'urgent' },
  { title: 'Front door lock sticking', description: 'Deadbolt requires excessive force, possible security concern.', priority: 'medium' },
  { title: 'Garage door opener malfunction', description: 'Remote works intermittently, door reverses mid close.', priority: 'medium' },
  { title: 'Window seal broken', description: 'Living room window has visible gap, cold air infiltrating.', priority: 'high' },
  { title: 'Ceiling stain spreading', description: 'Brown stain on bedroom ceiling appears to be growing.', priority: 'high' },
  { title: 'Bathroom sink leak', description: 'Water pooling under sink, supply line connection suspect.', priority: 'medium' },
  { title: 'Closet door off track', description: 'Sliding closet door jumps off track when opening.', priority: 'low' },
  { title: 'Carpet stain in living room', description: 'Tenant requesting carpet cleaning for set in stain.', priority: 'low' },
  { title: 'Patio light out', description: 'Exterior patio light fixture not working, bulb already replaced.', priority: 'low' },
  { title: 'Mailbox lock broken', description: 'Mailbox lock will not turn, tenant cannot retrieve mail.', priority: 'medium' },
  { title: 'Gutter overflowing', description: 'Front gutter overflowing during rain, possible clog.', priority: 'medium' },
  { title: 'Yard maintenance needed', description: 'Lawn overgrown and shrubs need trimming.', priority: 'low' },
  { title: 'Paint touch up bedroom', description: 'Tenant requesting paint touch up after wall damage.', priority: 'low' },
  { title: 'Bedroom door will not latch', description: 'Door latch misaligned with strike plate.', priority: 'low' },
  { title: 'Water heater leak', description: 'Visible leak from base of water heater, may need replacement.', priority: 'urgent' },
  { title: 'Electrical outlet not working', description: 'Outlet in kitchen has no power, breaker not tripped.', priority: 'high' }
];

const SMS_ISSUES = [
  { title: 'AC broken', description: 'Inbound SMS, tenant reports AC not working.', priority: 'high' },
  { title: 'Water leak under sink', description: 'Inbound SMS, tenant reports leak in kitchen sink area.', priority: 'high' },
  { title: 'Heat not working', description: 'Inbound SMS, tenant reports no heat overnight.', priority: 'urgent' },
  { title: 'Door lock stuck', description: 'Inbound SMS, tenant cannot lock front door.', priority: 'medium' },
  { title: 'Toilet broken', description: 'Inbound SMS, tenant reports broken toilet handle.', priority: 'medium' }
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function dateWithinLast6Months() {
  const now = new Date();
  const daysAgo = randomInt(0, 180);
  const d = new Date(now);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function pickStatus() {
  // Distribution across the three real status values:
  // 40 percent open, 30 percent in_progress, 30 percent closed.
  const roll = Math.random();
  if (roll < 0.4) return 'open';
  if (roll < 0.7) return 'in_progress';
  return 'closed';
}

function pickPriority() {
  // Weighted toward medium with some low, high, urgent.
  const roll = Math.random();
  if (roll < 0.45) return 'medium';
  if (roll < 0.7) return 'low';
  if (roll < 0.9) return 'high';
  return 'urgent';
}

export function buildMaintenanceRows(userId, tenants, total = 150) {
  // Prefer tenants currently in a property so the request has a real linkage.
  const activeTenants = tenants.filter(t => (t.status === 'current' || t.status === 'late') && t.__insertedId);
  const rows = [];

  for (let i = 0; i < total; i++) {
    const isSms = Math.random() < 0.2;
    const pool = isSms ? SMS_ISSUES : ISSUE_LIBRARY;
    const issue = randomChoice(pool);
    const tenant = randomChoice(activeTenants);
    if (!tenant) continue;

    rows.push({
      user_id: userId,
      tenant_id: tenant.__insertedId,
      tenant_name: tenant.name,
      property: tenant.property,
      issue: issue.title,
      priority: isSms ? issue.priority : pickPriority(),
      status: pickStatus(),
      date: dateWithinLast6Months(),
      description: issue.description,
      source: isSms ? 'sms' : null
    });
  }

  return rows;
}
