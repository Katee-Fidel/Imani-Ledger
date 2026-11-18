const userService = require('../../src/services/userService');
const { createAdmin, createMember } = require('../helpers/factories');

describe('userService.listUsers — FR-AUTH-005 directory projection', () => {
  test('members receive a restricted projection without email', async () => {
    await createAdmin();
    await createMember({ fullName: 'Jane Member', email: 'jane@example.com' });

    const asMember = await userService.listUsers('member');
    for (const u of asMember) {
      expect(u.email).toBeUndefined();
      expect(u.fullName).toBeDefined();
      expect(u.phoneNumber).toBeDefined();
      expect(u.role).toBeDefined();
      expect(u.status).toBeDefined();
    }
  });

  test('admins receive the full projection including email', async () => {
    await createAdmin();
    await createMember({ email: 'jane2@example.com' });

    const asAdmin = await userService.listUsers('admin');
    expect(asAdmin.some((u) => u.email === 'jane2@example.com')).toBe(true);
  });
});

describe('userService.setStatus', () => {
  test('suspends a user', async () => {
    const member = await createMember();
    const updated = await userService.setStatus(member._id, 'suspended');
    expect(updated.status).toBe('suspended');
  });

  test('throws NotFoundError for a non-existent user id', async () => {
    const mongoose = require('mongoose');
    await expect(userService.getUserById(new mongoose.Types.ObjectId())).rejects.toThrow(/not found/i);
  });
});
