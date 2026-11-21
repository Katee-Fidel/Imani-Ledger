const request = require('supertest');
const jwt = require('jsonwebtoken');
const sharp = require('sharp');
const app = require('../../src/app');
const config = require('../../src/config');
const { createAdmin, createMember } = require('../helpers/factories');

const tokenFor = (user) => jwt.sign({ id: user._id }, config.jwtSecret, { expiresIn: '1h' });

describe('PATCH /api/users/me — self-service profile update', () => {
  test('a member (not just an admin) can update their own name and phone', async () => {
    const member = await createMember();
    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${tokenFor(member)}`)
      .send({ fullName: 'Updated Name', phoneNumber: '0722222222' });

    expect(res.status).toBe(200);
    expect(res.body.fullName).toBe('Updated Name');
    expect(res.body.phoneNumber).toBe('0722222222');
  });

  test('rejects an empty full name', async () => {
    const member = await createMember();
    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${tokenFor(member)}`)
      .send({ fullName: '', phoneNumber: '0722222222' });
    expect(res.status).toBe(400);
  });
});

describe('Forced password change after an admin reset', () => {
  test('admin can reset a member password; member is then locked out of other routes', async () => {
    const admin = await createAdmin();
    const member = await createMember();

    const resetRes = await request(app)
      .patch(`/api/users/${member._id}/password`)
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({ newPassword: 'temporary123' });
    expect(resetRes.status).toBe(200);

    const memberToken = tokenFor(member);

    // Still allowed while locked: checking who they are.
    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${memberToken}`);
    expect(me.status).toBe(200);
    expect(me.body.mustChangePassword).toBe(true);

    // Blocked while locked: anything else, including read-only ledger access.
    const blocked = await request(app).get('/api/transactions').set('Authorization', `Bearer ${memberToken}`);
    expect(blocked.status).toBe(403);
  });

  test('setting a new password clears the lock', async () => {
    const admin = await createAdmin();
    const member = await createMember();
    await request(app)
      .patch(`/api/users/${member._id}/password`)
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({ newPassword: 'temporary123' });

    const memberToken = tokenFor(member);
    const changeRes = await request(app)
      .patch('/api/users/me/password')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ newPassword: 'mynewpassword1' });
    expect(changeRes.status).toBe(200);

    const unblocked = await request(app).get('/api/transactions').set('Authorization', `Bearer ${memberToken}`);
    expect(unblocked.status).toBe(200);
  });

  test('a member cannot reset another user\'s password', async () => {
    const memberA = await createMember();
    const memberB = await createMember();
    const res = await request(app)
      .patch(`/api/users/${memberB._id}/password`)
      .set('Authorization', `Bearer ${tokenFor(memberA)}`)
      .send({ newPassword: 'temporary123' });
    expect(res.status).toBe(403);
  });
});

describe('Avatar upload — POST/DELETE /api/users/me/avatar', () => {
  test('uploads, resizes, and serves a photo; removing it clears the URL', async () => {
    const member = await createMember();
    const token = tokenFor(member);

    // A tiny real PNG, not just random bytes — the endpoint re-encodes with
    // sharp, so it must actually decode as an image.
    const pngBuffer = await sharp({
      create: { width: 10, height: 10, channels: 3, background: { r: 10, g: 20, b: 200 } },
    })
      .png()
      .toBuffer();

    const uploadRes = await request(app)
      .post('/api/users/me/avatar')
      .set('Authorization', `Bearer ${token}`)
      .attach('photo', pngBuffer, 'avatar.png');

    expect(uploadRes.status).toBe(200);
    expect(uploadRes.body.avatarUrl).toMatch(/^\/uploads\/avatars\/.+\.webp\?v=\d+$/);

    const servedPath = uploadRes.body.avatarUrl.split('?')[0];
    const servedImage = await request(app).get(servedPath);
    expect(servedImage.status).toBe(200);
    expect(servedImage.headers['content-type']).toBe('image/webp');

    const removeRes = await request(app).delete('/api/users/me/avatar').set('Authorization', `Bearer ${token}`);
    expect(removeRes.status).toBe(200);
    expect(removeRes.body.avatarUrl).toBeNull();

    const goneImage = await request(app).get(servedPath);
    expect(goneImage.status).toBe(404);
  });

  test('rejects a non-image upload', async () => {
    const member = await createMember();
    const res = await request(app)
      .post('/api/users/me/avatar')
      .set('Authorization', `Bearer ${tokenFor(member)}`)
      .attach('photo', Buffer.from('not an image'), { filename: 'notes.txt', contentType: 'text/plain' });
    expect(res.status).toBe(400);
  });
});
