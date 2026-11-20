# Backend work pending from frontend decisions

Running list: as we build out the UI/UX first, anything the frontend assumes exists on the
backend but doesn't yet gets logged here. Work through these once the UI pass is done.

## From the login page

- **Admin-initiated password reset.** `ForgotPasswordPage` tells members to ask their admin to
  set a new password, but there is no backend support for that yet. `userService`/`userController`
  only expose `setStatus`. Needs:
  - `PATCH /api/users/:id/password` (admin-only) — sets a new password for another user, hashed
    with the same bcrypt cost as registration. No current-password check needed (admin privilege
    already gates this), but should probably force the member to change it again on next login
    (would need a `mustChangePassword` flag on `User` if we want that — not decided yet).
  - Corresponding `userService.setPassword(id, newPassword)` + Zod validator + frontend form in
    the Members page (an admin-triggered "Reset password" action per row, likely a small
    modal/inline form rather than a separate page).

- **Self-service email-based reset** — explicitly *not* building this yet (no email-sending
  infrastructure exists, and `CON-SEC-001` already keeps onboarding admin-driven). Only revisit
  if the user asks for real self-service reset; it would need a reset-token model/field, an email
  provider integration, and two new endpoints (`request-reset`, `reset-with-token`).

## From the Profile page (new: name, phone, photo, theme preference)

- **Self-service profile update.** `ProfilePage` calls `PATCH /api/users/me` to save `fullName`
  and `phoneNumber`, but that route doesn't exist — only admin-driven `setStatus` does right now.
  It currently fails gracefully (friendly in-app message, no crash), but needs:
  - `PATCH /api/users/me` (any authenticated user, acting on themselves — no admin check, just
    `req.user._id`) — update own `fullName`/`phoneNumber` only. Needs its own Zod schema (reuse
    shape from `userValidators`, but scoped to these two fields — must NOT allow `role`/`status`/
    `email` changes through this endpoint).
  - `userService.updateOwnProfile(id, { fullName, phoneNumber })`.
  - Decide whether email changes are ever allowed self-service (currently: no, by design — email
    is the login identifier, left read-only in the UI).

- **Profile photo storage.** Currently stored client-side only (`localStorage`, per browser,
  via `frontend/src/lib/avatar.js`) — so it won't show up for other members viewing someone's
  profile, and won't follow a user to a different device/browser. Needs a real decision before
  this is "done":
  - Where files live: options are a `User.avatarUrl` field + object storage (S3/Cloudinary/etc.),
    or storing a size-capped image directly on the `User` document (simplest, but bloats the doc
    and isn't great practice for binary data in Mongo).
  - `POST /api/users/me/avatar` (multipart upload) or accept a pre-uploaded URL, depending on the
    storage choice above.
  - Whether member-directory views (`GET /api/users`) should include the avatar URL in their
    projection once this exists.

- **Theme preference** needs no backend work — it's `localStorage`-only on purpose (a per-device
  display preference, not shared state), toggled from the Profile page. Not a gap, just noting it
  so it isn't mistaken for one later.

## Known frontend/backend gaps carried over from earlier (not new, just tracked here now)

- **Master Contribution Matrix (`FR-RPT-001`)** — SRS calls for `GET /api/statements/master`
  (aggregated per-member totals by category/year/cycle). Backend doesn't have this endpoint;
  `LedgerPage` currently computes rough totals client-side from the raw transaction list instead
  of a real pivot. Revisit once a dedicated master-table page is designed.
- **Billing cycle config UI** and **transaction void/reversal UI** are not built on the frontend
  yet, but the backend already supports both (`configController`, `DELETE /api/transactions/:id`)
  — these are frontend-only gaps, no backend work needed when we get to them.
- ~~**Loan creation form**~~ — done. `LoansPage.jsx` now has a "New loan" form (admin-only) above
  the loan book, posting to the already-existing `POST /api/loans`. No backend work was needed.
