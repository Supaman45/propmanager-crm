// Display helpers for the Health Dashboard. Kept separate so the components
// stay focused on layout.

export function formatCurrencyShort(value) {
  const num = Math.round(value || 0);
  if (Math.abs(num) >= 1000000) {
    return '$' + (num / 1000000).toFixed(1) + 'M';
  }
  if (Math.abs(num) >= 1000) {
    return '$' + (num / 1000).toFixed(0) + 'K';
  }
  return '$' + num.toLocaleString();
}

export function formatCurrencyFull(value) {
  const num = Math.round(value || 0);
  return '$' + num.toLocaleString();
}

export function formatPercent(value, decimals = 0) {
  const num = Number.isFinite(value) ? value : 0;
  return num.toFixed(decimals) + '%';
}

export function formatRelativeTime(timestamp) {
  if (!timestamp) return '';
  const then = new Date(timestamp);
  if (isNaN(then.getTime())) return '';
  const now = new Date();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return diffMin + ' minute' + (diffMin === 1 ? '' : 's') + ' ago';
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return diffHr + ' hour' + (diffHr === 1 ? '' : 's') + ' ago';
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return diffDay + ' day' + (diffDay === 1 ? '' : 's') + ' ago';
  const diffWeek = Math.floor(diffDay / 7);
  if (diffWeek < 5) return diffWeek + ' week' + (diffWeek === 1 ? '' : 's') + ' ago';
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return diffMonth + ' month' + (diffMonth === 1 ? '' : 's') + ' ago';
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Convert a hex color into an rgba with given alpha. Lets us use the token
// without committing raw hex codes in component files.
export function hexToRgba(hex, alpha = 1) {
  if (!hex || typeof hex !== 'string') return `rgba(0,0,0,${alpha})`;
  const value = hex.replace('#', '');
  if (value.length !== 6) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
