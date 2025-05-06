import { BillingResource } from '../billing'
import { BaseConjoin, type ConjoinOptions } from './base-conjoin'

export class Conjoin extends BaseConjoin {
  readonly billing: BillingResource

  constructor(apiKey: string, options?: ConjoinOptions) {
    super(apiKey, options)
    this.billing = new BillingResource(this)
  }
}
