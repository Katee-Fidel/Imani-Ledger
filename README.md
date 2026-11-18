# Imani Ledger

A web-based financial ledger for a Chama (an informal cooperative savings group) in Kenya. It replaces paper books and spreadsheets with a single source of truth: monthly member contributions, tiered loans, automated fines, and an audit trail that never hard-deletes a record — corrections are posted as reversing contra-entries instead.

Full requirements live in [SRS.md](SRS.md) (IEEE 830 format). This README covers running the project day to day.

## Stack

- **Backend:** Node.js, Express, MongoDB/Mongoose (replica set, for ACID multi-document transactions), JWT auth, Zod validation, Jest + Supertest for tests.
- **Frontend:** React 19, React Router, Tailwind CSS v4, Vite.

## Repository layout

```
backend/     REST API — routes → controllers → services → models
frontend/    React SPA (member dashboard + admin console)
SRS.md       Software Requirements Specification
```

See [backend/src](backend/src) for the MVC + service-layer breakdown (validators, services, controllers, routes, middleware, utils) and [frontend/src](frontend/src) for the UI (pages, components, API client, auth context).

## Prerequisites

- Node.js 18+
- A MongoDB **replica set** — required because bulk payment allocation and loan repayments run inside `session.withTransaction()`. A free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster already runs as a replica set and works out of the box; a local single-node `mongod` does not support transactions unless initialized as one.

## Backend setup

```bash
cd backend
npm install
cp .env.example .env   # fill in MONGODB_URI and JWT_SECRET (see below)
npm run seed:admin      # creates the first admin account (public signup is off by default)
npm run dev              # starts the API on PORT (default 5000), auto-restarts on change
```

Run the test suite (spins up an in-memory MongoDB replica set automatically — no real database needed):

```bash
npm test
```

### Environment variables (`backend/.env`)

| Variable | Required | Notes |
|---|---|---|
| `MONGODB_URI` | Yes | Must point at a replica set. Copy the full connection string from Atlas's "Connect" dialog so special characters in the password are already URL-encoded. |
| `JWT_SECRET` | Yes | Generate one with `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` or `openssl rand -hex 64`. |
| `JWT_EXPIRES_IN` | No | Defaults to `8h`. |
| `PORT` | No | Defaults to `5000`. |
| `CORS_ORIGIN` | Yes (if frontend origin differs) | Set to the frontend's dev/prod origin. |
| `ALLOW_PUBLIC_SIGNUP` | No | Defaults to `false`. Keep it `false` in production — admins onboard members via `POST /api/auth/register-member`. |

To create the first admin account, set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` (and optionally `SEED_ADMIN_NAME`, `SEED_ADMIN_PHONE`) before running `npm run seed:admin`.

## Frontend setup

```bash
cd frontend
npm install
npm run dev     # Vite dev server; proxies /api to http://localhost:5000
```

Run both `backend` and `frontend` dev servers side by side for the full app. `npm run build` produces a production bundle in `frontend/dist`; `npm run lint` runs oxlint.

## Core rules worth knowing before changing code

- **Money** is stored as integer cents (KES × 100) everywhere — never floats. See `backend/src/utils/money.js`.
- **No hard deletes** on financial records. Voiding a transaction marks it `voided` and posts a compensating `contra_entry`; the original stays in the database.
- **Bulk payment allocation** (`POST /api/transactions/allocate`) is atomic: if the line items don't sum to the total deposit, or any write fails, the whole batch rolls back.
- **Loan terms:** standard loans ≤ KES 200,000 run 6 months at 10% flat upfront interest; > KES 200,000 run 12 months at the same rate; emergency loans run 2 months at 0% interest.
- **Fines** sweep every active user regardless of role — admins owe shares/savings dues too, and aren't exempt from late-payment fines.
- **Access model:** any active authenticated user (admin or member) can read everything (`GET`); only admins can write. Status is re-checked from the database on every request, so suspending a user takes effect immediately even on an unexpired token.

## Brand

The Imani Group mark (interlocking navy/gold links — members bound together, a visual for the Chama itself) is at [igLogo](igLogo) (SVG) and reproduced as React components in `frontend/src/components/brand/`.
