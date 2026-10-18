# Setup guide

How to run Mandi Praman locally and reproduce the checks against the Arkiv Tiramisu testnet.
Requires Node.js 20 or newer and a MetaMask wallet (only to receive test tokens from the faucet).

## 1. Backend

```bash
cd backend
npm install
npm run wallet            # prints a NEW throwaway address and private key (testnet only)
```

Create `backend/.env` from the example (`cp .env.example .env`, or `copy .env.example .env` on Windows)
and paste the private key as `PRIVATE_KEY=0x...`. Never commit `.env`, and never use a key that holds real funds.

Get test GLM for the **address** printed above from https://hub.arkiv.network/faucet, then:

```bash
npm run hello             # writes one entity and reads it back by key and by query
npm run seed              # optional: synthetic demo data (flagged synthetic=true)
npm run dev               # API on http://localhost:8787
```

### Environment variables (`backend/.env`)

| Variable | Default | Meaning |
| --- | --- | --- |
| `PRIVATE_KEY` | required | Relayer key, `0x` plus 64 hex characters |
| `RPC_URL` | public Tiramisu RPC | Optional RPC URL with an Arkiv access key appended |
| `PORT` | `8787` | API port |
| `CORS_ORIGIN` | `*` | Allowed frontend origin(s), comma separated |
| `PROJECT_ID` | `mandi_board_v1` | Tag on every entity this app creates |
| `REPORT_TTL_HOURS` | `72` | How long a report lives before it expires |
| `MAX_WRITES_PER_DAY` | `500` | Daily cap on writes across all visitors |

## 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env      # Windows: copy .env.example .env
npm run dev               # http://localhost:5173, with the backend running
```

`VITE_API_URL` (in `frontend/.env`) points at the backend. It is baked in at build time.

## 3. Verify the Arkiv behaviour

These scripts need a funded relayer and print exact results:

```bash
cd backend
npm run prove-readonly    # creates a readonly entity and shows the owner's edit being rejected
npm run probe             # error messages and type behaviour used in arkiv/friction.md
```

## API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | liveness |
| GET | `/api/meta` | relayer address, chain id, explorer links |
| GET | `/api/catalog` | crops and mandis with English, Hindi and Marathi names |
| GET | `/api/reports?crop=&mandi=&state=&hours=` | reports with vote tallies |
| POST | `/api/reports` | `{ crop, mandi, pricePerQuintal, variety?, reporterId }` |
| POST | `/api/reports/:key/votes` | `{ verdict: "confirm" or "dispute", voterId }` |
| GET | `/api/prices?crop=&state=&hours=48` | median, min and max per crop and mandi |

## 4. Deploying

- **Backend:** any host that runs a long-lived Node process. Root directory `backend`, build command
  `npm install`, start command `npm start`. Set `PRIVATE_KEY`, `CORS_ORIGIN` (your frontend URL, no trailing slash)
  and `REPORT_TTL_HOURS` as environment variables, and use `/api/health` as the health check.
  Run only **one** instance with a given key, because two processes writing from the same wallet collide on nonces.
- **Frontend:** any static host. Root directory `frontend`, build command `npm run build`, output `dist`.
  Set `VITE_API_URL` to the backend URL before building.

## Repository layout

```
arkiv/       schema.md and friction.md
backend/     Express + TypeScript relayer API, plus scripts/ (wallet, hello, seed, prove-readonly, probe)
frontend/    React + Vite app
docs/        this guide, the submission checklist, and README images
```