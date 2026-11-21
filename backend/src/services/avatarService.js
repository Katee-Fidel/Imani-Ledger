const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');
const userService = require('./userService');
const { BadRequestError } = require('../utils/errors');

// One fixed file per user — a re-upload overwrites it, so nothing orphaned
// ever accumulates on disk. See TODO.md for the Render-disk persistence caveat.
const AVATAR_DIR = path.join(__dirname, '../../public/uploads/avatars');
const AVATAR_SIZE = 256;

const pathFor = (userId) => path.join(AVATAR_DIR, `${userId}.webp`);

// Re-encoding (not just copying the upload) is what actually validates the
// file is a real image — a disguised non-image file fails here, not just on
// a MIME-type/extension check that a client can fake.
exports.saveAvatar = async (userId, buffer) => {
  await fs.mkdir(AVATAR_DIR, { recursive: true });

  let resized;
  try {
    resized = await sharp(buffer)
      .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: 'cover' })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    throw new BadRequestError('That file could not be read as an image');
  }

  await fs.writeFile(pathFor(userId), resized);
  return userService.setAvatarUpdatedAt(userId, new Date());
};

exports.removeAvatar = async (userId) => {
  try {
    await fs.unlink(pathFor(userId));
  } catch (err) {
    if (err.code !== 'ENOENT') throw err; // already gone is fine; anything else isn't
  }
  return userService.setAvatarUpdatedAt(userId, null);
};
