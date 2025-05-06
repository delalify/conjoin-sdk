export const billingSupportedCurrencies = ['GHS', 'USD'] as const
export type BillingSupportedCurrencyType = (typeof billingSupportedCurrencies)[number]

export type BillingAuditLogType = {
  /**
   * The action that was performed.
   */
  action: string
  /**
   * The message of the audit log.
   */
  message: string
  /**
   * The data of the audit log.
   */
  data: Record<string, unknown>
  /**
   * The date and time when the audit log was created.
   */
  created_at: Date
}
