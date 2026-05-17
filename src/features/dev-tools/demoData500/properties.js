// Property generation for the 500-door demo portfolio.
// Properties table columns referenced: user_id, name, address, units, type,
// occupied, monthly_revenue, photo_url, expenses (JSONB), owner_id.

// City weights tilted toward Tacoma and Puyallup per the prospect operator.
const CITY_WEIGHTS = [
  { city: 'Tacoma', state: 'WA', zip: '98402', weight: 22 },
  { city: 'Puyallup', state: 'WA', zip: '98371', weight: 18 },
  { city: 'Seattle', state: 'WA', zip: '98101', weight: 12 },
  { city: 'Bellevue', state: 'WA', zip: '98004', weight: 6 },
  { city: 'Renton', state: 'WA', zip: '98055', weight: 8 },
  { city: 'Kent', state: 'WA', zip: '98030', weight: 8 },
  { city: 'Federal Way', state: 'WA', zip: '98003', weight: 7 },
  { city: 'Auburn', state: 'WA', zip: '98002', weight: 7 },
  { city: 'Olympia', state: 'WA', zip: '98501', weight: 7 },
  { city: 'Spokane', state: 'WA', zip: '99201', weight: 5 }
];

const STREET_NAMES = [
  'Pacific Ave', 'Yakima Ave', 'South Tacoma Way', 'River Rd', 'Meridian St',
  'Pioneer Way', 'Sound View Dr', 'Cascade Dr', 'Rainier Ave', 'Cedar Ln',
  'Maple St', 'Oak Park Dr', 'Elm Ct', 'Pine Ridge Rd', 'Sunrise Blvd',
  'Mountain View Dr', 'Lakewood Ave', 'Hillside Ter', 'Birch Ln', 'Spruce Way',
  'Harbor View Dr', 'Sound Crest Rd', 'Olympic Way', 'Forest Park Ave'
];

const PROPERTY_PHOTOS = {
  'Single-family': [
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
    'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&q=80',
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80',
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80'
  ],
  'Multi-family': [
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
    'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&q=80',
    'https://images.unsplash.com/photo-1460317442991-0ec209397118?w=800&q=80',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80'
  ],
  'Townhouse': [
    'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&q=80',
    'https://images.unsplash.com/photo-1448630360428-65456885c650?w=800&q=80'
  ],
  'Duplex': [
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80'
  ]
};

const RENT_RANGES = {
  'Single-family': [1800, 3500],
  'Multi-family': [1200, 2400],
  'Townhouse': [2000, 3200],
  'Duplex': [1500, 2600]
};

