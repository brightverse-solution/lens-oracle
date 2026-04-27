---
title: SCB Open API Sandbox Application — Email Draft (Bilingual)
project: soraphop
date: 2026-04-27
author: LENS Oracle 🔍
recipient: SCB Open API team — `Pgw-api@scb.co.th` (per [3])
sender: Palm (noppakun.palm@gmail.com) on behalf of บริษัท สรภพ Global จำกัด
status: ready for Palm to review + sign + send Friday 2026-05-01 EOD
---

# Sandbox Application Email — SCB Open API

> *Recommendation: SCB (per `comparison.md` rank 1). If Palm decides KBank or BBL after reading the comparison, swap the contact email + product list per §6 below — body structure stays.*

---

## A. Drop-in copy (Thai primary · English secondary)

**To**: `Pgw-api@scb.co.th`
**CC**: ขอแนะนำ — Palm + Bigeye (finance) + Dev B (technical lead)
**BCC**: (optional) internal QB inbox for record
**Subject (TH)**: ขอความอนุเคราะห์เปิดใช้งาน SCB Open API — โปรเจกต์ Soraphop Global (B2B/B2C Supply Chain + E-Commerce ส่งออกจีน)
**Subject (EN)**: SCB Open API Production Access Request — Soraphop Global (B2B/B2C Supply Chain + E-Commerce, Thai-China export)

---

