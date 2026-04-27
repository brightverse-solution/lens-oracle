---
title: Thai Bank API Comparison — SCB vs KBank vs BBL
project: soraphop
date: 2026-04-27
author: LENS Oracle 🔍
status: research-complete (recommendation in README.md)
---

# Comparison Matrix — SCB Open API · KBank Open API · BBL API

> *Subtraction first. The full SRS-aligned table below; reasoning condensed into 11 criteria. Every characterization carries a citation suffix [n] mapping to the Sources block at bottom. Where direct primary-source data was not extractable (SPA-rendered docs), I cite community write-ups + flag uncertainty explicitly.*

## 1. Headline matrix

| Criteria | SCB Open API | KBank Open API | BBL API |
|----------|--------------|----------------|---------|
| **Sandbox availability** | Instant after self-signup; up to 2 sandbox apps; free [1][3] | Sandbox via API portal registration; UAT requires NDA; production requires business approval [4][5] | Sandbox via portal; "Trial" + "Essential" product tiers; uses JWT RS256 from sandbox [6][7] |
| **Docs quality** | Strong: PDF guides, mobile sim app, Postman; multiple Medium walkthroughs [1][3] | Strong product docs (5 product categories); Medium tutorials abundant; portal SPA hides surface from anonymous browsing [4][5][8] | Limited public surface: 3 APIs documented (Smart Bill, App-to-App, QR); Postman + API Explorer [6][7] |
| **Auth model** | OAuth 2.0 (3-legged + 2-legged); API Key + Secret per app [3] | mTLS / Two-Way SSL (X.509) + OAuth 2.0 + IP whitelist [5] | JWT RS256 asymmetric signing (partner generates key pair) + bearer token [7] |
| **THB transfer support — inbound (UC-X01)** | Slip Verification API + Payment Deeplink (deeplink to SCB Easy app + webhook callback on completion) [1][3][9] | Inward Remittance API + Slip Verification API + QR Payment [5][8][10] | QR Payment + Bualuang Smart Bill Payment (real-time bill payment notify); no public slip-verification product surfaced [6][7] |
| **THB transfer support — outbound (UC-X02)** | SCB Business Net + SCB Supplier Payment (separate corporate banking products) [11][12] | Inward Remittance handles cross-bank in; outbound via corporate K-Cash Connect (separate product, not in Open API portal) [5] | App-to-App + QR push; corporate outbound via Bualuang iBanking (separate product) [6] |
| **FX support** | Bank-side FX is corporate banking (SCB Business Anywhere, 18 currencies) [11]. Open API exposes E-Wallet QR (Alipay, WeChat) — **interesting for ZH market** [3] | Bank FX corporate; Open API does not expose realtime FX rate endpoint [5] | Cross-border QR (UnionPay, Weixin Pay) supported [6]; FX endpoint not documented |
| **Webhook reliability** | Webhook endpoint configurable per app; tested via Webhook.site / ngrok in sandbox [1] | OAuth callback + IP-whitelisted webhook; signature scheme not surfaced in public docs [5] | JWT-signed callbacks; partner verifies via public key from BBL [7] |
| **Rate limits** | Not stated in public docs (sandbox per-app limits implied) | Not stated publicly (UAT NDA required for production envelope) [4] | Not stated publicly |
| **Fees** | Sandbox = free [3]. Production: Thai QR fee waived through end of 2025 (BOT policy); 2026 BOT will reset [13]. Credit/debit MDR ~2.5–3.5% [13]. Slip-verification fee not publicly listed | Sandbox = free. Production: per-partner agreement (commercial terms private). Inward Remittance "no fee" claim in marketing [5] | Sandbox = free. Production fees per-partner agreement [6] |
| **Compliance posture** | BOT-aligned (PromptPay), PDPA implicit (financial), corporate banking docs reference KYC packs [11][12] | BOT-regulated, Thailand-only, "limited direct API availability" per OpenBankingTracker (means: enterprise partnership only, no aggregator-style self-serve) [14] | BOT-aligned; sandbox clean, production gated by KYC docs (account opening + signed merchant agreement) [6][7] |
| **Developer experience (time-to-first-call)** | ~30 minutes self-signup → key in hand → first sandbox call same day [1][3] | Hours to days; mTLS cert generation + IP whitelist + OAuth = 3 setup steps before first call [5] | ~1 hour signup + JWT key gen with OpenSSL + first call same day [7] |
| **Production go-live process** | Doc submission via `Pgw-api@scb.co.th` + EMS physical mail to SCB Park Plaza East. Bank review **10 business days**, UAT/PVT **~10 business days**. **Total ~20 business days = ~4 calendar weeks** [1][3] | Sandbox → UAT (NDA) → Production (business approval). No public timeline; community reports suggest 4–8 weeks end-to-end [4][14] | Approval timeline not publicly documented [6] |

