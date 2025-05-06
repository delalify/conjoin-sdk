import type {
  BillingInvoicePdfPaperSizeType,
  BillingInvoiceSmartRetryStrategyOptionType,
} from './billing-invoice-types'

export const billingEntityBusinessTypes = ['company', 'individual', 'non_profit'] as const
export type BillingEntityBusinessType = (typeof billingEntityBusinessTypes)[number]

export const billingEntityBusinessStructures = [
  'multi_member_llc',
  'single_member_llc',
  'partnership',
  'private_corporation',
  'public_corporation',
  'sole_proprietorship',
  'non_profit',
] as const
export type BillingEntityBusinessStructure = (typeof billingEntityBusinessStructures)[number]

export const billingEntityBusinessVerificationDocumentTypes = ['government_id', 'drivers_license', 'other'] as const
export type BillingEntityBusinessVerificationDocumentType =
  (typeof billingEntityBusinessVerificationDocumentTypes)[number]

export const billingPayoutsScheduleIntervals = ['daily', 'weekly', 'monthly'] as const
export type BillingPayoutsScheduleIntervalType = (typeof billingPayoutsScheduleIntervals)[number]

export const billingPayoutsBankAccountHolderTypes = ['individual', 'company'] as const
export type BillingPayoutsBankAccountHolderType = (typeof billingPayoutsBankAccountHolderTypes)[number]

export const billingRejectionTypes = ['fraud', 'compliance', 'other'] as const
export type BillingRejectionType = (typeof billingRejectionTypes)[number]

export const billingEntityGeneralCapabilities = [
  'payments',
  'payouts',
  'card_issuing',
  'tax_reporting',
  'subscriptions',
  'invoicing',
] as const
export type BillingEntityGeneralCapabilitiesType = (typeof billingEntityGeneralCapabilities)[number]

export const billingWeekDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const
export type BillingWeekDayType = (typeof billingWeekDays)[number]

export const billingEntityInvoiceNumberDelegationOptions = ['customer_based', 'entity_based'] as const
export type BillingEntityInvoiceNumberDelegationOptionType =
  (typeof billingEntityInvoiceNumberDelegationOptions)[number]

/**
 * In Conjoin Billing, an entity is a business or individual that needs to collect payments
 * from their customers. This allows Conjoin Billing to configure and manage the structure,
 * capabilities, and settings for the billing entity. This is useful for management and compliance purposes.
 */
