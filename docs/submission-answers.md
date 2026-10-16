# Draft answers for the Devfolio form

Edit these once the app is running. Be concrete; judges score specificity.

## Why India? (25)
Who: a Maharashtra onion or tomato farmer deciding where to sell today (Lasalgaon vs Pimpalgaon vs Vashi),
and small traders who want a second opinion on a quote.
Problem: the buyer is often the only source of "today's price" and has an incentive to quote low.
Official data is delayed and hard to use on a phone. Here, any farmer or trader can post what they saw,
others confirm or dispute it, and the board shows the median of recent trusted reports in English, Hindi and Marathi.

## Why Arkiv? (25)
What would break elsewhere:
- **Postgres / our own API:** whoever runs the database can silently edit or delete a price. Here each report is a public entity tied to its creator and the app cannot rewrite it afterwards.
- **IPFS:** content is immutable but not queryable. We need "onion, Nashik, last 48 hours". Arkiv indexes attributes (`crop`, `mandi`, `reported_at_ms`, `price`) and queries them directly.
- **A subgraph:** needs a separate indexer to run and keep in sync. Arkiv queries need none.
- **Expiry:** stale prices must disappear. `expiresIn` does that natively; elsewhere it is a cron job.

Kept off Arkiv on purpose: the computed median, user identity, translations, photos, secrets.

## How you use Arkiv (25)
- **Typed attributes** (`str`, `dec`, `u64`, `bool`, `key`): `dec` and `u64` make price and time range-queryable.
- **Attribute queries** (`eq`, `gte`, `and`, pagination): list and filter reports, check for duplicate votes.
- **Expiry** (`ExpirationTime.fromHours`, `atBlock` with `atLeast`): reports live 72h; a vote expires with its report.
- **`key` attribute** as a reference from a vote to its report.
- **`executeBatch`**: seeding and any multi-write, one transaction, no nonce collisions.
- **`nonceManager` + write queue**: safe concurrent relayer writes.
Not used on purpose: ownership transfer, readonly flag (reports could be made `readonly` as a stretch goal).

## Friction report (25)
See `arkiv/friction.md`.