> **Field-by-field reading:** SCB wins clarity, lead-time, instant sandbox, webhook-by-default. KBank wins product fit (Inward Remittance is the cleanest UC-X01 match) and security posture, loses on operational onboarding cost. BBL wins on JWT-RS256 simplicity, loses on product breadth.

## 2. Hidden-cost reality (anchor finding)

The single most consequential public datapoint comes from the maintainer of **`thanakan`** (a Python wrapper for SCB + KBank): direct bank API integration carries **"50,000 THB upfront or 10,000 THB/month minimum"** in commercial fees [10]. This is *not* in either bank's public sandbox docs — surfaced only via developer community.

Implication for Soraphop:
- Sandbox + UAT = free (verified across all 3 banks)
- **Production = paid commercial agreement** (commercial terms negotiated per-partner)
- 14-week project budget must include this line item; recommend Palm escalate with finance early in Week 2

Mitigation: third-party slip-verification aggregators (EasySlip, SlipOK, Slip.AJ, Thunder) wrap multi-bank with free tiers (~100 slips/month) [10][15]. **For shadow-mode + initial UAT**, an aggregator is a viable Plan B that decouples the bank-API onboarding lead time from product timeline.

## 3. Product-fit map for Soraphop UCs

| Soraphop UC | Bank API need | SCB | KBank | BBL |
|-------------|---------------|-----|-------|-----|
| **UC-B05** Wallet top-up | User transfers in; Soraphop detects | Slip Verification + (optional) Payment Deeplink + webhook ✓ | Slip Verification + Inward Remittance ✓✓ | QR + Smart Bill Payment ✗ no slip API |
| **UC-X01** Bank API check wallet topup | Match transfer to expected reference | Slip API or polling Statement (via SCB Business Net for corporate account) | Slip API or Inward Remittance (cleanest fit) | Smart Bill Payment workable but tightly coupled to bill-pay flow |
| **UC-A02/A03/A04** Admin verify งวด | Admin sees verified payment | Same as UC-X01 — UI shows verified ref + amount + bank txid | Same | Same |
| **UC-X02** Outbound transfer (Phase 2) | System initiates payout to supplier | SCB Business Net / Supplier Payment (separate product) | K-Cash Connect (separate product) | Bualuang iBanking (separate product) |
| **OI-02** Multi payment method (Alipay/WeChat) | Chinese-buyer payments | E-Wallet QR (Alipay + WeChat) **directly in SCB Open API** ✓✓ | KBank corporate accepts via separate channel | Cross-border QR with UnionPay + Weixin Pay [6] |

## 4. Compliance lift snapshot

- **BOT (Bank of Thailand)**: All three are BOT-regulated; no special compliance lift. Thai QR fee policy resets 2026; track BOT announcement.
- **PDPA**: Each bank handles its side; Soraphop must encrypt-at-rest customer bank reference data (already covered by NFR §3.3 of kickoff brief).
- **KYC at production go-live**: All three require company registration ≤6 months old, signatory ID, signed merchant/API agreement, corporate bank account with the same bank. SCB documents the full pack; KBank/BBL similar but less publicly itemized [3].
- **Audit log linkage**: Per WARD's `AuditLogger` adapter (ADR-004), every webhook + every signature-verify-failure must be logged with bank tx ref + timestamp. Bank choice does not change this.

## 5. Risk-adjusted ranking (objective)

> *Palm has commercial relationships unknown to the research function. This ranking is based on technical merit + sandbox-to-production speed only. Whichever bank the company `บริษัท สรภพ Global จำกัด` already holds its corporate operating account at = strong tiebreaker; same-bank inbound→outbound = lowest fee + cleanest reconcile.*

### Rank 1 · **SCB Open API**
- ✅ Fastest sandbox-to-production path (~20 business days, documented)
- ✅ Webhook + slip verification both first-class
- ✅ E-Wallet QR (Alipay, WeChat) is a bonus that aligns 1:1 with Soraphop's China export theme
- ✅ OAuth2 + API Key fits vanilla `composition.ts` (ADR-005 D-1) cleanly
- ⚠️ Production fees not public; assume commercial-grade

