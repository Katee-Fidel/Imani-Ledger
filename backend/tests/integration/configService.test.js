const configService = require('../../src/services/configService');

describe('configService — FR-FINE-001 billing cycle configuration', () => {
  test('creates a billing cycle', async () => {
    const cycle = await configService.createBillingCycle({
      billingCycleMonth: '2026-02',
      sharesDueDate: new Date('2026-02-05'),
      sharesGracePeriodEndDate: new Date('2026-02-10'),
      loanRepaymentDueDate: new Date('2026-02-15'),
    });
    expect(cycle.billingCycleMonth).toBe('2026-02');
  });

  test('rejects a duplicate billing cycle for the same month', async () => {
    const payload = {
      billingCycleMonth: '2026-03',
      sharesDueDate: new Date('2026-03-05'),
      sharesGracePeriodEndDate: new Date('2026-03-10'),
      loanRepaymentDueDate: new Date('2026-03-15'),
    };
    await configService.createBillingCycle(payload);
    await expect(configService.createBillingCycle(payload)).rejects.toThrow(/already configured/i);
  });

  test('getBillingCycle throws for an unconfigured month', async () => {
    await expect(configService.getBillingCycle('2099-12')).rejects.toThrow(/not found/i);
  });
});
