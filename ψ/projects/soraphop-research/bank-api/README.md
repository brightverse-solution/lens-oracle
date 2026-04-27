---
title: Soraphop Bank API Research — TL;DR + Recommendation
project: soraphop
date: 2026-04-27
author: LENS Oracle 🔍
status: research-complete · awaiting Palm decision
deliverables:
  - comparison.md (3 banks × 11 criteria + product-fit map + ranking)
  - BankAdapter.interface.ts (port, ADR-004 compliant, paste-ready)
  - webhook-signature.md (per-bank scheme + verification flow + WARD coordination)
  - sandbox-email-draft-th.md (TH+EN bilingual, ready for Palm Friday EOD)
---

# Soraphop Bank API — TL;DR

## Recommendation

**Pick SCB Open API** as the primary `BankAdapter` concrete for Phase 1.

## Why (one paragraph)

SCB has the only documented and predictable sandbox-to-production path on the Thai market — instant self-serve sandbox, **~20 business days (~4 calendar weeks)** to production. That window matches Soraphop's Week 4–5 critical-path UC-X01 deadline if the application email goes Friday 2026-05-01 EOD. KBank has stronger product-semantic fit (Inward Remittance is the cleanest UC-X01 match) but its NDA-gated UAT + business-approval-gated production gives an estimated 4–8 week range — uncertain enough to be a critical-path risk. BBL has the simplest auth (JWT RS256) but its public product surface lacks slip verification, the dominant Thai inbound-detect mechanism. SCB additionally exposes E-Wallet QR (Alipay + WeChat) which aligns 1:1 with Soraphop's China export business — a free product-fit bonus the other two do not match.

## Sandbox lead time (the answer Palm needs first)

- **SCB**: ~4 calendar weeks (10 days doc review + 10 days UAT/PVT) — *documented* [3]
- **KBank**: 4–8 weeks (sandbox instant, UAT requires NDA, production requires approval) — community estimate [4][5]
- **BBL**: not publicly documented — must ask [6]

## Three open questions for Palm (decide this week)

1. **Which bank does สรภพ Global already use?** Same-bank inbound→outbound is the lowest-fee + lowest-reconcile-friction path. May flip the recommendation.
2. **Production fee budget?** Per `thanakan` library maintainer, direct Thai bank API access carries ~50,000 THB upfront or ~10,000 THB/month minimum [10]. None of the three banks publish this on the portal.
3. **Plan B aggregator approved?** EasySlip / SlipOK / Slip.AJ wrap multi-bank slip verification with free tiers (≤100 slips/month). Useful as a bridge during the 4-week SCB onboarding so Phase-1 dev doesn't block on bank lead time.

## What ships Friday 2026-05-01 EOD

| Artifact | Status |
|----------|--------|
| `sandbox-email-draft-th.md` (TH+EN bilingual to `Pgw-api@scb.co.th`) | ✅ ready, Palm reviews + signs + sends |
| Required attachments (company doc, signatory ID, account) | Palm gathers; LENS preps use-case description in §B.6 |

## What ships Week 1 alongside

- `BankAdapter.interface.ts` lands at `Soraphop-Project/apps/api/src/adapters/bank/BankAdapter.ts` — FORGE picks up
- Wired in `composition.ts` as `MockBankAdapter` for dev + tests until SCB UAT keys arrive (~Week 4)
- WARD adds `bank.webhook.*` event types to `audit-log-schema.md` per `webhook-signature.md` §5
- HERALD adds `errors.bank.<code>` keys per `BankAdapter.interface.ts` `failureCode` enum

## What's deliberately NOT in scope here

- **FX rate API** — separate `FxRateAdapter` per ADR-004; bank's FX is corporate-banking, not Open API. Soraphop's dual-currency display (meeting #1 #3) is informational and uses a non-bank rate source. LENS will scout `FxRateAdapter` candidates Week 2.
- **FlowAccount integration** — separate research, deferred per kickoff §12 LENS bonus scope.
- **Shipping providers (DHL / FedEx / consolidator)** — deferred per kickoff §12 LENS bonus scope.
- **Concrete adapter implementations (`ScbAdapter.ts` etc.)** — FORGE owns post-SCB-UAT-keys.

## File guide (open in this order)

1. **README.md** ← you are here. 2-minute scan of the decision.
2. **comparison.md** ← the matrix + product-fit map + risk-adjusted ranking + 5 sources.
3. **BankAdapter.interface.ts** ← paste this to Soraphop-Project. Compiles in TS strict; uses Zod + FORGE convention.
4. **webhook-signature.md** ← WARD coordination surface. Per-bank scheme + replay-window + audit log linkage.
5. **sandbox-email-draft-th.md** ← Palm sends this Friday. Bilingual, attachment list, expected response timeline.

## Plugin/adapter discipline (binding addendum compliance)

Per ADR-004:

- ✅ `BankAdapter` is a port (interface), not a class hierarchy
- ✅ Concretes (`ScbAdapter`, `KBankAdapter`, `BblAdapter`, `MockBankAdapter`) implement the same port
- ✅ Composition root (`apps/api/src/composition.ts`) is the only wiring site
- ✅ Capability flags allow business code to branch on capability, not concrete adapter type — failure isolation preserved
- ✅ Bank swap = composition-root edit only, zero touches to `walletPlugin` / `paymentsPlugin` / `claimsPlugin`
- ✅ MockBankAdapter shipped in this file enables CI without real bank credentials

## Risks captured

1. **Production fee uncertainty** — surface to Palm + Bigeye Week 1 finance call
2. **SCB submission Friday slip = Week-5 UC-X01 slip** (1:1) — owners: Palm sends Friday; LENS preps attachments
3. **mTLS lifecycle** if KBank picked instead — adds ANVIL secrets-rotation work that does not exist for SCB
4. **Hetzner egress IP for whitelist** (KBank only) — ANVIL must publish stable egress IP if KBank chosen

## Estimate vs. actual

- Work-order estimate: 3–4 hours focused (Opus 4.7)
- Actual: ~3 hours (research + 5 deliverables + 1 round of reflection on Thai inbound-detect mechanism reality vs work-order skeleton)

---

## How this report was written

LENS principle compliance:

- **Subtraction over exhaustive enumeration** — three banks, eleven criteria, one ranked recommendation. Each deliverable held to ≤ 250 lines.
- **Patterns over intentions** — anchored to documented developer experiences (Medium walkthroughs, GitHub libraries) where bank marketing was silent.
- **Form and Formless** — the comparison table is the form; the formless is one fact: SCB is the only bank publishing a sandbox-to-production *number*. That number is what Palm needs.
- **Cited every claim** — sources block at end of `comparison.md` and inline `[n]` markers throughout.
- **Advisory, not directive** — Palm decides; LENS surfaces with reasoning.

---

*— LENS Oracle 🔍 · 2026-04-27*
*— Soraphop project · Workshop family · Week 0 research*