function randomChoice(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function weightedCity() {
  const totalWeight = CITY_WEIGHTS.reduce((sum, c) => sum + c.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const entry of CITY_WEIGHTS) {
    roll -= entry.weight;
    if (roll <= 0) return entry;
  }
  return CITY_WEIGHTS[0];
}

function dateFor(year, monthIndex, day) {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Realistic Pierce County WA expense profile per property type.
// Property tax is biannual (April + October per WA convention), insurance and
// HOA are monthly recurring, utilities depend on who pays, maintenance and
// repairs are occasional, landscaping is seasonal. Amounts calibrated against
// market norms for the area, not random spike data.
function generateExpenses(type, units) {
  const expenses = [];
  const now = new Date();

  const hasHOA = type === 'Townhouse'
    ? Math.random() < 0.7
    : type === 'Multi-family'
      ? Math.random() < 0.2
      : Math.random() < 0.25;

  const landlordPaysUtilities = type === 'Multi-family'
    ? Math.random() < 0.7
    : Math.random() < 0.15;

  const annualPropertyTax = (() => {
    if (type === 'Multi-family') return randomInt(8000, 14000) + units * 1200;
    if (type === 'Single-family') return randomInt(3500, 6000);
    if (type === 'Townhouse') return randomInt(2500, 4500);
    return randomInt(4500, 7500); // Duplex
  })();
  const taxPaymentAmount = Math.round(annualPropertyTax / 2);

  const baseInsurance = (() => {
    if (type === 'Multi-family') return randomInt(180, 320) + units * 20;
    if (type === 'Single-family') return randomInt(80, 140);
    if (type === 'Townhouse') return randomInt(60, 110);
    return randomInt(100, 170); // Duplex
  })();

  const baseHOA = randomInt(150, 380);

  for (let monthsAgo = 11; monthsAgo >= 0; monthsAgo--) {
    const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
    const year = d.getFullYear();
    const monthIndex = d.getMonth();
    const monthLabel = d.toLocaleDateString('en-US', { month: 'short' });

    // Insurance: monthly recurring, small variation around base.
    expenses.push({
      description: `Insurance ${monthLabel}`,
      amount: Math.max(50, baseInsurance + randomInt(-15, 15)),
      date: dateFor(year, monthIndex, randomInt(1, 5)),
      category: 'insurance'
    });

    // HOA: monthly when applicable.
    if (hasHOA) {
      expenses.push({
        description: `HOA ${monthLabel}`,
        amount: Math.max(80, baseHOA + randomInt(-25, 25)),
        date: dateFor(year, monthIndex, randomInt(1, 7)),
        category: 'hoa'
      });
    }

    // Utilities: small recurring when landlord pays.
    if (landlordPaysUtilities && Math.random() < 0.85) {
      const utilAmount = type === 'Multi-family'
        ? randomInt(80, 200) + units * 10
        : randomInt(40, 120);
      expenses.push({
        description: `Utilities ${monthLabel}`,
        amount: utilAmount,
        date: dateFor(year, monthIndex, randomInt(10, 20)),
        category: 'utilities'
      });
    }

    // Maintenance: routine, ~40 percent of months.
    if (Math.random() < 0.4) {
      const mAmount = type === 'Multi-family'
        ? randomInt(150, 350)
        : randomInt(70, 220);
      expenses.push({
        description: `Maintenance ${monthLabel}`,
        amount: mAmount,
        date: dateFor(year, monthIndex, randomInt(5, 25)),
        category: 'maintenance'
      });
    }

    // Repairs: occasional spikes, ~18 percent of months.
    if (Math.random() < 0.18) {
      const rAmount = type === 'Multi-family'
        ? randomInt(250, 1400)
        : randomInt(120, 850);
      expenses.push({
        description: `Repair ${monthLabel}`,
        amount: rAmount,
        date: dateFor(year, monthIndex, randomInt(5, 25)),
        category: 'repairs'
      });
    }

    // Landscaping: seasonal cadence Apr-Oct heavier, Nov-Mar lighter.
    const growingSeason = monthIndex >= 3 && monthIndex <= 9;
    const landscapingChance = type === 'Multi-family'
      ? (growingSeason ? 0.6 : 0.2)
      : (growingSeason ? 0.5 : 0.15);
    if (Math.random() < landscapingChance) {
      const lAmount = type === 'Multi-family'
        ? randomInt(150, 360)
        : randomInt(70, 190);
      expenses.push({
        description: `Landscaping ${monthLabel}`,
        amount: lAmount,
        date: dateFor(year, monthIndex, randomInt(1, 28)),
        category: 'landscaping'
      });
    }

    // Property tax: biannual, April (month 3) and October (month 9).
    if (monthIndex === 3 || monthIndex === 9) {
      expenses.push({
        description: `Property tax ${monthLabel}`,
        amount: taxPaymentAmount,
        date: dateFor(year, monthIndex, randomInt(15, 28)),
        category: 'property_tax'
      });
    }
  }

  return expenses;
}

function pickTypeMix() {
  // 350 single-family + 150 split across multi-family, townhouse, duplex.
  // Multi-family count kept small so total door count stays close to property
  // count and apparent occupancy looks healthy in the Reports tab.
  const types = [];
  for (let i = 0; i < 350; i++) types.push('Single-family');
  for (let i = 0; i < 15; i++) types.push('Multi-family');
  for (let i = 0; i < 105; i++) types.push('Townhouse');
  for (let i = 0; i < 30; i++) types.push('Duplex');
  // Shuffle so cities and owners get a mix.
  for (let i = types.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [types[i], types[j]] = [types[j], types[i]];
  }
  return types;
}

function unitCountFor(type) {
  // Multi-family stays within the 4-12 spec but biased to the small end so
  // 488 active tenants fill enough units to read as a populated portfolio.
  if (type === 'Multi-family') return randomInt(4, 6);
  if (type === 'Duplex') return 2;
  return 1;
}

export function buildPropertyRows(userId, owners) {
  const types = pickTypeMix();
  const usedAddresses = new Set();
  const rows = [];

  for (let i = 0; i < types.length; i++) {
    const type = types[i];
    const cityEntry = weightedCity();
    let address;
    let attempt = 0;
    do {
      const streetNum = randomInt(100, 19999);
      const street = randomChoice(STREET_NAMES);
      address = `${streetNum} ${street}, ${cityEntry.city}, ${cityEntry.state} ${cityEntry.zip}`;
      attempt++;
    } while (usedAddresses.has(address) && attempt < 5);
    usedAddresses.add(address);

    const units = unitCountFor(type);
    const [rentLow, rentHigh] = RENT_RANGES[type];
    const baseRent = randomInt(rentLow, rentHigh);
    const owner = owners[i % owners.length];
    const photo = randomChoice(PROPERTY_PHOTOS[type]);

    // Name is optional in DB; derive a friendly label.
    const nameSeed = `${cityEntry.city} ${type === 'Multi-family' ? 'Apartments' : 'Home'}`;
    const name = `${nameSeed} ${i + 1}`;

    // Note: properties.owner_id is declared UUID in the migration but is BIGINT
    // in production, so it is unwritable. We populate owner_name/owner_email
    // (text columns the UI reads) and link the owner via the owner_properties
    // junction after both inserts complete.
    rows.push({
      user_id: userId,
      name,
      address,
      units,
      type,
      occupied: 0, // filled later from tenant placement
      monthly_revenue: 0, // filled later from tenant placement
      photo_url: photo,
      expenses: generateExpenses(type, units),
      owner_name: owner.name,
      owner_email: owner.email,
      // Carry rent baseline and owner id forward; stripped before insert.
      __baseRent: baseRent,
      __rentRange: [rentLow, rentHigh],
      __ownerId: owner.id
    });
  }

  return rows;
}

export function stripInternal(row) {
  const { __baseRent, __rentRange, __ownerId, ...rest } = row;
  return rest;
}
