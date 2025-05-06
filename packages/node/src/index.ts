import type { ConjoinOptions } from './core/base-conjoin'
import { BaseConjoin } from './core/base-conjoin'
import { BillingResource } from './billing'

export class Conjoin extends BaseConjoin {
  readonly billing: BillingResource

  constructor(apiKey: string, options?: ConjoinOptions) {
    super(apiKey, options)
    this.billing = new BillingResource(this)
  }
}
