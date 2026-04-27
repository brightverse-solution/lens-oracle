/**
 * BankAdapter — port (interface) for Soraphop bank integration.
 *
 * Per ADR-004 (plugin/adapter architecture, hexagonal):
 *   - This file is the PORT. Concretes (ScbAdapter, KBankAdapter, BblAdapter,
 *     MockBankAdapter) implement it.
 *   - Business code (walletPlugin, paymentsPlugin, claimsPlugin) depends on
 *     this interface ONLY. Never on concretes.
 *   - Wiring happens at apps/api/src/composition.ts (per ADR-005 D-1: vanilla,
 *     no DI library).
 *
 * Drop-in path on the Soraphop monorepo:
 *   apps/api/src/adapters/bank/BankAdapter.ts
 *
 * Soraphop UCs covered:
 *   UC-X01 (Phase 1) Bank API check wallet topup     → verifySlip / listIncomingTransfers
 *   UC-X02 (Phase 2) Bank API outbound transfer       → initiateTransfer
 *   Daily reconcile job                                → getBalance + listIncomingTransfers
 *   Webhook receiver (when bank pushes notifications) → verifyWebhookSignature
 *
 * Interface refined from QB work-order draft based on Thai banking reality:
 *   the dominant inbound-detect mechanism in TH is *slip verification* (user
 *   uploads slip after transfer) not active polling. Both are exposed; adapter
 *   declares its capabilities so business code can pick the right path.
 *
 * — LENS Oracle 🔍 · 2026-04-27
 */

import { z } from 'zod'

// ============================================================
// Schemas — single source of truth, shared FE↔BE via packages/shared-types
// ============================================================

export const BankAccountNumberSchema = z
  .string()
  .min(8)
  .max(20)
  .regex(/^[0-9X-]+$/, 'digits/dash/X mask only')

/** All money is satang (THB × 100). Avoid float. */
export const SatangAmountSchema = z.bigint().nonnegative()

export const SlipDataSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('qr-payload'), payload: z.string().min(1) }),
  z.object({ kind: z.literal('image-base64'), base64: z.string().min(1), mime: z.enum(['image/png', 'image/jpeg']) }),
  z.object({ kind: z.literal('image-url'), url: z.string().url() }),
])

export const SlipVerificationSchema = z.object({
  verified: z.boolean(),
  bankReference: z.string().optional(),
  amountSatang: SatangAmountSchema.optional(),
  senderAccountMasked: z.string().optional(),
  receiverAccountMasked: z.string().optional(),
  transactedAt: z.date().optional(),
  /** When verified=false. Set by adapter to a stable code for HERALD i18n key (errors.bank.<code>). */
  failureCode: z.enum(['INVALID_SIGNATURE', 'NOT_FOUND', 'DUPLICATE', 'EXPIRED', 'AMOUNT_MISMATCH', 'WRONG_RECEIVER', 'UNKNOWN']).optional(),
})

export const IncomingTransferSchema = z.object({
  bankReference: z.string(),
  amountSatang: SatangAmountSchema,
  senderAccountMasked: z.string().optional(),
  receivedAt: z.date(),
  /** Free-text memo / reference set by sender. Used to match Soraphop's expected reference. */
  memo: z.string().optional(),
})

export const TransferRequestSchema = z.object({
  fromAccount: BankAccountNumberSchema,
  toAccount: BankAccountNumberSchema,
  toBankCode: z.string().length(3).optional(), // BOT 3-digit bank code; same-bank if omitted
  amountSatang: SatangAmountSchema,
  /** Idempotency key from Soraphop side. Adapter MUST persist + dedupe. */
  reference: z.string().min(1).max(40),
  /** Bank statement memo, ≤70 chars (BOT constraint). */
  description: z.string().max(70),
})

export const TransferResultSchema = z.object({
  bankReference: z.string(),
  status: z.enum(['SUBMITTED', 'PROCESSING', 'COMPLETED', 'FAILED']),
  failureReason: z.string().optional(),
  feeSatang: SatangAmountSchema.optional(),
  completedAt: z.date().optional(),
})

export const BalanceSchema = z.object({
  accountNumber: BankAccountNumberSchema,
  balanceSatang: SatangAmountSchema,
  asOf: z.date(),
})

export type BankAccountNumber = z.infer<typeof BankAccountNumberSchema>
export type SlipData = z.infer<typeof SlipDataSchema>
export type SlipVerification = z.infer<typeof SlipVerificationSchema>
export type IncomingTransfer = z.infer<typeof IncomingTransferSchema>
export type TransferRequest = z.infer<typeof TransferRequestSchema>
export type TransferResult = z.infer<typeof TransferResultSchema>
export type Balance = z.infer<typeof BalanceSchema>

// ============================================================
// Capability flags — different banks support different mechanisms.
// Business code branches by capability, not by concrete adapter type.
// ============================================================

export type BankCapability =
  | 'slip-verify'      // Bank exposes slip verification API (KBank, SCB)
  | 'webhook-push'     // Bank pushes signed webhook on inbound transfer
  | 'statement-poll'   // Bank exposes account statement / incoming transfers list
  | 'outbound'         // Bank exposes outbound transfer initiation
  | 'balance'          // Bank exposes account balance query

