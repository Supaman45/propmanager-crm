// Tenant generation. Assigns tenants to property units and produces rows ready
// for insert into the tenants table. Columns referenced: user_id, name, phone,
// email, property, property_id, unit, rent_amount, security_deposit,
// lease_start, lease_end, status, payment_status, payment_log, activity_log,
// access_code, photo, notes.

import { generatePaymentLog } from './payments.js';

const FIRST_NAMES = [
  'Amy', 'Marcus', 'Sarah', 'Daniel', 'Jessica', 'Kevin', 'Emily', 'David',
  'Rachel', 'Michael', 'Lisa', 'Samantha', 'Brian', 'Amanda', 'James',
  'Jennifer', 'Olivia', 'Ethan', 'Sophia', 'Mason', 'William', 'Isabella',
  'Alexander', 'Charlotte', 'Jordan', 'Morgan', 'Casey', 'Tyler', 'Nina',
  'Chris', 'Thomas', 'Rachel', 'Lauren', 'Robert', 'Maya', 'Devon', 'Priya',
  'Jamal', 'Aisha', 'Diego', 'Maria', 'Andre', 'Hannah', 'Tobias', 'Ines',
  'Jonas', 'Yara', 'Leo', 'Mei', 'Hiro', 'Zane'
];

const LAST_NAMES = [
  'Chen', 'Park', 'Liu', 'Nakamura', 'Okonkwo', 'Green', 'Foster', 'Tran',
  'Brooks', 'Walsh', 'Collins', 'Rodriguez', 'Kim', 'James', 'Patel', 'Anderson',
  'Wright', 'Brown', 'Davis', 'Wilson', 'Taylor', 'Harris', 'Moore', 'Lee',
  'White', 'Blake', 'Rivera', 'Nguyen', 'Hughes', 'Long', 'Johnson', 'Martinez',
  'Garcia', 'Lopez', 'Reyes', 'Patel', 'Khan', 'Ahmed', 'Ali', 'Singh',
  'Ramirez', 'Hernandez', 'Mitchell', 'Carter', 'Phillips', 'Campbell', 'Parker',
  'Edwards', 'Stewart', 'Morris'
];