export type BillingEntityType = {
  /**
   * The unique identifier for the billing entity.
   */
  entity_id: string
  /**
   * The account data for the billing entity.
   */
  account_data: {
    /**
     * The type of business for the billing entity.
     *
     * `company`: The billing entity is a company.
     *
     * `individual`: The billing entity is an individual.
     *
     * `non_profit`: The billing entity is a non-profit.
     */
    business_type: BillingEntityBusinessType
    /**
     * The merchant category code (MCC) is a four-digit number that classifies businesses into categories based on their primary activity.
     * It helps in categorizing businesses for reporting and analysis purposes.
     */
    mcc: string | null
    /**
     * The capabilities that the billing entity has enabled.
     */
    capabilities: {
      /**
       * Determines if card payments are enabled for the billing entity.
       */
      card_payments: boolean
      /**
       * Determines if bank account payments are enabled for the billing entity.
       */
      bank_account_payments: boolean
      /**
       * Determines if mobile money payments are enabled for the billing entity.
       */
      mobile_money_payments: boolean
      /**
       * Determines if transfers are enabled for the billing entity.
       */
      transfers: boolean
      /**
       * Determines if card issuing is enabled for the billing entity.
       */
      card_issuing: boolean
      /**
       * Determines if tax reporting is enabled for the billing entity.
       */
      tax_reporting: boolean
      /**
       * Determines if subscriptions are enabled for the billing entity.
       */
      subscriptions: boolean
      /**
       * Determines if invoicing is enabled for the billing entity.
       */
      invoicing: boolean
    }
    /**
     * The company data for the billing entity. This is required regardless of the `business_type`.
     */
    company: {
      /**
       * The name of the company.
       */
      name: string
      /**
       * The phone number of the company.
       */
      phone_number: string
      /**
       * The email of the company.
       */
      email: string
      /**
       * The registration number of the company.
       */
      registration_number: string
      /**
       * The company structure. This defines legal structure of the company. This is required if the `business_type` is `company`.
       *
       * `non_profit`: The company is a non-profit.
       *
       * `multi_member_llc`: A multi-member limited liability company. An LLC is a company whose members are not personally liable for the company's debts or liabilities.
       *
       * `single_member_llc`: A single-member limited liability company. An LLC is a company whose members are not personally liable for the company's debts or liabilities.
       *
       * `partnership`: A partnership is a business structure that is owned and managed by two or more individuals.
       *
       * `private_corporation`: A private corporation is a business structure that is owned and managed by a private entity. This can be a private company or a group of private individuals.
       *
       * `public_corporation`: A public corporation is a business structure that is owned and managed by a public entity. This can be a government entity or a public company.
       *
       * `sole_proprietorship`: A sole proprietorship is a business structure that is owned and managed by a single individual.
       */
      structure: BillingEntityBusinessStructure
      /**
       * The tax identification number of the company.
       */
      tin: string
      /**
       * The company website URL.
       */
      website_url: string | null
      /**
       * The address of the company.
       */
      address: {
        /**
         * The first line of the company's address.
         */
        line1: string
        /**
         * An optional line of the company's address.
         */
        line2?: string
        /**
         * The city where the company primarily operates.
         */
        city: string
        /**
         * The state where the company primarily operates.
         */
        state: string
        /**
         * The postal code of the company's address.
         */
        postal_code: string
        /**
         * The ISO 3166-1 alpha-2 country code of the company's address.
         */
        country: string
      }
      /**
       * Defines the verification status of the company.
       */
      verification: {
        /**
         * Determines if the company has been verified.
         */
        is_verified: boolean
        /**
         * The document that was used to verify the company.
         */
        document: {
          /**
           * The unique identifier for the document.
           */
          document_id: string | null
          /**
           * The type of document that was used to verify the company.
           *
           * `government_id`: A government-issued ID.
           *
           * `drivers_license`: A government-issued driver's license.
           *
           * `other`: Any other document that can be used to verify the company.
           */
          document_type: BillingEntityBusinessVerificationDocumentType | null
          /**
           * Specifies the URL location where the front side of the document can be found.
           */
          front_url: string | null
          /**
           * Specifies the URL location where the back side of the document can be found.
           */
          back_url: string | null
        }
      }
    }
    /**
     * The individuals that are associated with the company. This is applicable regardless of the `business_type` of the entity.
     *
     * Multiple individuals can be associated with an entity. If the `business_type` of the entity is `company`, depending
     * on the `structure` of the company, the individuals will be either the members of the company or the directors of the company.
     */
    individuals: [
      {
        /**
         * The unique identifier for the individual.
         */
        person_id: string
        /**
         * Determines if the individual is an account manager for the entity. Usually the Conjoin account that first initialises the
         * billing entity is assigned as the account manager.
         *
         * This will set the date and time when the account manager was assigned to the entity.
         */
        is_account_manager: Date | null
        /**
         * The first name of the individual.
         */
        first_name: string
        /**
         * The last name of the individual.
         */
        last_name: string
        /**
         * The email address of the individual.
         */
        email: string
        /**
         * The phone number of the individual.
         */
        phone_number: string
        /**
         * The address of the individual.
         */
        address: {
          /**
           * The first line of the individual's address.
           */
          line1: string
          /**
           * An optional line of the individual's address.
           */
          line2?: string
          /**
           * The city where the individual primarily resides.
           */
          city: string
          /**
           * The state where the individual primarily resides.
           */
          state: string
          /**
           * The postal code of the individual's address.
           */
          postal_code: string
          /**
           * The ISO 3166-1 alpha-2 country code of the individual's address.
           */
          country: string
        }
        /**
         * The gender of the individual.
         */
        gender: string
        /**
         * The optional date of birth of the individual.
         */
        dob: Date | null
        /**
         * Determines if the individual is politically exposed. A politically exposed person (PEP) is an individual
         * who is or has been entrusted with a prominent public function and is or has been associated with a foreign government.
         */
        is_politically_exposed: boolean
        /**
         * The tax identification number of the individual.
         */
        tin: string
        /**
         * Specifies the relationship of the individual to the entity.
         */
        account_relationship: {
          /**
           * The title of the individual.
           */
          title: string
          /**
           * Determines if the individual is an owner of the entity.
           */
          is_owner: boolean
          /**
           * Determines if the individual is a director of the entity.
           */
          is_director: boolean
          /**
           * Determines if the individual is an executive of the entity.
           */
          is_executive: boolean
          /**
           * The ownership percentage of the individual in the entity.
           */
          ownership_percentage: number
        }
        /**
         * The ISO 3166-1 alpha-2 country code of the individual's nationality.
         */
        nationality: string
        /**
         * Defines the verification status of the individual.
         */
        verification: {
          /**
           * Determines if the individual has been verified.
           */
          is_verified: boolean
          /**
           * The document that was used to verify the individual.
           */
          document: {
            /**
             * The unique identifier for the document.
             */
            document_id: string | null
            /**
             * The type of document that was used to verify the individual.
             *
             * `government_id`: A government-issued ID.
             *
             * `drivers_license`: A government-issued driver's license.
             *
             * `other`: Any other document that can be used to verify the individual.
             */
            document_type: BillingEntityBusinessVerificationDocumentType | null
            /**
             * Specifies the URL location where the front side of the document can be found.
             */
            front_url: string | null
            /**
             * Specifies the URL location where the back side of the document can be found.
             */
            back_url: string | null
          }
        }
      },
    ]
    /**
     * The ISO 3166-1 alpha-2 country code for the customer's business.
     */
    country: string
    /**
     * Defines the acceptance of the service agreement for the billing entity.
     */
    service_agreement: {
      /**
       * Determines if the service agreement has been accepted.
       */
      is_accepted: boolean
      /**
       * The date and time when the service agreement was accepted.
       */
      accepted_at: Date | null
      /**
       * The IP address of the device that was used to accept the service agreement.
       */
      ip_address: string | null
    }
  }
  /**
   * Defines payment settings for the billing entity
   */
  payments: {
    /**
     * Determines if payments are enabled for the billing entity.
     */
    is_enabled: boolean
    /**
     * This is the statement descriptor that will be shown on the customer's bank statement.
     * It must be between 1 and 22 characters, and can only contain alphanumeric characters and spaces.
     */
    statement_descriptor: string | null
    /**
     * Determines if multiple payment methods can be used configured for payments.
     */
    allow_multiple_payment_methods: boolean
  }
  /**
   * Defines payout settings for the billing entity.
   */
  payouts: {
    /**
     * Determines if payouts are enabled for the billing entity. This will only be `true` if
     * `payouts.bank_account` have been configured.
     */
    is_enabled: boolean
    /**
     * Determines if negative balances will be debited from the account holder's payout account. The only
     * difference between `true` and `false` is whether the negative balance is automatically collected from the entity's
     * payout account or needs to be handled manually.
     *
     * For example, assume the billing entity has a balance of $100 and they have fees/charges of $150:
     * - If `debit_negative_balances` is `true`, the negative balance of $50 will be debited from the payout account.
     *   The billing entity will receive no payout since their available balance ($100) is less than their fees ($150).
     * - If `debit_negative_balances` is `false`, the negative balance will not be debited from the payout account.
     *   The billing entity will receive no payout and will need to manually transfer funds to cover the negative balance.
     */
    debit_negative_balances: boolean
    /**
     * Configures the payout schedule for the billing entity.
     */
    schedule: {
      /**
       * How often the payout will be sent.
       *
       * `daily`: Payouts will be sent every day.
       *
       * `weekly`: Payouts will be sent every week.
       *
       * `monthly`: Payouts will be sent every month.
       */
      interval: BillingPayoutsScheduleIntervalType
      /**
       * The day of the week to send payouts. Only applicable if interval is `weekly`.
       */
      day_of_week: BillingWeekDayType | null
      /**
       * The day of the month to send payouts. Only applicable if interval is `monthly`.
       * This is a number between 1 and 31. For short months (e.g. February), this will be the last day of the month.
       */
      day_of_month: number | null
    }
    /**
     * Configures the bank account that will be used for payouts.
     */
    bank_account: {
      /**
       * The unique identifier for the bank account.
       */
      bank_id: string | null
      /**
       * The last 4 digits of the bank account number.
       */
      last_4: string | null
      /**
       * The ISO 3166-1 alpha-2 country code of the bank account.
       */
      country: string | null
      /**
       * The currency of the bank account.
       */
      currency: string | null
      /**
       * The account holder name of the bank account.
       */
      account_holder_name: string | null
      /**
       * The type of account holder for the bank account.
       *
       * `individual`: The bank account is owned by an individual.
       *
       * `company`: The bank account is owned by a company.
       */
      account_holder_type: BillingPayoutsBankAccountHolderType | null
      /**
       * The routing number of the bank account. This is only required for bank accounts in the United States.
       */
      routing_number: string | null
      /**
       * The optionalfingerprint of the bank account. This is a digital cryptographic hash that is generated
       * for the bank account usually for fraud detection purposes.
       */
      fingerprint?: string | null
    }
  }
  /**
   * Defines card issuing settings for the billing entity.
   */
  card_issuing: {
    /**
     * Determines if card issuing is enabled for the billing entity.
     */
    is_enabled: boolean
    /**
     * Defines the acceptance of the card issuing service agreement for the billing entity.
     */
    service_agreement: {
      /**
       * Determines if the card issuing service agreement has been accepted.
       */
      is_accepted: boolean
      /**
       * The date and time when the card issuing service agreement was accepted.
       */
      accepted_at: Date | null
      /**
       * The IP address of the device that was used to accept the card issuing service agreement.
       */
      ip_address: string | null
    }
  }
  /**
   * Defines tax reporting settings for the billing entity.
   */
  tax_reporting: {
    /**
     * Determines if tax reporting is enabled for the billing entity.
     */
    is_enabled: boolean
    /**
     * The merchant tax number of the billing entity.
     */
    merchant_tax_number: string | null
    /**
     * Defines the acceptance of the tax reporting service agreement for the billing entity.
     */
    service_agreement: {
      /**
       * Determines if the tax reporting service agreement has been accepted.
       */
      is_accepted: boolean
      /**
       * The date and time when the tax reporting service agreement was accepted.
       */
      accepted_at: Date | null
      /**
       * The IP address of the device that was used to accept the tax reporting service agreement.
       */
      ip_address: string | null
    }
  }
  /**
   * Defines subscription settings for the billing entity.
   */
  subscriptions: {
    /**
     * Determines if subscriptions are enabled for the billing entity.
     */
    is_enabled: boolean

    /**
     * Defines the renewal notification settings for the billing entity.
     * If enabled, renewal email reminders will be sent to the customer before the subscription renews.
     */
    renewal_notifications: {
      /**
       * Determines if renewal email reminders are enabled for subscriptions.
       */
      is_enabled: boolean

      /**
       * The number of days before the subscription renewal date to send renewal notifications.
       * If `is_enabled` is true, the default is [3]. This means that the first reminder will be sent 3 days before the renewal date.
       * You can configure up to 4 reminders within a 14 day period. This means that the maximum number of days between the first and last reminder is 14 days.
       */
      days_before: number[]
    }
  }
  /**
   * Defines invoicing settings for the billing entity.
   */
  invoicing: {
    /**
     * Determines if the entity has enabled invoicing.
     */
    is_enabled: boolean
    /**
     * Determines how the invoice number will be delegated.
     *
     * `customer_based`: The invoice number will be delegated sequentially to each customer.
     *
     * `entity_based`: The invoice number will be delegated sequentially to every customer on the entity.
     *
     * The default is `customer_based`.
     */
    invoice_number_delegation: BillingEntityInvoiceNumberDelegationOptionType | null
    /**
     * The date and time when the last invoice number delegation was updated.
     * This is essential because we limit how many times the invoice number can be delegated.
     * Currently, we only allow delegation changes at year boundaries.
     */
    last_invoice_number_delegation_date: Date | null
    /**
     * Determines if the invoice PDF can be downloaded by the customer.
     */
    allow_invoice_pdf_download: boolean | null
    /**
     * This is the default memo that will be displayed by Conjoin Billing on invoice PDFs, payment pages, and emails.
     * Eg: "Thank you for your business."
     */
    default_memo: string
    /**
     * This is the default footer text that will be displayed by Conjoin Billing on invoice PDFs.
     * The invoice footer is usually legal or helpful information about the business and/or the invoice.
     * Eg: "This is not an official receipt. Please contact support@acme.com for any questions."
     */
    default_footer_text: string
    /**
     * This is the default paper size that will be used by Conjoin Billing on invoice PDFs.
     *
     * `a4`: The invoice will be displayed in A4 size.
     *
     * `letter`: The invoice will be displayed in Letter size.
     */
    default_paper_size: BillingInvoicePdfPaperSizeType | null
    /**
     * Defines the payment terms for manual invoices. Manual invoices are those that include `automatic_finalisation` set to `false`.
     */
    payment_terms: {
      /**
       * The number of days after the invoice date that the invoice will be due.
       * Default is 30 days.
       */
      due_days: number
      /**
       * Determines if the payment link will be included in the invoice email.
       * The payment link allows customers to pay for the invoice on a Conjoin Billing hosted payment page.
       */
      include_payment_link: boolean
      /**
       * Determines if the customer can schedule payments for a latter date for the invoice.
       */
      allow_scheduled_payments: boolean
    }
    /**
     * Defines the finalisation settings for invoices.
     */
    invoice_finalisation: {
      /**
       * The number of seconds after the invoice creation/finalisation date that the invoice will be automatically finalised.
       * This is only applicable if the `invoice.automatic_finalisation.enabled` is set to `true`.
       * Default is 3600 seconds (1 hour). Maximum is 604800 seconds (7 days).
       */
      grace_period_seconds: number
    }
    /**
     * Configures the smart retries for invoices. Conjoin Billing
     */
    smart_retries: {
      /**
       * Determines if smart retries are enabled for invoices.
       */
      is_enabled: boolean
      /**
       * The optional strategy to use for smart retries. This directly affects the interval and duration of the retries.
       *
       * `aggressive`: The goal is to collect the payment as soon as possible.
       * This translates `max_retries` to 8 and `max_duration_days` to 7.
       *
       * `moderate`: The goal is to collect the payment within a reasonable time frame.
       * This translates `max_retries` to 8 and `max_duration_days` to 14.
       *
       * `conservative`: The goal is to collect the payment in a reasonable time frame, but not at the expense of annoying the customer.
       * This translates `max_retries` to 4 and `max_duration_days` to 14.
       *
       * Default is `moderate`.
       */
      strategy: BillingInvoiceSmartRetryStrategyOptionType | null
      /**
       * The maximum number of retries for failed payments for an invoice.
       * Default is 8. Maximum is 12.
       */
      max_retries: number
      /**
       * The maximum duration in days for a retry.
       * Default is 14 days. Maximum is 30 days.
       */
      max_duration_days: number
    }
    overdue_email_reminders: {
      /**
       * Determines if overdue email reminders are enabled for invoices.
       */
      is_enabled: boolean
      /**
       * The number of days after the invoice due date that the overdue email reminders will be sent.
       * If `is_enabled` is true, the default is [7, 12]. This means that the first reminder will be sent 7 days after the due date and the second reminder will be sent 12 days after the due date.
       * You can configure up to 4 reminders and the maximum number of days is 30 days.
       */
      reminder_days: number[]
    }
  }
  /**
   * Determines if the billing entity is active.
   */
  is_active: boolean
  /**
   * If the billing entity cannot be activated for any reason, it will be rejected.
   * This is an array of rejections that the billing entity has received. The rejections will
   * typically not be shown to the account manager, but will be shown to the billing entity for
   * management and compliance purposes.
   *
   * The rejection may be determined during the onboarding process or at a later date, usually as a result of automated verification checks.
   */
  rejections: {
    /**
     * The type of rejection.
     *
     * `fraud`: The billing entity is fraudulent.
     *
     * `compliance`: The billing entity is in violation of the service agreement.
     *
     * `other`: Any other reason.
     */
    type: BillingRejectionType
    /**
     * The reason for the rejection.
     */
    reason: string
    /**
     * The date and time when the rejection was received.
     */
    date: Date
  }[]
  /**
   * The branding settings for the billing entity.
   */
  branding: {
    /**
     * The URL of the icon for the billing entity.
     */
    icon_url: string | null
    /**
     * The URL of the logo for the billing entity.
     */
    logo_url: string | null
    /**
     * The primary color of the billing entity.
     */
    primary_color: string | null
    /**
     * The secondary color of the billing entity.
     */
    secondary_color: string | null
  }
  /**
   * The capabilities that the billing entity has enabled.
   */
  enabled_capabilities: BillingEntityGeneralCapabilitiesType[]
}
