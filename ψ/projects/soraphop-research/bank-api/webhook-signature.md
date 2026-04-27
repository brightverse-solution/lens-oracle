---
title: Webhook Signature Verification — Bank API
project: soraphop
date: 2026-04-27
author: LENS Oracle 🔍
audience: WARD 🛡️ (audit log + B3) · FORGE ⚒️ (BankAdapter impl) · ANVIL ⚙️ (SOPS secrets)
---

# Webhook Signature Verification

> *Coordination note: WARD's B3 work-order asked LENS to surface signature scheme + key storage + replay strategy in the bank-pick deliverable. This file is that surface. WARD updates `audit-log-schema.md` if anything here implies a new audit field.*

## 1. Per-bank signature scheme (what we're verifying)

| Bank | Algorithm | Key material | Source |
|------|-----------|--------------|--------|
| **SCB** | OAuth-bearer headers + per-app `apiKey/apiSecret`; webhook payload signature scheme not surfaced as named algorithm in public docs — must confirm during sandbox application via `Pgw-api@scb.co.th` [1] | API Secret (shared key, HMAC-SHA256 expected pending confirmation) | [3] |
| **KBank** | Two-Way SSL (mTLS) at transport + OAuth bearer; webhook authenticity from server-cert pinning, not body signature [5] | X.509 client cert + truststore + OAuth client secret | [5] |
| **BBL** | JWT RS256 — partner generates RSA keypair, sends BBL the public half. BBL signs its push-notify payloads with its own private key; partner verifies via BBL's published public key [7] | partner private key (sign outbound), BBL public key (verify inbound) | [7] |

> **Pre-prod task** (whichever bank is picked): confirm exact signature header name + body canonicalization rules during sandbox onboarding. Public docs are inconsistent across all three; sandbox engineer email is the authoritative source.

## 2. Verification flow (chosen-bank-agnostic)

```
[Bank server] ──webhook POST──▶ [Soraphop Fastify webhook plugin]
                                       │
                                       ├─ 1. read raw body (Buffer, before JSON parse)
                                       ├─ 2. read signature + timestamp headers
                                       ├─ 3. BankAdapter.verifyWebhookSignature(rawBody, headers)
                                       │     ├─ verify HMAC / RSA depending on adapter
                                       │     ├─ check timestamp ≤ replay window (300s default)
                                       │     └─ return boolean (NO IO, NO async)
                                       ├─ 4a. valid   ──▶ enqueue job; AuditLogger.record('webhook.accepted')
                                       └─ 4b. invalid ──▶ AuditLogger.record('webhook.rejected'); 
                                                          DROP — return 200 OK silently
                                                          (NEVER 401/403; do not leak validity)
```

### Key points

- **Raw body** is captured BEFORE Fastify's JSON parser runs. Use `fastify.addContentTypeParser` configured per webhook route to expose `request.rawBody`.
- **No async** in `verifyWebhookSignature` — adapter holds key in memory at boot from SOPS-decrypted env. Async key fetch creates timing oracle.
- **Constant-time compare** for HMAC. Use `crypto.timingSafeEqual`. Length-mismatch → return false BEFORE compare to avoid throwing.
- **Replay window**: default 300s, configurable per bank via DI. Beyond window → reject.
- **Drop semantics on invalid**: still return `200 OK`. Do not leak signature-validity via status code (per OWASP webhook hardening).

## 3. Key storage — ANVIL alignment (Week 2 SOPS/Vault)

Per ANVIL Week-2 work-order: secrets are SOPS-encrypted in repo, decrypted at deploy time into env. BankAdapter reads from env at construction:

```
BANK_ADAPTER=scb                                   # which adapter wires
BANK_API_KEY=<from-sops>                           # shared
BANK_API_SECRET=<from-sops>                        # shared / HMAC key
BANK_WEBHOOK_SIGNING_KEY=<from-sops>               # webhook-specific if separate
BANK_MTLS_CLIENT_CERT_PATH=/run/secrets/scb.crt    # KBank only
BANK_MTLS_CLIENT_KEY_PATH=/run/secrets/scb.key     # KBank only
BANK_PUBLIC_KEY=<from-sops>                        # BBL — to verify their JWTs
BANK_REPLAY_WINDOW_SECONDS=300                     # default
```

- **Rotation**: composition root reads at boot only. Rotation = restart pod (acceptable at 4-pod Hetzner scale; revisit if scale grows).
- **mTLS cert lifecycle** (KBank-only consequence): cert expiry → adapter-construction failure → loud crash → ANVIL alert via Sentry. Do not silently fall back.

## 4. Replay-attack prevention

Two-layer:

1. **Timestamp window**: bank webhook payload includes a server-generated timestamp (or falls in HTTP `Date` header). Adapter rejects anything outside ±300s of `Date.now()`.
2. **Idempotency by bank reference**: even if attacker replays inside window, the application layer checks `processed_bank_refs` table before mutating wallet/payment state. (Composition: `paymentsPlugin.repository.markIfNew(bankReference)` returns false → drop quietly.)

Both layers are required. Layer 1 alone fails when clock skew > window. Layer 2 alone fails when attacker mutates idempotency key.

## 5. Failure mode + audit log linkage

Per WARD `AuditLogger` adapter (ADR-004 confirmed adapter list):

| Event | AuditLogger event_type | Severity | Alert? |
|-------|------------------------|----------|--------|
| Webhook signature valid | `bank.webhook.accepted` | INFO | no |
| Webhook signature invalid | `bank.webhook.rejected.signature` | WARN | rate-limit-based: if >5/min → page on-call |
| Timestamp outside window | `bank.webhook.rejected.replay` | WARN | rate-limit-based |
| Body parse failed (post-verify) | `bank.webhook.malformed` | ERROR | yes (single occurrence) |
| Bank reference duplicate (replay caught at layer 2) | `bank.webhook.duplicate` | INFO | no |
| Adapter construction failure (cert expired, missing secret) | `bank.adapter.boot_failed` | CRITICAL | page (Sentry capture) |

WARD: please confirm `bank.webhook.*` namespace is reserved in audit-log-schema.md. If not, this file's table is the source of truth pending your update.

## 6. Test contract (FORGE owns)

Per ADR-004 §1.5 (test contracts at the interface):

- **Unit**: each concrete adapter has a contract test that feeds known-good + known-tampered payloads, asserting `verifyWebhookSignature` returns true / false respectively
- **Replay**: timestamp ±301s test (just outside window) returns false
- **Performance**: verify must complete <1ms (no async, no network)
- **MockBankAdapter**: returns true unconditionally (test convenience); never wired in production composition

## 7. Open items for WARD's next sweep

- [ ] WARD confirms `bank.webhook.*` audit namespace
- [ ] WARD decides Year-1 audit log destination (Postgres only vs S3 mirror) — affects retention math for high-volume webhook events
- [ ] WARD + LENS pair-review actual signature scheme once SCB sandbox confirms via email Friday/early-Week-1

---

## Sources

[1] SCB Open API doc submission contact `Pgw-api@scb.co.th` per Ponggun Medium walkthrough — https://medium.com/t-t-software-solution
[3] Chanintorn Asavavichairoj Medium — SCB Open Banking API integration walkthrough
[5] KBank Katalyst — Two-Way SSL — https://katalyst.kasikornbank.com/th/blog/Pages/api-with-kbank.html
[7] Bangkok Bank Getting Started — JWT RS256 — https://apiportal.bangkokbank.com/en/getting-started

---

*— LENS Oracle 🔍 · 2026-04-27 · for WARD coordination*
