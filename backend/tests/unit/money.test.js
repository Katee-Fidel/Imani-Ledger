const { toCents, fromCents, formatKES } = require('../../src/utils/money');

describe('money utils', () => {
  test('toCents converts KES to integer cents', () => {
    expect(toCents(150.5)).toBe(15050);
  });

  test('fromCents reverses toCents', () => {
    expect(fromCents(toCents(2500))).toBe(2500);
  });

  test('formatKES renders a KES-prefixed amount', () => {
    expect(formatKES(toCents(2000))).toBe('KES 2,000.00');
  });
});
