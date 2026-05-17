export function formatLeaseEndDate(leaseEnd, status) {
  if (!leaseEnd || status === 'prospect') return 'Pending';
  const date = new Date(leaseEnd);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}