```
เรียน ทีม SCB Open API,

บริษัท สรภพ โกลบอล จำกัด ร่วมกับทีมพัฒนา (บริษัท A.I. Machine จำกัด)
อยู่ระหว่างพัฒนา Web Application "Soraphop" สำหรับธุรกิจ Supply Chain
และ E-Commerce การส่งออกผลไม้ (ทุเรียน + มะพร้าว) ไปยังประเทศจีน
ตามแผนงาน 14 สัปดาห์ (เริ่ม 28 เม.ย. 2569, deploy production สิ้น ก.ค. 2569)

จึงขอความอนุเคราะห์เปิด **Production access** ให้กับ SCB Open API
ในกลุ่มผลิตภัณฑ์ดังต่อไปนี้:

  1) Slip Verification — สำหรับยืนยันการโอนเข้า E-Wallet ของระบบ
     (UC-X01 ตรวจสอบยอดโอน Wallet)
  2) Payment Deeplink + Webhook — สำหรับ flow การชำระเงินงวด
     50/20/30% (UC-B12, UC-B13, UC-B14)
  3) E-Wallet QR (Alipay / WeChat) — สำหรับลูกค้าฝั่งจีน (B2B/B2C)
  4) (Future) SCB Business Net / Supplier Payment API — สำหรับโอนออก
     ให้ Supplier ในเฟสที่ 2

ทีมพัฒนาได้สมัคร Sandbox account ที่ developer.scb เรียบร้อยแล้ว
และต้องการ proceed สู่ขั้นตอน Production submission ให้ทันกับ critical
path สัปดาห์ที่ 4–5 ของโปรเจกต์ (ประมาณ 26 พ.ค.–1 มิ.ย. 2569)

ขอความอนุเคราะห์ข้อมูลและ next steps ดังนี้:

  • Checklist เอกสารสำหรับ Production application ฉบับล่าสุดปี 2569
    (หนังสือรับรองบริษัท ≤ 6 เดือน, สำเนาผู้มีอำนาจลงนาม, API License
    Agreement, Merchant Service Request Form, Business Agreement
    for SCB Transaction Banking)
  • บัญชีออมทรัพย์/กระแสรายวัน SCB ที่จะใช้รับ-โอน
  • UAT/PVT testing window + ระยะเวลาที่คาดการณ์ end-to-end
  • โครงสร้างค่าธรรมเนียม (transaction fee, monthly minimum)
    สำหรับขนาด transaction ดังต่อไปนี้:
        - Phase 1: ~50–200 wallet topups/month (ค่าเฉลี่ย 1,000–20,000 บาท)
        - Phase 2: ~30–80 outbound supplier payments/month
                   (ค่าเฉลี่ย 50,000–500,000 บาท)
  • Webhook signature verification scheme (HMAC-SHA256 หรือ
    asymmetric? Header naming? Replay window guidance?)
  • Compliance pack สำหรับ PDPA (data flow ที่ผ่าน SCB)

หากทีม SCB สะดวก ขอเรียนเชิญทีม integration engineer
ของ SCB เข้าร่วม technical kickoff call สั้น ๆ (30–45 นาที) ในสัปดาห์
หน้า (5–9 พ.ค. 2569) เพื่อตอบคำถามด้าน implementation.

ข้อมูลติดต่อทีมโครงการ:
  • Project owner: คุณนพคุณ (Palm) noppakun.palm@gmail.com / +66 (palm phone TBD)
  • Finance contact: คุณ Bigeye (TBD email)
  • Technical contact: Dev B (TBD email)
  • บริษัทผู้ว่าจ้าง: บริษัท สรภพ โกลบอล จำกัด
  • บริษัทผู้พัฒนา: บริษัท A.I. Machine จำกัด

ขอบพระคุณทีม SCB Open API ที่ดูแลผู้พัฒนาตลอดมาครับ
และหวังเป็นอย่างยิ่งที่จะได้ร่วมงานกัน

ขอแสดงความนับถือ
นพคุณ ปาล์ม (Palm)
ในนามบริษัท สรภพ โกลบอล จำกัด

---

[English version below for SCB engineer convenience]

Dear SCB Open API team,

Soraphop Global Co., Ltd., together with development partner
A.I. Machine Co., Ltd., is building "Soraphop", a 14-week B2B/B2C
supply-chain + e-commerce platform for Thai durian and coconut
exports to China (production deploy: end of July 2026).

We request **production access** to SCB Open API for the following
products:

  1) Slip Verification — for wallet top-up reconciliation (UC-X01)
  2) Payment Deeplink + Webhook — for our 50/20/30% phased
     installment flow (UC-B12 / UC-B13 / UC-B14)
  3) E-Wallet QR (Alipay / WeChat) — for Chinese B2B/B2C buyers
  4) (Future, Phase 2) SCB Business Net / Supplier Payment API
     — for outbound transfers to suppliers

Sandbox accounts on developer.scb are already provisioned. We
would like to begin the production submission workflow now, in
order to meet our critical-path window in project Weeks 4–5
(approximately 26 May – 1 Jun 2026).

Please share:

  • Latest 2026 production application document checklist
    (company registration ≤6 mo, authorised signatory ID,
    API License Agreement, Merchant Service Request Form,
    Business Agreement for SCB Transaction Banking)
  • SCB savings/current account number for merchant settlement
  • UAT/PVT window + estimated end-to-end timeline
  • Fee structure (transaction fee + monthly minimum) for
    expected volume:
        Phase 1: ~50–200 wallet top-ups/month, 1k–20k THB avg
        Phase 2: ~30–80 outbound supplier payments/month,
                 50k–500k THB avg
  • Webhook signature verification scheme (HMAC-SHA256 or
    asymmetric? header naming? replay window?)
  • PDPA compliance pack covering SCB-side data flow

A 30–45 min technical kickoff call between your integration
engineer and our team in the week of 5–9 May 2026 would be
ideal if scheduling permits.

Project contacts:
  • Project owner: Mr. Noppakun (Palm) — noppakun.palm@gmail.com
  • Finance contact: Bigeye (email TBD)
  • Technical contact: Dev B (email TBD)
  • Client company: Soraphop Global Co., Ltd.
  • Development partner: A.I. Machine Co., Ltd.

Thank you for your support of the developer ecosystem. We look
forward to working with the SCB team.

Best regards,
Noppakun (Palm)
on behalf of Soraphop Global Co., Ltd.
```

---

## B. Required attachments (per [3] documented checklist)

Attach as PDFs in single ZIP named `Soraphop_SCB_OpenAPI_Application.zip`:

