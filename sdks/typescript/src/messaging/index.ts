import type { ConjoinClient } from '../core/types'
import { createMessagingContacts } from '../generated/modules/messaging-contact'
import { createMessagingConversations } from '../generated/modules/messaging-conversation'
import { createMessagingEmails } from '../generated/modules/messaging-email'
import { createMessagingEmailRecipients } from '../generated/modules/messaging-email-recipient'
import { createMessagingEmailSenders } from '../generated/modules/messaging-email-sender'
import { createMessagingMessageAnalytics } from '../generated/modules/messaging-message-analytics'
import { createMessagingMultisends } from '../generated/modules/messaging-multisend'
import { createMessagingPhoneNumbers } from '../generated/modules/messaging-phone-number'
import { createMessagingProfiles } from '../generated/modules/messaging-profile'
import { createMessagingSMs } from '../generated/modules/messaging-sms'
import { createMessagingSMSBrands } from '../generated/modules/messaging-sms-brand'
import { createMessagingSMSCampaigns } from '../generated/modules/messaging-sms-campaign'
import { createMessagingSMSRecipients } from '../generated/modules/messaging-sms-recipient'
import { createMessagingSMSSenders } from '../generated/modules/messaging-sms-sender'
import { createMessagingTemplates } from '../generated/modules/messaging-template'
import { createMessagingVerifications } from '../generated/modules/messaging-verification'

export * from '../generated/modules/messaging-index'

export type MessagingConfig = {
  profileId: string
}

function withProfileHeader(client: ConjoinClient, profileId: string): ConjoinClient {
  const injectHeader = (options?: Parameters<ConjoinClient['fetch']>[1]) => ({
    ...options,
    headers: {
      ...options?.headers,
      'Messaging-Profile-ID': profileId,
    },
  })

  return {
    config: client.config,
    fetch: <T>(path: string, options?: Parameters<ConjoinClient['fetch']>[1]) =>
      client.fetch<T>(path, injectHeader(options)),
    fetchList: <T>(path: string, options?: Parameters<ConjoinClient['fetchList']>[1]) =>
      client.fetchList<T>(path, injectHeader(options)),
    fetchRaw: (path: string, options?: Parameters<ConjoinClient['fetchRaw']>[1]) =>
      client.fetchRaw(path, injectHeader(options)),
  }
}

export function createMessaging(client: ConjoinClient, config: MessagingConfig) {
  const profiled = withProfileHeader(client, config.profileId)

  return {
    emails: createMessagingEmails(profiled),
    sms: createMessagingSMs(profiled),
    multisend: createMessagingMultisends(profiled),
    contacts: createMessagingContacts(profiled),
    conversations: createMessagingConversations(profiled),
    templates: createMessagingTemplates(profiled),
    verifications: createMessagingVerifications(profiled),
    analytics: createMessagingMessageAnalytics(profiled),
    emailSenders: createMessagingEmailSenders(profiled),
    emailRecipients: createMessagingEmailRecipients(profiled),
    smsSenders: createMessagingSMSSenders(profiled),
    smsBrands: createMessagingSMSBrands(profiled),
    smsCampaigns: createMessagingSMSCampaigns(profiled),
    smsRecipients: createMessagingSMSRecipients(profiled),
    phoneNumbers: createMessagingPhoneNumbers(profiled),
    profiles: createMessagingProfiles(client),
  }
}
