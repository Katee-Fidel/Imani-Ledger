// All business dates are evaluated in Africa/Nairobi (UTC+3).
const addMonths = (date, months) => {
  const d = new Date(date);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return d;
};
const formatEAT = (date) =>
  new Date(date).toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' });

module.exports = { addMonths, formatEAT };
