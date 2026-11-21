const multer = require('multer');
const { BadRequestError } = require('../utils/errors');

// Memory storage: the file is re-encoded (resized + converted) by sharp
// before it ever touches disk, so there's no need to buffer it to a temp
// file first.
exports.avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB raw upload cap, before resizing
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new BadRequestError('Please upload an image file'));
    }
    cb(null, true);
  },
});
