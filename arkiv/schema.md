# Arkiv schema: Mandi Price Board

Network: Tiramisu testnet (chain ID 7738577) · SDK: `@arkiv-network/sdk` 0.8.x

Every entity carries `project = mandi_board_v1` so queries only see this app's data.
Attribute names are lowercase snake_case; every value is built with a typed constructor
and queried with the same constructor (a type mismatch silently returns nothing).

## Entity: `price_report`

A farmer or trader reports what a crop is selling for in one mandi.

| Attribute | Type | Why it is an attribute |
| --- | --- | --- |
| `project` | `str` | Scope all queries to this app |
| `type` | `str` = `price_report` | Separate reports from votes |
| `crop` | `str` (slug, e.g. `onion`) | Filter prices by crop |
| `mandi` | `str` (slug, e.g. `lasalgaon`) | Filter prices by market |
| `state` | `str` (slug, e.g. `maharashtra`) | Regional view |
| `price` | `dec` (INR per quintal) | Range-queryable price |
| `reported_at_ms` | `u64` | "Reports from the last N hours" range query |
| `reporter` | `str` (pseudonymous id) | Stop self-voting; no real identity stored |
| `synthetic` | `bool` | Marks demo data |

Payload (`application/json`): `{ pricePerQuintal, variety, cropName, mandiName }`
Expiry: `REPORT_TTL_HOURS` (default 72 h) via `ExpirationTime.fromHours`. Stale prices disappear on their own.

## Entity: `price_vote`

One confirmation or dispute of one report.

| Attribute | Type | Why |
| --- | --- | --- |
| `project` | `str` | Scope |
| `type` | `str` = `price_vote` | Separate from reports |
| `report_key` | `key` | Weak reference to the report entity |
| `verdict` | `str` (`confirm` or `dispute`) | Trust tally |
| `voter` | `str` (pseudonymous id) | One vote per voter per report |
| `voted_at_ms` | `u64` | Ordering |

Payload: `{}`
Expiry: `ExpirationTime.atBlock(report.expiresAt, { atLeast: fromSeconds(30) })`, so a vote dies with its report.

## Queries used

- Reports by crop / mandi / state / recent window: `eq` on `project`, `type`, `crop`, `mandi`, `state` plus `gte("reported_at_ms", u64(...))`
- All votes for the project, grouped in memory by `report_key`
- Duplicate-vote check: `eq("report_key", key(...))` and `eq("voter", str(...))`
- Pagination with `limit(200)`, `hasNextPage()`, `next()`

## Kept OFF Arkiv on purpose

- **The median price.** It is derived from reports, so the app computes it. Storing it would create a second, stale source of truth.
- **User identity / phone numbers.** Only a random pseudonymous id is stored. No personal data on a public chain.
- **Translations of crop and mandi names (Hindi, Marathi).** Static UI data, shipped with the app.
- **Photos.** Too big (payload limit 128 KiB) and not needed.
- **Private keys or secrets.** The relayer key lives only in server environment variables.

## Wallet addresses that create entities on Tiramisu

| Role | Address | Explorer |
| --- | --- | --- |
| Relayer (signs every report and vote) | `TODO: paste after running npm run wallet` | `https://tiramisu.explorer.arkiv.network/address/<address>` |

## Honest limitations

- A relayer wallet signs all writes so farmers need no crypto wallet. This centralises *who submits*, not *what is stored*. Every entity is created with the `readonly` flag, so nobody, including the relayer that owns it, can patch a report after posting. The relayer could still **delete** an entity, but a delete is itself a public transaction visible in the explorer. `$creator` is verifiable. A per-user wallet or account-abstraction flow is the production path.
- `npm run prove-readonly` (backend) creates a readonly entity and shows the owner's patch being rejected.
- Pseudonymous voter ids are not Sybil-resistant. The median is the defence, since one bad report cannot move it much.
