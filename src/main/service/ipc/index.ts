import { registerAuthenticationHandler } from './anth'
import { registerConfigHandler } from './config'
import { registerConversationHandlers } from './conversation'
import { registerWSIPCHandlers } from './ws'

export function registerIPCHandlers(): void {
  registerConfigHandler()
  registerAuthenticationHandler()
  registerConversationHandlers()
  registerWSIPCHandlers()
}
