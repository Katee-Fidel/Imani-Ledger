// Deterministic path (see avatarService) + a cache-busting version so a
// re-uploaded photo doesn't keep showing the browser's cached old one.
const avatarUrl = (user) =>
  user.avatarUpdatedAt ? `/uploads/avatars/${user._id}.webp?v=${user.avatarUpdatedAt.getTime()}` : null;

module.exports = { avatarUrl };
