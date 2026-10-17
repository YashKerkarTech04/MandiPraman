# Mandi Mitra frontend

Vite + React + TypeScript. Reads go through TanStack Query (as the Arkiv React docs recommend);
all reads and writes talk to the backend in `../backend`. Mobile-first, English / Hindi / Marathi.

## Run locally

```bash
cd frontend
npm install
copy .env.example .env     # macOS/Linux: cp .env.example .env
npm run dev                # http://localhost:5173  (backend must be running on :8787)
```

## Build

```bash
npm run build              # type-checks, then writes dist/
```

`VITE_API_URL` is baked in **at build time**. On Vercel/Netlify set it in the project's
environment variables to your deployed backend URL, then redeploy.

## What it does

- Price board: median per crop and mandi, best mandi highlighted, min-max range, report and confirmation counts
- Latest reports with Confirm / Dispute (one vote per browser per report; disputed reports are flagged)
- "Post a price" sheet (no wallet needed; a random pseudonymous id lives in this browser)
- Language switch (EN / हिं / मरा), remembered in the browser
- Links to the transaction on the Tiramisu explorer after every write

## Notes

- One call for all prices and one for all reports; crop filtering happens in the browser to keep
  traffic to the rate-limited public Arkiv RPC low. Data refreshes every 20 seconds.
- Hindi and Marathi text was written by an AI. Have a native speaker skim it before the demo.
