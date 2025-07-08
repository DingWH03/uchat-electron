import { BrowserWindow } from 'electron'
import { registerIPCHandlers } from './ipc'
import { initWebSocket } from './WebSocket/wsClient'
import { initDB } from './localDB'

export function initService(win: BrowserWindow): void {
  registerIPCHandlers()
  initWebSocket(win)
  initDB()
}
