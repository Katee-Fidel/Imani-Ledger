# Backend work pending from frontend decisions

Running list: as we build out the UI/UX first, anything the frontend assumes exists on the
backend but doesn't yet gets logged here. Work through these once the UI pass is done.

## ⚠️ Before deploying to Render + Vercel

Found while wiring the avatar feature, and it affects `/api` calls too, not just avatars:

- **The frontend calls everything with relative paths** (`fetch('/api/...')`, and now
  `<img src="/uploads/...">`). That only works because `vite.config.js`'s dev proxy forwards both
  `/api` and `/uploads` to `localhost:5000`. In production, the frontend (Vercel) and backend
  (Render) are **different domains** — there is no dev proxy there, so every API call and every
  avatar image will silently 404/fail once deployed, unless one of these is set up first:
  - **Vercel rewrites** (`vercel.json`, `rewrites` pointing `/api/*` and `/uploads/*` at the
    Render backend's URL) — keeps the frontend code unchanged, closest to how dev works now.
  - **Absolute backend URL** — add a `VITE_API_BASE_URL` build-time env var, prefix every fetch in
    `frontend/src/api/client.js` with it (and the `<img>` src wherever `avatarUrl` is rendered).
  - Either way, `backend/src/config/index.js`'s `corsOrigin` will need to be the deployed Vercel
    URL, not `localhost:5173`, once that's live.
  - This hasn't been fixed yet — flagging now so it's not discovered the hard way after deploy.

## From the login page

- ~~**Admin-initiated password reset**~~ — done. `PATCH /api/users/:id/password` (admin-only)
  hashes and sets a new password for another user, and sets `mustChangePassword: true`. The
  server itself enforces the lock afterward (`middleware/auth.js`): that account can only hit
  `GET /api/auth/me` or `PATCH /api/users/me/password` until they set their own password — this
  is checked server-side, not just in the frontend's routing. Frontend: Members page has a
  "Reset password" action per row; a new `/change-password` screen (gated via `ProtectedRoute`)
  handles the forced change. Covered by `tests/integration/profileAndAvatar.test.js`.

- **Self-service email-based reset** — still explicitly *not* building this (no email-sending
  infrastructure exists, and `CON-SEC-001` already keeps onboarding admin-driven). Only revisit
  if the user asks for real self-service reset.

## From the Profile page

- ~~**Self-service profile update**~~ — done. `PATCH /api/users/me` updates `fullName`/
  `phoneNumber` only (role/status/email can't go through this endpoint, by design — email stays
  the read-only login identifier).

- ~~**Profile photo storage**~~ — done, via local disk rather than the base64-on-document option
  floated earlier (cleaner — keeps `User` documents and `GET /api/users` light). Uploads go
  through `multer` (memory storage, 5MB cap, image-mimetype filter) → `sharp` (resize to 256×256,
  re-encode to `webp` — this is also what actually validates the upload really is an image, not
  just a faked extension/MIME type) → written to `backend/public/uploads/avatars/<userId>.webp`,
  one fixed file per user so a re-upload just overwrites it. Served via `express.static` mounted
  at `/uploads` (that one subfolder only, not all of `public/`). `User.avatarUpdatedAt` both marks
  "has a photo" and cache-busts the URL (`?v=<timestamp>`) so a re-upload doesn't keep showing a
  browser-cached old image — the same bug we hit with the favicon earlier. `GET /api/users` now
  includes `avatarUrl` in both the admin and member projections.
  - **Known caveat, not yet resolved**: local disk storage only persists if the Render service has
    a paid persistent disk attached. On Render's free tier (no disk), every uploaded avatar is
    lost on the next deploy or restart. Revisit if that turns out to matter for this MVP — the fix
    would be moving to object storage (S3/Cloudinary/etc.) later; the service boundary
    (`avatarService.js`) was written so that swap wouldn't touch the controller/routes.

- **Theme preference** needs no backend work — `localStorage`-only on purpose, unchanged.

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
