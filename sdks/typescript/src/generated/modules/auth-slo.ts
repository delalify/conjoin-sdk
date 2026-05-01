import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type OidcLogoutBody = operations['oidcLogout']['requestBody']['content']['application/json']
type OidcLogoutData = NonNullable<operations['oidcLogout']['responses']['200']['content']['application/json']['data']>
type SamlSpLogoutBody = operations['samlSpLogout']['requestBody']['content']['application/json']
type SamlSpLogoutData = NonNullable<operations['samlSpLogout']['responses']['200']['content']['application/json']['data']>
type SamlIdpLogoutBody = operations['samlIdpLogout']['requestBody']['content']['application/json']
type SamlIdpLogoutData = NonNullable<operations['samlIdpLogout']['responses']['200']['content']['application/json']['data']>

export function createAuthSLOs(client: ConjoinClient) {
  return {
    oidcLogout: (appId: string, accountId: string, data: OidcLogoutBody) =>
      client.fetch<OidcLogoutData>(`auth/slo/${appId}/account/${accountId}/slo/oidc`, { method: 'POST', body: data }),

    samlSpLogout: (appId: string, accountId: string, data: SamlSpLogoutBody) =>
      client.fetch<SamlSpLogoutData>(`auth/slo/${appId}/account/${accountId}/slo/saml/sp-initiated`, { method: 'POST', body: data }),

    samlIdpLogout: (appId: string, data: SamlIdpLogoutBody) =>
      client.fetch<SamlIdpLogoutData>(`auth/slo/${appId}/slo/saml/idp-initiated`, { method: 'POST', body: data }),
  }
}
