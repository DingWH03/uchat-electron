import { registerAccountManageHandler } from './account'
import { registerAuthenticationHandler } from './anth'
import { registerConfigHandler } from './config'
import { registerContactHandler } from './contact'
import { registerConversationHandlers } from './conversation'
import { registerMessageHandler } from './message'
import { registerPingHandler } from './ping'
import { registerWSIPCHandlers } from './ws'

export function registerIPCHandlers(): void {
  registerConfigHandler()
  registerAuthenticationHandler()
  registerConversationHandlers()
  registerWSIPCHandlers()
  registerAccountManageHandler()
  registerMessageHandler()
  registerContactHandler()
  registerPingHandler()
}
