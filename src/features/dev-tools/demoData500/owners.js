// Owner generation for the 500-door demo portfolio.
// Owners table columns referenced: user_id, name, email, phone, address,
// management_fee_percent, portal_enabled. portal_token is filled by the DB default.

const FIRST_NAMES = [
  'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda',
  'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph',
  'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy',
  'Daniel', 'Lisa', 'Matthew', 'Margaret', 'Anthony', 'Betty', 'Donald',
  'Sandra', 'Mark', 'Ashley', 'Paul', 'Kimberly', 'Steven', 'Emily',
  'Andrew', 'Donna', 'Kenneth', 'Michelle'
];

const LAST_NAMES = [
  'Anderson', 'Brown', 'Carter', 'Davis', 'Evans', 'Foster', 'Garcia', 'Hughes',
  'Iverson', 'Jackson', 'Kim', 'Lee', 'Martinez', 'Nguyen', 'Olsen', 'Patel',
  'Quinn', 'Reyes', 'Sato', 'Tran', 'Underwood', 'Vance', 'Wong', 'Xiong',
  'Young', 'Zhou', 'Adams', 'Becker', 'Chan', 'Diaz', 'Edwards', 'Fischer',
  'Gomez', 'Hayashi', 'Ito', 'Johnson', 'Kowalski', 'Lopez', 'Murphy', 'Nakamura'
];

const PNW_AREA_CODES = ['206', '253', '425', '360', '509', '503', '971', '564'];

const PNW_STREETS = [
  'Pacific Ave', 'Yakima Ave', 'Tacoma Ave', 'Sprague Ave', 'Meridian St',
  'Pioneer Way', 'Sound View Dr', 'Olympic Blvd', 'Cascade Dr', 'Rainier Ave'
];

const PNW_CITIES = [
  ['Tacoma', 'WA', '98402'], ['Puyallup', 'WA', '98371'], ['Seattle', 'WA', '98101'],
  ['Bellevue', 'WA', '98004'], ['Spokane', 'WA', '99201'], ['Olympia', 'WA', '98501']
];

function randomChoice(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function generatePhone() {
  const area = randomChoice(PNW_AREA_CODES);
  const prefix = String(200 + Math.floor(Math.random() * 700)).padStart(3, '0');
  const line = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `${area}${prefix}${line}`;
}

function generateFee() {
  // Most at 10 percent, some at 8 or 12. Weighted distribution.
  const roll = Math.random();
  if (roll < 0.7) return 10.0;
  if (roll < 0.85) return 8.0;
  return 12.0;
}

export function buildOwnerRows(userId, count = 40) {
  const usedEmails = new Set();
  const rows = [];

  for (let i = 0; i < count; i++) {
    let first = randomChoice(FIRST_NAMES);
    let last = randomChoice(LAST_NAMES);
    let email = `${first}.${last}${i}@example.com`.toLowerCase();
    // Ensure uniqueness.
    while (usedEmails.has(email)) {
      first = randomChoice(FIRST_NAMES);
      last = randomChoice(LAST_NAMES);
      email = `${first}.${last}${i}.${Math.floor(Math.random() * 1000)}@example.com`.toLowerCase();
    }
    usedEmails.add(email);

    const [city, state, zip] = randomChoice(PNW_CITIES);
    const street = `${100 + Math.floor(Math.random() * 9000)} ${randomChoice(PNW_STREETS)}`;

    rows.push({
      user_id: userId,
      name: `${first} ${last}`,
      email,
      phone: generatePhone(),
      address: `${street}, ${city}, ${state} ${zip}`,
      management_fee_percent: generateFee(),
      portal_enabled: Math.random() < 0.5
    });
  }

  return rows;
}
