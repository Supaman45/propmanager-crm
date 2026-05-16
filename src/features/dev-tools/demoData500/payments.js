// Payment history generation. Returns a payment_log array shaped to match what
// transformTenantForDB writes into tenants.payment_log.

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const METHODS = ['ach', 'check', 'credit_card', 'cash'];

// Decide a personality for how late this tenant tends to be.
function paymentPersonality(roll) {
  if (roll < 0.6) return 'on_time'; // 60 percent reliably on time
  if (roll < 0.85) return 'slightly_late'; // 1 to 5 days
  return 'chronic_late'; // 10 or more days
}

function daysLateFor(personality) {
  if (personality === 'on_time') return randomInt(-2, 0);
  if (personality === 'slightly_late') return randomInt(1, 5);
  return randomInt(10, 22);
}

export function generatePaymentLog(rentAmount, status) {
  if (status !== 'current' && status !== 'late') return [];

  const personality = paymentPersonality(Math.random());
  const log = [];
  const now = new Date();
  // 12 months ending with the most recent completed month.
  // For Late tenants, the current month is intentionally unpaid.
  const monthsToFill = status === 'late' ? 11 : 12;
  const startOffset = status === 'late' ? 1 : 0;

  for (let i = monthsToFill - 1 + startOffset; i >= startOffset; i--) {
    const periodStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const daysLate = daysLateFor(personality);
    const paid = new Date(periodStart.getFullYear(), periodStart.getMonth(), 1 + daysLate);
    log.push({
      amount: rentAmount,
      date: formatDate(paid),
      method: METHODS[Math.floor(Math.random() * METHODS.length)],
      notes: `${periodStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} rent`
    });
  }

  return log;
}

export function determinePaymentStatus(tenantStatus, personality) {
  if (tenantStatus === 'late') return 'late';
  if (tenantStatus === 'current') return 'paid';
  return 'n/a';
}
