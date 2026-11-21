const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phoneNumber: { type: String, required: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    status: { type: String, enum: ['active', 'suspended', 'inactive'], default: 'active' },
    joinedDate: { type: Date, default: Date.now },
    // Set when an admin resets this user's password; cleared once they set their own.
    mustChangePassword: { type: Boolean, default: false },
    // Avatar file lives on disk at public/uploads/avatars/<id>.webp; this timestamp
    // both marks "has a photo" and cache-busts the URL after a re-upload.
    avatarUpdatedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