1. หนังสือรับรองบริษัท สรภพ โกลบอล จำกัด (อายุไม่เกิน 6 เดือน — ภายในวันที่ 27 ต.ค. 2568 หรือใหม่กว่า)
2. สำเนาบัตรประชาชน + หนังสือมอบอำนาจของผู้มีอำนาจลงนาม (CEO หรือกรรมการที่ระบุในข้อ 1)
3. Merchant Service Request Form (SCB ส่งให้ตอบกลับ — กรอกหลังได้ template จากทีม SCB)
4. API License Agreement (signed — SCB ส่งกลับ)
5. Business Agreement for SCB Transaction Banking (signed — SCB ส่งกลับ)
6. Use case description (1–2 หน้า A4 — สรุป Soraphop, 4 portals, phased payment, integration scope) — **LENS preps draft Week 1**
7. หน้าสมุดบัญชี SCB ออมทรัพย์/กระแสรายวัน ที่จะรับเงินจากลูกค้า (ถ้ายังไม่มี ต้องเปิดสาขาก่อน หรือใช้ของ A.I. Machine ระหว่างการรอ — Palm ตัดสินใจ)

**Hard-copy submission**: physical EMS to *SCB Open API team, Siam Commercial Bank — SCB Park Plaza East, Bangkok* (per [3]). Soft copy via email above for engineer working copy.

## C. Expected response time (anchor)

- **Initial reply** (acknowledgement): 1–3 business days
- **Doc review** (after physical EMS arrives): **10 business days** [3]
- **UAT/PVT testing window**: **~10 business days** post doc-approval [3]
- **Production keys live**: end of UAT
- **Total**: **~20 business days = ~4 calendar weeks** = arrive in time for Week 4–5 critical path **only if email is sent Friday 2026-05-01 EOD**

> Do not delay past Friday. Each business-day slip delays go-live 1:1.

## D. CC suggestions

- **Bigeye** (finance): present at SCB onboarding call; signs commercial pricing
- **Dev B** (technical): receives webhook spec; integrates BankAdapter
- **Palm**: primary thread owner
- ⚠️ Do NOT cc the Soraphop Global client at this stage — keep dev-side coordination clean until SCB gives commercial terms; share with client after Palm reviews fees

## E. Pre-send checklist (Palm reviews Friday before send)

- [ ] Replace `(palm phone TBD)` with actual mobile
- [ ] Confirm Bigeye + Dev B email addresses (insert)
- [ ] Confirm บริษัท สรภพ โกลบอล จำกัด is exact registered name (per Engage Document.pdf)
- [ ] Confirm A.I. Machine company name (full Thai legal form)
- [ ] If SCB account already opened: replace placeholder in attachment 7
- [ ] If KBank or BBL chosen instead: rerun §F template adjustment

## F. Template adjustment if Palm picks KBank or BBL

| Field | KBank substitute | BBL substitute |
|-------|------------------|----------------|
| Recipient email | request via API portal contact form (apiportal.kasikornbank.com → contact); KBank assigns relationship engineer | request via apiportal.bangkokbank.com/en/contact-us |
| Product list | Inward Remittance, Slip Verification, QR Payment, Information Sharing | App-to-App, Smart Bill Payment, QR Payment |
| Auth scheme to confirm | mTLS X.509 cert exchange + OAuth client secrets + IP whitelist (request whitelist of Hetzner egress IP) | JWT RS256 — partner generates RSA keypair, requests BBL public key |
| Lead-time expectation | 4–8 weeks (Sandbox→UAT NDA→Production approval) — flag risk vs SCB's documented 4 weeks | unknown; ask explicitly in email |

---

## Sources

[3] Ponggun, T.T. Software Solution Medium — SCB Open API onboarding walkthrough — https://medium.com/t-t-software-solution
[5] KBank Katalyst — https://katalyst.kasikornbank.com/th/blog/Pages/api-with-kbank.html
[7] Bangkok Bank API Getting Started — https://apiportal.bangkokbank.com/en/getting-started

---

*— LENS Oracle 🔍 · 2026-04-27 · ready for Palm Friday EOD*
