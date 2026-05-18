import type { ConjoinClient, RequestOptions } from '../core/types'

const MESSAGING_PROFILE_ID_HEADER = 'Messaging-Profile-ID'

const injectProfileHeader = (options: RequestOptions | undefined, profileId: string): RequestOptions => ({
  ...options,
  headers: {
    ...options?.headers,
    [MESSAGING_PROFILE_ID_HEADER]: profileId,
  },
})

export const createMessagingProfiledClient = (client: ConjoinClient, profileId: string): ConjoinClient => ({
  config: client.config,
  fetch: <T>(path: string, options?: RequestOptions) => client.fetch<T>(path, injectProfileHeader(options, profileId)),
  fetchWithResponse: <T>(path: string, options?: RequestOptions) =>
    client.fetchWithResponse<T>(path, injectProfileHeader(options, profileId)),
  fetchList: <T>(path: string, options?: RequestOptions) =>
    client.fetchList<T>(path, injectProfileHeader(options, profileId)),
  fetchListWithResponse: <T>(path: string, options?: RequestOptions) =>
    client.fetchListWithResponse<T>(path, injectProfileHeader(options, profileId)),
  fetchRaw: (path: string, options?: RequestOptions) => client.fetchRaw(path, injectProfileHeader(options, profileId)),
  withRequestTrace: async (callback, options) =>
    client.withRequestTrace(
      (scopedClient, requestId) => callback(createMessagingProfiledClient(scopedClient, profileId), requestId),
      options,
    ),
})
