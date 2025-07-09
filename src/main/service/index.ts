import { BrowserWindow } from 'electron'
import { registerIPCHandlers } from './ipc'
import { initWebSocket } from './WebSocket/wsClient'
import { initDB } from './localDB'
import { registerCustomProtocol } from './file'

export function initService(win: BrowserWindow): void {
  registerIPCHandlers()
  registerCustomProtocol()
  initWebSocket(win)
  initDB()
}
