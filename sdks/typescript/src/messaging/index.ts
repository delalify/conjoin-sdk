import type { ConjoinClient } from '../core/types'
import { createMessagingContacts } from '../generated/modules/messaging-contact'
import { createMessagingConversations } from '../generated/modules/messaging-conversation'
import { createMessagingEmails } from '../generated/modules/messaging-email'
import { createMessagingEmailSenders } from '../generated/modules/messaging-email-sender'
import { createMessagingMessageAnalytics } from '../generated/modules/messaging-message-analytics'
import { createMessagingMultisends } from '../generated/modules/messaging-multisend'
import { createMessagingPhoneNumbers } from '../generated/modules/messaging-phone-number'
import { createMessagingProfiles } from '../generated/modules/messaging-profile'
import { createMessagingSMs } from '../generated/modules/messaging-sms'
import { createMessagingSMSBrands } from '../generated/modules/messaging-sms-brand'
import { createMessagingSMSCampaigns } from '../generated/modules/messaging-sms-campaign'
import { createMessagingSMSSenders } from '../generated/modules/messaging-sms-sender'
import { createMessagingTemplates } from '../generated/modules/messaging-template'
import { createMessagingVerifications } from '../generated/modules/messaging-verification'
import { createMessagingProfiledClient } from './profile-client'

export * from '../generated/modules/messaging-index'

export type MessagingConfig = {
  profileId: string
}

export function createMessaging(client: ConjoinClient, config: MessagingConfig) {
  const profiled = createMessagingProfiledClient(client, config.profileId)

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
    smsSenders: createMessagingSMSSenders(profiled),
    smsBrands: createMessagingSMSBrands(profiled),
    smsCampaigns: createMessagingSMSCampaigns(profiled),
    phoneNumbers: createMessagingPhoneNumbers(profiled),
    profiles: createMessagingProfiles(client),
  }
}
