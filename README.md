# Evelina's Flowershop — Backend System Overview

This document describes the server-side of Evelina's Flowershop: the exact
technologies, languages, and frameworks that make up the API, how it is
structured, and how to run it.

---

## 1. Programming Languages

| Language | Where it is used | Version |
|---|---|---|
| **TypeScript** | 100% of the backend (`server/`), build tooling, and the web client | `^5.5.4` |
| **JavaScript (Node.js)** | Runtime executing the compiled/transpiled server | Node 18+ |
| **SQL / other query languages** | None — the system is document-based (MongoDB) | — |

The backend is written end-to-end in **TypeScript** and executed directly with
**tsx** (an esbuild-based TypeScript executor) during development. For
dist builds it is compiled with `tsc -p server/tsconfig.json`. All HTTP
handling, data modeling, business rules, and background work live in
TypeScript.

---

## 2. Backend Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Runtime | **Node.js** | 18+ | Event-driven server runtime |
| Web framework | **Express** | `^4.19.2` | Routing, middleware, HTTP handling |
| Language | **TypeScript** | `^5.5.4` | Type-safe source code |
| TS runtime / compiler | **tsx** `^4.16.2` / **tsc** | — | Run TS directly in dev; compile for dist |
| ODM | **Mongoose** | `^8.5.1` | Schema modeling, validation, indexes |
| Database | **MongoDB Atlas** (cloud; local fallback `mongodb://localhost:27017/evelinas-flowershop`) | — | Document storage |
| Authentication | **jsonwebtoken** `^9.0.2` + **bcryptjs** `^2.4.3` | — | Stateless JWT auth (7-day tokens), password hashing |
| Security headers | **helmet** | `^8.3.0` | Baseline HTTP security headers |
| CORS | **cors** | `^2.8.5` | Origin-restricted, cookie-enabled cross-origin API |
| Cookies | **cookie-parser** | `^1.4.6` | httpOnly session-cookie fallback |
| Rate limiting | **express-rate-limit** | `^8.7.1` | Brute-force protection on auth endpoints |
| Config | **dotenv** | `^16.4.5` | Environment variable loading |
| Types | `@types/express`, `@types/mongoose` (via mongoose), `@types/jsonwebtoken`, `@types/bcryptjs`, `@types/cors`, `@types/cookie-parser`, `@types/node` | — | Compile-time typings |

---

## 3. Architecture

```
HTTP client
   │  Authorization: Bearer <JWT>   (or httpOnly cookie fallback)
   ▼
Express app  (server/index.ts)
   ├─ helmet ─ cors ─ cookie-parser ─ express.json(10mb) ─ urlencoded
   ├─ /api/health
   ├─ /api/auth          → routes/auth.ts
   ├─ /api/products      → routes/products.ts
   ├─ /api/orders        → routes/orders.ts
   ├─ /api/reviews       → routes/reviews.ts
   ├─ /api/gallery       → routes/gallery.ts
   ├─ /api/notifications → routes/notifications.ts
   ├─ /api/users         → routes/users.ts
   └─ global error handler → { "error": "<message>" }
   ▼
Mongoose ──► MongoDB Atlas
```

Request pipeline (in order): `helmet` → `cors` (origin = `FRONTEND_URL`,
credentials enabled) → `cookie-parser` → `express.json({ limit: '10mb' })` →
`express.urlencoded` → route middleware (`authenticate` / `requireAdmin`) →
handler → central error handler returning `{ "error": string }` with the
proper status code.

The app sets `trust proxy = 1` so rate limiting keys on the real client IP
behind Render's reverse proxy.

---

## 4. Database Layer (Mongoose + MongoDB Atlas)

### Models (`server/models/`)

| Model | Represents | Notable fields |
|---|---|---|
| `User` | Accounts (customer / admin) | `role`, `password` (bcrypt), profile whitelisted fields |
| `Bouquet` | Product catalog | `price`, `flowers[]`, `category`, `stock`, `inStock`, `popularity` |
| `Order` | Checkout + status pipeline | `items[]` (snapshot price), `total`, `status`, `stockReserved` |
| `Review` | Product reviews | `bouquet`, `rating`, `approved`, `featured`, `photo` |
| `Notification` | Bell notifications | `user` (null = broadcast), `read` per viewer, `link` |
| `GalleryPhoto` | Community gallery posts | `image`, `approved`, `featured`, `likes[]` |

### Indexes

