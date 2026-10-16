# Submission checklist

Deadline: **18 Oct 2026, 23:59 London time = 19 Oct, 04:29 AM IST.** Aim to submit by the evening of 18 Oct IST.
Canonical rules: github.com/Arkiv-Network/global-tour-stop-pre-devcon (it overrides anything else).

## Gates (miss one and nothing is scored)
- [ ] Public deployment judges can open without asking for access
- [ ] Reproducible steps in the README
- [ ] Public GitHub repo, **MIT** license, `[YOUR FULL NAME]` replaced
- [ ] `/arkiv/schema.md` finished (relayer address filled in)
- [ ] `/arkiv/friction.md` has confirmed, reproducible entries
- [ ] Wallet address(es) that create entities on Tiramisu listed
- [ ] Demo video, 3 minutes or less
- [ ] Every required question on the Devfolio form answered
- [ ] Work built between 9 and 18 Oct (say so; no pre-existing code was used, or disclose baseline commit SHA)
- [ ] Keep deployment up until **23 Oct**

## Disqualifiers to avoid
- [ ] No private keys or `.env` in the repo or in Arkiv (check `git status` before every commit)
- [ ] No real personal data in Arkiv (synthetic only; pseudonymous ids only)
- [ ] Arkiv is genuinely queried (it is: every list, vote check and price comes from `select().where()`)
- [ ] Do NOT rewrite git history after the deadline

## Tracks to select on the form
- [ ] Best Indian Use Case
- [ ] Censorship Resistance (one winning prize per team, so extra entries are free)

## Suggested demo video (under 3 min)
1. 20s: the problem (farmer, trader quotes low)
2. 60s: post a price, confirm another, see the median change
3. 40s: open the explorer, show the entity and its creator wallet
4. 30s: why Arkiv: expiry, attribute queries, no edit-in-place
5. 20s: what was kept off Arkiv and the relayer trade-off
