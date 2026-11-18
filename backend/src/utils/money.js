// CON-REG-001: money is stored as integer cents (KES x 100) to avoid float drift.
const toCents = (kes) => Math.round(Number(kes) * 100);
const fromCents = (cents) => cents / 100;
const formatKES = (cents) =>
  `KES ${fromCents(cents).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

module.exports = { toCents, fromCents, formatKES };
