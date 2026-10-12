# Local Setup — Run the Shop on Your Own Laptop (localhost)

Everything runs locally against the cloud database — about 5 minutes from
zero to a working shop.

## 1. Prerequisites

| Need | Why | Check |
|---|---|---|
| **Node.js 20 or newer** | Runs the API (`tsx`) and the Vite build; ships npm | `node -v` |
| **Git** | Clone the repository | `git -v` |

No local MongoDB install is needed — the database (MongoDB Atlas) and the
AI gift-message assistant both live in the cloud.

## 2. Get the code

```bash
git clone https://github.com/Projchiecode-code/evelinas-flowershop.git
cd evelinas-flowershop
npm install
```

## 3. Paste your `.env`

Chie sends the `.env` file **separately** (it contains secrets, so it is
never posted in chat or committed to GitHub — it is already listed in
`.gitignore`). Drop it in the **project root**, next to `package.json`:

```
evelinas-flowershop/
├── .env            ← paste it here
├── package.json
├── server/
└── src/
```

It already contains the correct localhost values:

| Variable | What it does locally |
|---|---|
| `MONGODB_URI` | Cloud database (the same data the live site uses) |
| `JWT_SECRET` | Signs login tokens |
| `GEMINI_API_KEY` | Enables the ✨ AI gift-message writer (optional — without it the button simply stays hidden) |
| `PORT=3001` | API port |
| `FRONTEND_URL=http://localhost:5173` | CORS origin for the local storefront |

> ⚠️ **Never commit `.env`.** If a git command ever shows it as a change,
> stop and check — it should always stay ignored.

## 4. Run it

Two terminals from the project root:

```bash
# Terminal 1 — the backend API  →  http://localhost:3001
npm run server:dev

# Terminal 2 — the storefront   →  http://localhost:5173
npm run dev
```

Open **http://localhost:5173** — the shop now talks to *your* local API.

## 5. Accounts

- **Customer:** register a new account from the site's Register button.
- **Admin (florist dashboard):** ask Chie — admin accounts are created by
  the shop owner, never self-registered.

## Good to know

- **Shared data:** the local setup uses the **same cloud database as the
  live site** — orders, reviews and accounts you create locally are real
  shared data. Avoid placing test orders (or tell Chie so they can be
  cleaned up).
- **Useful scripts:**
  - `npm run build` — production build of the storefront
  - `npm run db:seed` — re-seed the demo catalog (admin)
  - `npx tsc --noEmit -p server/tsconfig.json` — type-check the API
- **Troubleshooting:**
  - *Port already in use* — another app holds 3001 or 5173; close it or
    change `PORT` in `.env`.
  - *API fails on startup* — confirm `.env` is in the project root and
    `MONGODB_URI` is intact (no truncated line).
  - *Login/CORS errors* — `FRONTEND_URL` must stay `http://localhost:5173`
    while using the local storefront.