| Collection | Index |
|---|---|
| `bouquets` | `{ popularity: -1 }`, `{ category: 1 }` |
| `orders` | `{ customer: 1, createdAt: -1 }`, `{ createdAt: -1 }`, `{ status: 1 }` |
| `reviews` | `{ bouquet: 1, approved: 1 }`, `{ createdAt: -1 }` |
| `notifications` | `{ user: 1, createdAt: -1 }`, `{ createdAt: -1 }` |
| `galleryphotos` | `{ approved: 1, createdAt: -1 }`, `{ createdAt: -1 }` |
| `users` | `{ role: 1 }` |

### Startup behavior

- Connects to `MONGODB_URI` (falls back to a local MongoDB for development).
- **Idempotent stock backfill**: products created before quantity tracking get
  `stock` initialized (`0` if unpublished, otherwise `10`) — only when the
  field is missing, so admin-set counts are never overwritten. Failure aborts
  startup, because a shop where every checkout says "not enough stock" must
  not come up.
- Graceful shutdown on `SIGTERM` / `SIGINT`; process exits on unhandled
  rejections and uncaught exceptions.

---

## 5. API Reference

Base URL (production): `https://evelinas-flowershop.onrender.com/api`
Health check: `GET /api/health` → `{ "status": "ok", "message": "Evelina's Flowershop API" }`

### Endpoints

| Mount | Method & path | Access | Description |
|---|---|---|---|
| `/api/auth` | `POST /register` | public* | Create account, returns JWT |
| | `POST /login` | public* | Sign in, returns JWT |
| | `POST /logout` | public | Clears the session cookie |
| | `GET /me` | authenticated | Current user's profile |
| `/api/products` | `GET /` | public | List products (`?page=&limit=` for envelope) |
| | `GET /:id` | public | Single product |
| | `POST /`, `PUT /:id`, `DELETE /:id` | admin | CRUD |
| | `GET /seed`, `POST /seed` | admin | Re-seed demo catalog |
| `/api/orders` | `POST /` | authenticated | Place order (atomic stock reservation) |
| | `GET /` | customer sees own; admin sees all | List (`?page=` supported) |
| | `GET /:id` | authenticated | Order detail |
| | `PATCH /:id/status` | authenticated | Status transition; stock restock/re-reserve |
| | `PATCH /:id/rate` | authenticated | Submit rating (blocked for cancelled orders) |
| `/api/reviews` | `GET /` | public | All approved reviews |
| | `GET /:bouquetId` | public | Reviews for one product |
| | `POST /` | authenticated | Create review (photo ≤ 1.5 MB) |
| | `PATCH /:id/approve`, `PATCH /:id/feature` | admin | Moderation |
| | `DELETE /:id` | admin | Remove review |
| `/api/gallery` | `GET /` | admin | Full moderation list |
| | `GET /approved`, `GET /featured` | public | Public feeds |
| | `POST /` | authenticated | Upload post (image ≤ 1.5 MB) |
| | `PATCH /:id/approve`, `PATCH /:id/feature` | admin | Moderation |
| | `PATCH /:id/like` | public | Like counter |
| | `DELETE /:id` | admin | Remove post |
| `/api/notifications` | `GET /` | authenticated | Bell feed (admins see all) |
| | `POST /` | authenticated | Create (`broadcast` flag is admin-only) |
| | `PATCH /:id/read`, `PATCH /read-all` | authenticated | Mark read |
| | `DELETE /:id` | authenticated | Dismiss |
| `/api/users` | `GET /`, `GET /:id`, `PATCH /:id`, `DELETE /:id` | admin | Account administration |
| | `PATCH /me` | authenticated | Update own profile (whitelisted fields) |

