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

describe('userService.updateOwnProfile', () => {
  test('updates fullName and phoneNumber only', async () => {
    const member = await createMember({ fullName: 'Old Name', phoneNumber: '0700000001' });
    const updated = await userService.updateOwnProfile(member._id, {
      fullName: 'New Name',
      phoneNumber: '0711111111',
    });
    expect(updated.fullName).toBe('New Name');
    expect(updated.phoneNumber).toBe('0711111111');
    expect(updated.avatarUpdatedAt).toBeUndefined();
    expect(updated.password).toBeUndefined();
  });
});

describe('userService password management', () => {
  const bcrypt = require('bcrypt');
  const User = require('../../src/models/User');

  test('adminSetPassword hashes the new password and flags mustChangePassword', async () => {
    const member = await createMember();
    await userService.adminSetPassword(member._id, 'temporary123');

    const reloaded = await User.findById(member._id).select('+password');
    expect(reloaded.mustChangePassword).toBe(true);
    await expect(bcrypt.compare('temporary123', reloaded.password)).resolves.toBe(true);
  });

  test('changeOwnPassword clears mustChangePassword', async () => {
    const member = await createMember();
    await userService.adminSetPassword(member._id, 'temporary123');
    await userService.changeOwnPassword(member._id, 'mynewpassword');

    const reloaded = await User.findById(member._id).select('+password');
    expect(reloaded.mustChangePassword).toBe(false);
    await expect(bcrypt.compare('mynewpassword', reloaded.password)).resolves.toBe(true);
  });
});
