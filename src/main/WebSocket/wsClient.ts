import { BrowserWindow, ipcMain } from 'electron'
import WebSocket from 'ws'
import { getSessionId } from '../session'
import { getApiBaseUrl } from '../api/config'
import { ClientMessage, ClientMessageSchema } from '../../types/WebsocketRequest'
import { ServerMessage, ServerMessageSchema } from '../../types/WebsocketRespond'

let ws: WebSocket | null = null
let reconnectTimeout: NodeJS.Timeout | null = null

export function setupWebSocket(win: BrowserWindow): void {
  const sessionId = getSessionId()
  if (!sessionId) {
    console.warn('未找到 SessionId，WebSocket 未连接')
    return
  }
  const baseUrl = getApiBaseUrl()
  const wsUrl = `${baseUrl}/auth/ws`
  ws = new WebSocket(wsUrl, {
    headers: {
      Cookie: `session_id=${sessionId}`
    }
  })

  ws.onopen = () => {
    console.log('WebSocket 已连接')
    win.webContents.send('ws:status', 'connected')
  }

  ws.onmessage = (event) => {
    try {
      // console.log('收到消息：', event)
      const parsed = JSON.parse(event.data)
      const validated: ServerMessage = ServerMessageSchema.parse(parsed)
      win.webContents.send('ws:message', validated)
    } catch (err) {
      console.error('[WebSocket] 收到无效消息:', err)
    }
  }

  ws.onerror = (err) => {
    console.error('WebSocket 错误', err)
  }

  ws.onclose = () => {
    console.warn('WebSocket 已断开，尝试重连中...')
    win.webContents.send('ws:status', 'disconnected')
    reconnectTimeout = setTimeout(() => setupWebSocket(win), 3000)
  }

  // 支持渲染进程发消息
  // 限制发送数据必须是 ClientMessage
  ipcMain.handle('ws:send', (_, message: unknown) => {
    try {
      const validated: ClientMessage = ClientMessageSchema.parse(message)
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(validated))
      }
    } catch (err) {
      console.error('[WebSocket] 尝试发送非法消息:', err)
    }
  })
}

export function closeWebSocket(): void {
  if (reconnectTimeout) clearTimeout(reconnectTimeout)
  ws?.close()
}
