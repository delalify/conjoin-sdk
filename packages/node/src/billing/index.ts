import type { BaseConjoin } from '../core/base-conjoin'
import { CustomerResource } from './customer'
import { PaymentIntentResource } from './payment-intent'

export class BillingResource {
  readonly paymentIntent: PaymentIntentResource
  readonly customer: CustomerResource
  readonly #client: BaseConjoin

  constructor(client: BaseConjoin) {
    this.#client = client
    this.customer = new CustomerResource(this.#client)
    this.paymentIntent = new PaymentIntentResource(this.#client)
  }
}
