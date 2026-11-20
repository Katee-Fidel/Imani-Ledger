// No backend storage for avatars yet (tracked in TODO.md) — kept per-browser
// in localStorage, keyed by user id, so it at least persists across visits
// on this device until the real upload endpoint exists.
const keyFor = (userId) => `imani_avatar_${userId}`;

export const getAvatar = (userId) => {
  try {
    return localStorage.getItem(keyFor(userId));
  } catch {
    return null;
  }
};

export const setAvatar = (userId, dataUrl) => {
  try {
    localStorage.setItem(keyFor(userId), dataUrl);
  } catch {
    // Storage full or blocked — the preview still works for this session.
  }
};

export const removeAvatar = (userId) => {
  try {
    localStorage.removeItem(keyFor(userId));
  } catch {
    // Nothing to clean up if storage was never available.
  }
};