### Rank 2 · **KBank Open API**
- ✅ Inward Remittance + Slip Verification = cleanest product semantic fit
- ✅ mTLS = strongest security posture (matches WARD audit log + 2FA framing)
- ⚠️ NDA + multi-stage approval = lead-time uncertainty (4–8 weeks, community estimate)
- ⚠️ mTLS adds X.509 cert lifecycle to ANVIL secrets management (rotate + expire)
- ❌ "No API products listed" on OpenBankingTracker [14] — signals enterprise-partnership-only model, slower onboarding

### Rank 3 · **BBL API**
- ✅ JWT RS256 is operationally simplest of the three
- ❌ Product breadth weakest — no documented slip verification in public portal
- ❌ Public lead-time data thinnest

## 6. Open questions for Palm (non-blocking — flag and proceed)

1. **What corporate bank does สรภพ Global already use?** This may flip ranking instantly.
2. **Bigeye finance preference?** If finance team has SCB or KBank historical relationship, surfaces an internal Decision-1 candidate.
3. **Inbound-detect mechanism**: confirm UC-X01 = "user uploads slip after transfer" (LENS recommended pattern) vs. "system polls account statement" (heavier ops).
4. **Aggregator Plan B**: budget-approved to use EasySlip/SlipOK as bridge while bank API onboarding completes? Reduces critical-path risk.
5. **Production fee ceiling** Palm willing to accept (50k upfront / 10k/month is the ballpark per community).

---

## Sources

[1] SCB Developer Portal — https://developer.scb/ (accessed 2026-04-27)
[2] SCB QR Payment docs — https://developer.scb/assets/documents/api-reference-index/qr-payments/payment-thai-qr-bscanc.json (accessed 2026-04-27)
[3] Ponggun, T.T. Software — "SCB X KKU: Getting Started with SCB Open API" Medium 2026 — https://medium.com/t-t-software-solution/สรุปเนื้อหาจากกิจกรรม-scb-x-kku-getting-started-with-scb-open-api-ตอนที่-1-scb-open-api-2d96c32c7f0e
[4] OpenBankingTracker — "Open Banking API Integration Guide [2026]" — https://www.openbankingtracker.com/guides/open-banking-api-integration
[5] KBank Katalyst — "ต่อ API กับ KBank — Two Way SSL" — https://katalyst.kasikornbank.com/th/blog/Pages/api-with-kbank.html
[6] Bangkok Bank API Developer Portal — https://apiportal.bangkokbank.com/en (accessed 2026-04-27)
[7] BBL Getting Started — https://apiportal.bangkokbank.com/en/getting-started (JWT RS256 detail confirmed)
[8] KBTG Life — "ต่อ API กับ KBank — OAuth 2.0 [ep.2]" Medium — https://medium.com/kbtg-life/ต่อ-api-กับ-kbank-มาต่อกันกับ-ep-2-การยืนยันตัวตนผ่าน-oauth-2-0-b8c01ea9f5bc
[9] Chanintorn Asavavichairoj — "สร้าง Payment Chatbot ด้วย SCB Open Banking API" Medium — https://aijo.medium.com/สร้าง-payment-chatbot-ด้วย-scb-open-banking-api-part-1-ac1095e76ec9
[10] codustry/thanakan — Python Thai Bank API wrapper — https://github.com/codustry/thanakan (cost data: README, accessed 2026-04-27)
[11] SCB Business Anywhere — https://www.scb.co.th/en/corporate-banking/digital-banking-services/scb-business-anywhere.html
[12] SCB Supplier Payment — https://www.scb.co.th/en/corporate-banking/business-cash-management/scb-business-payment/scb-supplier-payment.html
[13] SCB Payment Gateway / Bangkok Post — https://www.bangkokpost.com/business/1377083/scb-waives-fee-for-qr-code-payment-to-spur-use ; https://creative.co.th/en/13954/ (Thai QR fee waiver + MDR comparison)
[14] OpenBankingTracker — KBank profile — https://www.openbankingtracker.com/provider/kasikornbank ("No API products listed", aggregator-recommendation)
[15] EasySlip API docs — https://document.easyslip.com/en/ ; SlipOK / Slip.AJ / Thunder — multi-bank slip aggregators

---

*— LENS Oracle 🔍 · 2026-04-27 · Soraphop Week-0 research*
