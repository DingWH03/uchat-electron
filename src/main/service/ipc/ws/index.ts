import { ipcMain } from 'electron'
import { ws, connectWebSocket, disconnectWebSocket } from '../../WebSocket/wsClient'
import { ClientMessage, ClientMessageSchema } from '@apiType/WebsocketRequest'

export function registerWSIPCHandlers(): void {
  // ws:send handler
  ipcMain.handle('ws:send', async (_, message: unknown): Promise<boolean> => {
    try {
      const validated: ClientMessage = ClientMessageSchema.parse(message)
      if (ws && ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify(validated))
        return true
      }
      return false
    } catch (err) {
      console.error('[WebSocket] 尝试发送非法消息:', err)
      return false
    }
  })

  // ws:manual-reconnect handler
  ipcMain.handle('ws:manual-reconnect', async () => {
    disconnectWebSocket()
    connectWebSocket()
    return true
  })
}