const AREA_CODES = ['206', '253', '425', '360', '509', '503', '971', '564'];
const RENTER_NOTES = [
  '', '', '', // most blank
  'Quiet tenant, works from home',
  'Has 1 cat (approved)',
  'Long-term tenant',
  'Renewed for 2nd year',
  'New move-in',
  'Pays via ACH',
  'Payment plan in place',
  'Excellent rental history'
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function uniqueEmail(first, last, index) {
  const slug = `${first}.${last}`.toLowerCase().replace(/[^a-z.]/g, '');
  return `${slug}${index}@example.com`;
}

function generatePhone() {
  const area = randomChoice(AREA_CODES);
  const prefix = String(200 + Math.floor(Math.random() * 700)).padStart(3, '0');
  const line = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `${area}${prefix}${line}`;
}

function accessCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

function genderForPhoto(i) {
  return i % 2 === 0 ? 'women' : 'men';
}

function avatar(i) {
  return `https://randomuser.me/api/portraits/${genderForPhoto(i)}/${(i % 99) + 1}.jpg`;
}

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function leaseDatesFor(status) {
  const now = new Date();
  if (status === 'prospect') return { start: null, end: null };

  if (status === 'past') {
    // Ended within the last 18 months.
    const endOffset = randomInt(1, 18);
    const end = new Date(now.getFullYear(), now.getMonth() - endOffset, randomInt(1, 28));
    const start = new Date(end.getFullYear() - 1, end.getMonth(), 1);
    return { start: formatDate(start), end: formatDate(end) };
  }

  // current or late: lease that overlaps today.
  const startOffset = randomInt(1, 18);
  const termMonths = randomChoice([12, 12, 12, 18, 24]);
  const start = new Date(now.getFullYear(), now.getMonth() - startOffset, 1);
  const end = new Date(start.getFullYear(), start.getMonth() + termMonths, 0);
  return { start: formatDate(start), end: formatDate(end) };
}

function rentForUnit(property) {
  const [low, high] = property.__rentRange;
  // Cluster around base rent with some variation.
  const base = property.__baseRent;
  const jitter = randomInt(-150, 150);
  return Math.max(low, Math.min(high, base + jitter));
}

function unitLabelFor(property, occupiedSoFar) {
  if (property.type === 'Single-family') return '';
  if (property.type === 'Duplex') return occupiedSoFar === 0 ? 'A' : 'B';
  if (property.type === 'Townhouse') return String(occupiedSoFar + 1);
  // Multi-family: floor-based numbering, units 101, 102, etc.
  const floor = Math.floor(occupiedSoFar / 4) + 1;
  const unitOnFloor = (occupiedSoFar % 4) + 1;
  return `${floor}0${unitOnFloor}`;
}

function propertyLabel(property, unit) {
  if (!unit) return property.address;
  return `${property.address}, Unit ${unit}`;
}

// Returns: { tenantRows, propertyAssignments } where propertyAssignments maps
// propertyIndex -> { occupied, monthlyRevenue }
export function buildTenantRows(userId, properties, totalTenants = 650) {
  const distribution = {
    current: Math.round(totalTenants * 0.6),
    late: Math.round(totalTenants * 0.15),
    past: Math.round(totalTenants * 0.15),
    prospect: totalTenants - Math.round(totalTenants * 0.6)
      - Math.round(totalTenants * 0.15)
      - Math.round(totalTenants * 0.15)
  };

  // Flatten property capacity into slots (one per unit) for active placement.
  // Each slot tracks the property index so we can update occupied/revenue.
  const activeSlots = [];
  properties.forEach((p, propertyIndex) => {
    for (let u = 0; u < p.units; u++) {
      activeSlots.push({ propertyIndex, unitIndex: u });
    }
  });
  // Shuffle slots so placement spreads across properties and cities.
  for (let i = activeSlots.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [activeSlots[i], activeSlots[j]] = [activeSlots[j], activeSlots[i]];
  }

  const occupiedCounts = new Array(properties.length).fill(0);
  const revenuePer = new Array(properties.length).fill(0);
  const rows = [];

  const buildOne = (status, slotOrNull, index) => {
    const first = randomChoice(FIRST_NAMES);
    const last = randomChoice(LAST_NAMES);
    const name = `${first} ${last}`;
    const email = uniqueEmail(first, last, index);
    const phone = generatePhone();
    const photo = avatar(index);
    const { start, end } = leaseDatesFor(status);

    let property = null;
    let unit = '';
    let propertyAddress = '';
    let propertyId = null;
    let rent = 0;

    if (slotOrNull) {
      property = properties[slotOrNull.propertyIndex];
      unit = unitLabelFor(property, occupiedCounts[slotOrNull.propertyIndex]);
      propertyAddress = property.address;
      propertyId = property.__insertedId || null; // filled after property insert
      rent = rentForUnit(property);
    } else if (status === 'past') {
      // Past tenants reference a property they previously lived in.
      const fallback = properties[Math.floor(Math.random() * properties.length)];
      property = fallback;
      unit = unitLabelFor(fallback, 0);
      propertyAddress = fallback.address;
      propertyId = fallback.__insertedId || null;
      rent = rentForUnit(fallback);
    }

    const paymentLog = generatePaymentLog(rent, status);
    const paymentStatus = status === 'late'
      ? 'late'
      : status === 'current' ? 'paid' : 'n/a';

    const paymentDate = paymentLog.length > 0
      ? paymentLog[paymentLog.length - 1].date
      : null;

    return {
      user_id: userId,
      name,
      phone,
      email,
      property: status === 'prospect' ? null : propertyLabel(property, unit),
      // property_id gets backfilled once we know the real DB id.
      __propertyIndex: status === 'prospect' ? null : (slotOrNull ? slotOrNull.propertyIndex : null),
      unit: unit || null,
      rent_amount: status === 'prospect' ? 0 : rent,
      security_deposit: status === 'prospect' ? 0 : rent,
      lease_start: start,
      lease_end: end,
      status,
      payment_status: paymentStatus,
      payment_date: paymentDate,
      payment_log: paymentLog,
      activity_log: paymentLog.length > 0
        ? [{ type: 'note', date: start, note: 'Lease signed and move-in completed' }]
        : [],
      audit_log: [],
      lease_documents: [],
      notes: randomChoice(RENTER_NOTES),
      move_in_date: start,
      move_in_notes: null,
      move_out_date: status === 'past' ? end : null,
      move_out_notes: status === 'past' ? 'Lease ended, unit turned over' : null,
      deposit_deductions: [],
      deposit_refund_amount: null,
      refund_status: 'pending',
      access_code: accessCode(),
      photo
    };
  };

  let index = 0;

  // Place current tenants first into shuffled slots.
  for (let i = 0; i < distribution.current && activeSlots.length > 0; i++) {
    const slot = activeSlots.pop();
    const row = buildOne('current', slot, index++);
    occupiedCounts[slot.propertyIndex] += 1;
    revenuePer[slot.propertyIndex] += row.rent_amount;
    rows.push(row);
  }

  // Late tenants also occupy active slots.
  for (let i = 0; i < distribution.late && activeSlots.length > 0; i++) {
    const slot = activeSlots.pop();
    const row = buildOne('late', slot, index++);
    occupiedCounts[slot.propertyIndex] += 1;
    revenuePer[slot.propertyIndex] += row.rent_amount;
    rows.push(row);
  }

  // Past tenants reference a property but don't take a slot.
  for (let i = 0; i < distribution.past; i++) {
    rows.push(buildOne('past', null, index++));
  }

  // Prospects have no property.
  for (let i = 0; i < distribution.prospect; i++) {
    rows.push(buildOne('prospect', null, index++));
  }

  return { tenantRows: rows, occupiedCounts, revenuePer };
}
