import type { ConjoinRequestOptions, ConjoinResponseType } from '../types/conjoin/conjoin-types'
import { request } from 'undici'

export type ConjoinOptions = {
  apiVersion?: string
  dangerouslySetApiUri?: string
}

export class BaseConjoin {
  #apiKey: string
  #apiVersion: string
  #apiUri: string

  constructor(apiKey: string, options?: ConjoinOptions) {
    this.#apiKey = apiKey
    this.#apiVersion = options?.apiVersion ?? 'v1'
    this.#apiUri = options?.dangerouslySetApiUri ?? 'https://api.conjoin.com'
  }

  /**
   * A reusable method to make API requests with error handling and request options.
   *
   * @template ResponseType - The expected response type.
   * @param {string} path - The API endpoint path.
   * @param {ConjoinRequestOptions} [options] - Optional request options for pagination, sorting, and filtering.
   * @returns {Promise<ResponseType>} - A promise that resolves with the API response.
   * @throws Will throw an error if the API request fails.
   */
  async makeRequest<ResponseType>(
    path: string,
    requestOptions?: ConjoinRequestOptions & { returnFullResponse?: false }
  ): Promise<ResponseType>
  async makeRequest<ResponseType>(
    path: string,
    requestOptions?: ConjoinRequestOptions & { returnFullResponse: true }
  ): Promise<ConjoinResponseType<ResponseType>>
  async makeRequest<ResponseType>(
    path: string,
    requestOptions?: ConjoinRequestOptions
  ): Promise<ResponseType | ConjoinResponseType<ResponseType>> {
    const url = new URL(`/${this.#apiVersion}/${path}`, this.#apiUri)

    if (requestOptions?.query) {
      Object.entries(requestOptions.query).forEach(([key, value]) => {
        url.searchParams.set(key, String(value))
      })
    }

    const { method = 'GET', headers, body } = requestOptions ?? {}

    const response = await request(url.toString(), {
      method,
      headers: {
        Authorization: `Bearer ${this.#apiKey}`,
        'Content-Type': 'application/json',
        ...headers,
      },
      ...(method !== 'GET' && body && { body: JSON.stringify(body) }),
    })

    if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
      const errorResponse: ConjoinResponseType = (await response.body.json()) as ConjoinResponseType
      throw new Error(errorResponse.response.message)
    }

    const successResponse: ConjoinResponseType<ResponseType> =
      (await response.body.json()) as ConjoinResponseType<ResponseType>
    return requestOptions?.returnFullResponse ? successResponse : successResponse.data
  }
}
