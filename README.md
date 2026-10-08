# PharmaHisab — pharmacy stock, expiry & বাকি ledger

Stock, expiry alerts and credit ledger for pharmacies. One dashboard,
built to demo to real pharmacy owners.

## Run it

```bash
npm install
cp .env.example .env   # optional — MongoDB persistence
npm run dev            # http://localhost:3000
```

Without `MONGODB_URI` everything runs in memory mode (demo).

## Features (built feature-by-feature)

- **F1** — medicine model + full CRUD API
- **F2** — stock in/out with movement ledger + insufficient-stock guards
- **F3** — expiry tracking (expired / expiring ≤90 days) + alerts API
- **F4** — বাকি-খাতা: customers, dues, payments, live balances in ৳
- **F5** — dashboard UI + one-click demo seed
- **F6** — verified build + live API tests

## Notes

- Next 16 defaults to cached GET handlers — this app sets
  `cacheComponents: false` + `dynamic = "force-dynamic"` so every
  dashboard number is live.

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind v4 · Mongoose (optional)
