// Tenant application + screening result generation.
// Columns referenced match useApplications.js mapFormToDatabase output and
// useApplications.saveScreeningResults insert payload.

const FIRST_NAMES = [
  'Avery', 'Bryce', 'Carla', 'Devin', 'Elena', 'Felix', 'Gina', 'Hassan',
  'Iris', 'Jules', 'Kai', 'Lana', 'Mateo', 'Naomi', 'Owen', 'Pia',
  'Quinn', 'Reza', 'Sasha', 'Tess'
];

const LAST_NAMES = [
  'Bennett', 'Coleman', 'Dixon', 'Ellis', 'Frye', 'Greer', 'Hollis', 'Iqbal',
  'Jansen', 'Knox', 'Larson', 'Mendez', 'Norris', 'Ortiz', 'Pham', 'Quirk',
  'Ramos', 'Sandberg', 'Tate', 'Underhill'
];

const STATUSES = [
  'draft', 'submitted', 'documents_pending', 'screening',
  'approved', 'conditionally_approved', 'denied'
];

const CURRENT_CITIES = [
  ['Tacoma', 'WA', '98402'], ['Puyallup', 'WA', '98371'], ['Seattle', 'WA', '98101'],
  ['Renton', 'WA', '98055'], ['Kent', 'WA', '98030'], ['Olympia', 'WA', '98501']
];

const EMPLOYERS = [
  'Boeing', 'Amazon', 'Microsoft', 'Multicare', 'Pierce County',
  'City of Tacoma', 'Costco', 'T-Mobile', 'Group Health', 'Starbucks'
];

const JOB_TITLES = [
  'Software Engineer', 'Registered Nurse', 'Project Manager', 'Customer Service Rep',
  'Operations Lead', 'Account Manager', 'Warehouse Supervisor', 'Marketing Analyst',
  'Teacher', 'Mechanical Technician'
];

const SCREENING_RECS = ['approve', 'approve_with_conditions', 'deny'];
const RISK_LEVELS = ['low', 'medium', 'high'];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function phone() {
  const area = randomChoice(['206', '253', '425', '360', '503']);
  const prefix = String(200 + Math.floor(Math.random() * 700)).padStart(3, '0');
  const line = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `${area}${prefix}${line}`;
}

function dob() {
  const year = randomInt(1965, 2003);
  const month = String(randomInt(1, 12)).padStart(2, '0');
  const day = String(randomInt(1, 28)).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function futureMoveIn() {
  const now = new Date();
  const offset = randomInt(15, 120);
  const d = new Date(now);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

export function buildApplicationRows(userId, properties, count = 20) {
  const rows = [];
  for (let i = 0; i < count; i++) {
    const first = randomChoice(FIRST_NAMES);
    const last = randomChoice(LAST_NAMES);
    const property = properties[Math.floor(Math.random() * properties.length)];
    const [city, state, zip] = randomChoice(CURRENT_CITIES);
    const monthly = randomInt(3500, 11000);
    const status = i < STATUSES.length ? STATUSES[i] : randomChoice(STATUSES);

    rows.push({
      user_id: userId,
      property_id: property?.__insertedId || null,
      unit_number: null,
      first_name: first,
      last_name: last,
      email: `${first}.${last}${i}@example.com`.toLowerCase(),
      phone: phone(),
      date_of_birth: dob(),
      ssn_last_four: String(randomInt(1000, 9999)),
      current_address: `${randomInt(100, 9000)} Pacific Ave`,
      current_city: city,
      current_state: state,
      current_zip: zip,
      current_rent: randomInt(1200, 2800),
      current_landlord_name: `${randomChoice(FIRST_NAMES)} ${randomChoice(LAST_NAMES)}`,
      current_landlord_phone: phone(),
      months_at_current_address: randomInt(6, 60),
      employer_name: randomChoice(EMPLOYERS),
      employer_phone: phone(),
      job_title: randomChoice(JOB_TITLES),
      monthly_income: monthly,
      employment_start_date: `${randomInt(2018, 2024)}-${String(randomInt(1, 12)).padStart(2, '0')}-01`,
      additional_income: 0,
      additional_income_source: null,
      has_eviction_history: Math.random() < 0.05,
      eviction_explanation: null,
      has_criminal_history: Math.random() < 0.04,
      criminal_explanation: null,
      has_bankruptcy: Math.random() < 0.05,
      bankruptcy_explanation: null,
      desired_move_in: futureMoveIn(),
      number_of_occupants: randomInt(1, 4),
      has_pets: Math.random() < 0.3,
      pet_details: null,
      status,
      notes: null
    });
  }
  return rows;
}

export function buildScreeningResults(applicationIds, count = 4) {
  const ids = applicationIds.slice(0, count);
  return ids.map(applicationId => {
    const score = randomInt(55, 92);
    const rec = score >= 80 ? 'approve' : score >= 65 ? 'approve_with_conditions' : 'deny';
    const risk = score >= 80 ? 'low' : score >= 65 ? 'medium' : 'high';
    return {
      application_id: applicationId,
      overall_score: score,
      risk_level: risk,
      recommendation: rec,
      income_analysis: { ratio: (score / 25).toFixed(2), notes: 'Income to rent ratio meets policy threshold.' },
      rental_history_analysis: { notes: 'Prior landlord references reviewed, no issues reported.' },
      employment_verification: { verified: true, notes: 'Employer confirmed active employment.' },
      red_flags: rec === 'deny' ? ['Insufficient income documentation'] : [],
      summary: rec === 'approve' ? 'Strong candidate, recommend approval.' : rec === 'approve_with_conditions' ? 'Acceptable candidate with conditions.' : 'High risk, recommend deny.',
      detailed_summary: 'Demo screening result generated by the 500 door portfolio loader.'
    };
  });
}