\* Rate-limited: **10 attempts / 15 minutes** per IP on `register` and `login`
(successful requests don't count), returning `429` with a friendly message.

### Authentication

- **Stateless JWT** signed with `JWT_SECRET`, expiry **7 days**, sent as
  `Authorization: Bearer <token>` on every request; an **httpOnly cookie**
  remains as a fallback where cross-site cookies are allowed.
- Middleware: `authenticate` (validates token, loads `userId`) and
  `requireAdmin` (role gate) applied per route.
- Passwords hashed with **bcryptjs**; oversized credential fields are rejected
  before hashing.
- The JWT secret is resolved at boot and **fails closed**: production refuses
  to start with a missing or publicly known secret.

### Pagination convention

Opt-in via query string on list endpoints (`/products`, `/orders`, `/users`,
`/gallery`, `/notifications`, …):

```
GET /api/products?page=2&limit=20
→ { "items": [...], "total": 9, "page": 2, "pages": 1, "limit": 20 }
```

Omitting `page` returns the legacy bare JSON array. `limit` is clamped
server-side (hard max **100**; default 20–50 depending on endpoint).

### Error convention

All failures respond with a JSON body `{ "error": "<message>" }` and an
appropriate status (`400` validation, `401` unauthenticated, `403` forbidden,
`404` missing, `409` conflict/oversell, `413`/`400` payload too large, `429`
rate-limited, `500` server error).

### Order status pipeline

`to-pay → to-ship → to-receive → to-rate → rated`, plus `cancelled`
(admin/customer). Cancelled orders are excluded from every revenue figure.

---

## 6. Core Backend Behaviors

**Atomic stock reservation.** Checkout reserves units with a single
`findOneAndUpdate({ stock: { $gte: qty } }, { $inc: { stock: -qty } })` — the
condition and the decrement happen in one operation, so two concurrent
checkouts can never both take the last unit. A failed match rolls back any
items already reserved and returns **409** with a human-readable message.
Cancelling an order restocks its units; re-activating a cancelled order
re-reserves them (409 if stock has since run out).

**Inventory monitoring.** When an order (or a re-activation) pushes a product
from above the threshold to **≤ 5 units — or sells it out — every admin
account receives an admin-targeted notification**
(`server/utils/lowStock.ts`) linking straight to the product's edit page.
Alerts are deduplicated while unread, never block the order flow, and are
never broadcast to customers. Manual admin stock edits intentionally do not
alert.

**Payload limits.** JSON bodies are capped at **10 MB**; individual uploaded
images (gallery, review photos, payment proofs) are rejected above **1.5 MB**
with `400`. Clients compress images before upload.

**Notifications.** Tied to a user (`user: <id>`) or broadcast (`user: null`);
`link` must be a relative app path, enforced server-side.

---

## 7. Configuration

| Variable | Required | Purpose |
|---|---|---|
| `MONGODB_URI` | production | Atlas connection string (local fallback exists for dev) |
| `JWT_SECRET` | production (mandatory) | Token signing secret — boot fails closed without a strong value |
| `PORT` | no (default `3001`) | HTTP port |
| `FRONTEND_URL` | no (default `http://localhost:5173`) | Allowed CORS origin |
| `NODE_ENV` | no | Selects production behavior (secret enforcement, etc.) |

Client-side build variable (separate SPA build): `VITE_API_URL` (defaults to
`http://localhost:3001/api`).

---

## 8. Running the Backend

```bash
npm install

# API with live reload (tsx watch) → http://localhost:3001
npm run server:dev

# Type-check / compile only
npx tsc --noEmit -p server/tsconfig.json
npm run server:build      # emits dist/

# Production-style start
npm run server:start      # node --import tsx server/index.ts
npm run server:prod       # node dist/server/index.js

# Seed demo catalog (admin)
npm run db:seed
```

---

## 9. Deployment

- **Platform:** [Render](https://render.com) — API web service at
  `https://evelinas-flowershop.onrender.com/api`.
- **Source of truth:** GitHub (`main`); pushes trigger an automatic rebuild
  and deploy (`render:build` → `npm run build`).
- **Database:** MongoDB Atlas (the same cluster is shared between local
  development and production — treat local runs as production data).
- **Runtime notes:** `trust proxy = 1` for correct client IPs behind the
  proxy; graceful shutdown on `SIGTERM` so in-flight requests drain before
  the database connection closes.

---

## 10. Project Structure (server)

```
server/
├─ index.ts              App bootstrap: middleware, mounts, DB connect, lifecycle
├─ seed.ts               Demo-data seeder (npm run db:seed)
├─ middleware/
│  └─ auth.ts            authenticate, requireAdmin, JWT secret resolution
├─ models/               Mongoose schemas + indexes
│  ├─ User.ts  Bouquet.ts  Order.ts
│  ├─ Review.ts  Notification.ts  GalleryPhoto.ts
├─ routes/               Express routers (one per resource)
│  ├─ auth.ts  products.ts  orders.ts  reviews.ts
│  ├─ gallery.ts  notifications.ts  users.ts
└─ utils/
   ├─ pagination.ts      ?page/?limit parsing + response envelope
   ├─ lowStock.ts        Threshold alerts for inventory monitoring
   └─ httpError.ts       Consistent { "error" } responses
```
ps. this is a capstone project and educational purpose only