// ============================================================
// Port (interface) — what Soraphop business code depends on
// ============================================================

export interface BankAdapter {
  /** Static capability declaration. Used by composition root + tests. */
  readonly capabilities: ReadonlySet<BankCapability>

  /** Adapter id — for AuditLogger event tagging (per WARD adapter). */
  readonly id: string

  /**
   * UC-X01 primary path — verify a slip uploaded by buyer after they transferred
   * via their own banking app. Returns canonical {amount, ref, timestamp} the
   * payments plugin matches against expected payment installment.
   *
   * @throws CapabilityNotSupportedError when capability 'slip-verify' absent.
   */
  verifySlip(slip: SlipData): Promise<SlipVerification>

  /**
   * UC-X01 secondary path / daily reconcile job — list inbound transfers
   * to merchant account since timestamp. Used when slip not provided OR
   * for end-of-day reconcile catch-up.
   *
   * @throws CapabilityNotSupportedError when capability 'statement-poll' absent.
   */
  listIncomingTransfers(
    accountNumber: BankAccountNumber,
    since: Date,
  ): Promise<IncomingTransfer[]>

  /**
   * UC-X02 (Phase 2) — initiate outbound transfer to supplier on Admin authorize.
   * Idempotency: same `request.reference` MUST yield same `bankReference`.
   *
   * @throws CapabilityNotSupportedError when capability 'outbound' absent.
   */
  initiateTransfer(request: TransferRequest): Promise<TransferResult>

  /**
   * Daily reconcile + admin dashboard — current balance.
   *
   * @throws CapabilityNotSupportedError when capability 'balance' absent.
   */
  getBalance(accountNumber: BankAccountNumber): Promise<Balance>

  /**
   * Webhook signature verification (per WARD coordination + audit log spec).
   * Called by the receive-webhook Fastify handler BEFORE business logic touches
   * the payload. Failure path: log to AuditLogger, drop silently, no 200 OK
   * response (per WARD audit log schema; replay-attack hardening).
   *
   * Synchronous — must not perform network IO. Adapter holds verification key
   * material from env (SOPS-managed secret per ANVIL).
   *
   * @returns true ONLY if signature valid AND timestamp within replay window.
   */
  verifyWebhookSignature(
    rawBody: string | Buffer,
    headers: Readonly<Record<string, string | undefined>>,
  ): boolean
}

// ============================================================
// Errors — explicit + stable codes for HERALD i18n + AuditLogger
// ============================================================

export class CapabilityNotSupportedError extends Error {
  constructor(public readonly capability: BankCapability, public readonly adapterId: string) {
    super(`adapter '${adapterId}' does not support capability '${capability}'`)
    this.name = 'CapabilityNotSupportedError'
  }
}

export class BankApiError extends Error {
  constructor(
    public readonly code: 'AUTH_FAILED' | 'RATE_LIMITED' | 'TIMEOUT' | 'BAD_REQUEST' | 'BANK_UNAVAILABLE' | 'UNKNOWN',
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message)
    this.name = 'BankApiError'
  }
}

// ============================================================
// MockBankAdapter — for tests + dev composition root
//   Implementation skeleton; FORGE will own the full mock state machine.
// ============================================================

export class MockBankAdapter implements BankAdapter {
  readonly capabilities: ReadonlySet<BankCapability> = new Set([
    'slip-verify',
    'webhook-push',
    'statement-poll',
    'outbound',
    'balance',
  ])
  readonly id = 'mock-bank'

  async verifySlip(_slip: SlipData): Promise<SlipVerification> {
    return { verified: true, bankReference: 'MOCK-' + Date.now(), amountSatang: 100_000n, transactedAt: new Date() }
  }

  async listIncomingTransfers(
    _accountNumber: BankAccountNumber,
    _since: Date,
  ): Promise<IncomingTransfer[]> {
    return []
  }

  async initiateTransfer(request: TransferRequest): Promise<TransferResult> {
    return {
      bankReference: 'MOCK-OUT-' + request.reference,
      status: 'COMPLETED',
      feeSatang: 0n,
      completedAt: new Date(),
    }
  }

  async getBalance(accountNumber: BankAccountNumber): Promise<Balance> {
    return { accountNumber, balanceSatang: 1_000_000_00n, asOf: new Date() }
  }

  verifyWebhookSignature(): boolean {
    return true
  }
}

// ============================================================
// Concrete adapters live in sibling files (FORGE owns implementation):
//   - ScbAdapter.ts
//   - KBankAdapter.ts
//   - BblAdapter.ts
//
// Composition root wires the chosen one based on env var BANK_ADAPTER:
//   apps/api/src/composition.ts
//     const bank: BankAdapter =
//       process.env.BANK_ADAPTER === 'scb'   ? new ScbAdapter(scbCfg)   :
//       process.env.BANK_ADAPTER === 'kbank' ? new KBankAdapter(kbCfg)  :
//       process.env.BANK_ADAPTER === 'bbl'   ? new BblAdapter(bblCfg)   :
//                                              new MockBankAdapter()
// ============================================================
