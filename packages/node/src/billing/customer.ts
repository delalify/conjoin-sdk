import type { BaseConjoin } from '../core/base-conjoin'
import type { BillingCustomerType } from '../types/billing/billing-customer-types'
import type {
  CreateBillingCustomerRequestType,
  ReadBillingCustomerRequestType,
  UpdateBillingCustomerRequestType,
} from '../types/billing/request-types/billing-customer-request-types'
import type { ConjoinBillingOptions } from '../types/conjoin/conjoin-types'

export class CustomerResource {
  #client: BaseConjoin

  constructor(client: BaseConjoin) {
    this.#client = client
  }

  #buildPath(options: ConjoinBillingOptions, path?: string | string[]) {
    return `/billing/customer/${options.projectId}/${options.entityId}${path ? `/${Array.isArray(path) ? path.join('/') : path}` : ''}`
  }

  /**
   * Create a customer.
   *
   * @param requestData - The customer data for the request.
   * @param options - The options for the request.
   * @returns The customer object.
   */
  async create(
    requestData: CreateBillingCustomerRequestType,
    options: ConjoinBillingOptions
  ): Promise<BillingCustomerType> {
    return this.#client.makeRequest<BillingCustomerType>(this.#buildPath(options), {
      method: 'POST',
      body: requestData,
    })
  }

  /**
   * Read a customer.
   *
   * Retrieves the customer with the given customer ID.
   *
   * @param customerId - The customer ID.
   * @param options - The options for the request.
   * @returns The customer object.
   */
  async get(customerId: string, options: ConjoinBillingOptions): Promise<BillingCustomerType> {
    return this.#client.makeRequest<BillingCustomerType>(this.#buildPath(options), {
      method: 'GET',
      query: {
        customer_id: customerId,
      },
    })
  }

  /**
   * List customers.
   *
   * Retrieves a list of customers based on the filters provided.
   *
   * @param requestFilters - The filters for the request.
   * @param options - The options for the request.
   * @returns The customer objects.
   */
  async list(
    requestFilters: ReadBillingCustomerRequestType,
    options: ConjoinBillingOptions
  ): Promise<BillingCustomerType[]> {
    return this.#client.makeRequest<BillingCustomerType[]>(this.#buildPath(options), {
      method: 'GET',
      query: requestFilters,
    })
  }

  /**
   * Update a customer.
   *
   * Updates the customer with the given customer ID.
   *
   * @param customerId - The customer ID.
   * @param requestData - The customer data for the request.
   * @param options - The options for the request.
   * @returns The customer object.
   */
  async update(
    customerId: string,
    requestData: UpdateBillingCustomerRequestType,
    options: ConjoinBillingOptions
  ): Promise<BillingCustomerType> {
    return this.#client.makeRequest<BillingCustomerType>(this.#buildPath(options), {
      method: 'PATCH',
      body: requestData,
      query: {
        customer_id: customerId,
      },
    })
  }

  /**
   * Archive a customer.
   *
   * Archives the customer with the given customer ID.
   *
   * @param customerId - The customer ID.
   * @param options - The options for the request.
   * @returns The customer object.
   */
  async archive(customerId: string, options: ConjoinBillingOptions): Promise<BillingCustomerType> {
    return this.#client.makeRequest<BillingCustomerType>(this.#buildPath(options, `${customerId}/archive`), {
      method: 'PATCH',
    })
  }

  /**
   * Restore a customer.
   *
   * Restores the customer with the given customer ID.
   *
   * @param customerId - The customer ID.
   * @param options - The options for the request.
   * @returns The customer object.
   */
  async restore(customerId: string, options: ConjoinBillingOptions): Promise<BillingCustomerType> {
    return this.#client.makeRequest<BillingCustomerType>(this.#buildPath(options, `${customerId}/restore`), {
      method: 'PATCH',
    })
  }
}
