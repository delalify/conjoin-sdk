import type { BaseConjoin } from '../core/base-conjoin'
import { CustomerResource } from './customer'
import { PaymentIntentResource } from './payment-intent'

export class BillingResource {
  readonly #client: BaseConjoin
  readonly paymentIntent: PaymentIntentResource
  readonly customer: CustomerResource

  constructor(client: BaseConjoin) {
    this.#client = client
    this.customer = new CustomerResource(this.#client)
    this.paymentIntent = new PaymentIntentResource(this.#client)
  }
}
