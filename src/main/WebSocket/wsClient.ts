import { BrowserWindow, ipcMain } from 'electron'
import WebSocket from 'ws'
import { getSessionId } from '../config/session'
import { getApiBaseUrl } from '../config/url'
import { ClientMessage, ClientMessageSchema } from '../../types/WebsocketRequest'
import { ServerMessage, ServerMessageSchema } from '../../types/WebsocketRespond'
import { WebSocketStatusManager } from './wsStatusManager'
import { checkNetworkAndSession } from '../api/anthentication'

let ws: WebSocket | null = null
let reconnectTimeout: NodeJS.Timeout | null = null
let statusManager: WebSocketStatusManager | null = null

export function setupWebSocket(win: BrowserWindow): void {
  // 注册 handler 前先移除，避免重复注册
  ipcMain.removeHandler('ws:manual-reconnect')
  ipcMain.removeHandler('ws:send')

  const sessionId = getSessionId()
  if (!sessionId) {
    console.warn('未找到 SessionId，WebSocket 未连接')
    return
  }

  // 初始化状态管理器
  statusManager = new WebSocketStatusManager(win)

  const baseUrl = getApiBaseUrl()
  const wsUrl = `${baseUrl}/auth/ws`
  ws = new WebSocket(wsUrl, {
    headers: {
      Cookie: `session_id=${sessionId}`
    }
  })

  ws.onopen = async () => {
    console.log('WebSocket 已连接')
    win.webContents.send('ws:status', 'connected')

    // 连接成功后查询所有好友状态
    if (statusManager) {
      await statusManager.queryAllFriendsStatus()
    }
  }

  ws.onmessage = (event) => {
    try {
      // console.log('收到消息：', event)
      const parsed = JSON.parse(event.data)
      const validated: ServerMessage = ServerMessageSchema.parse(parsed)

      // 处理上线/下线消息
      if (validated.type === 'OnlineMessage' && statusManager) {
        statusManager.handleFriendOnline(validated.friend_id)
      } else if (validated.type === 'OfflineMessage' && statusManager) {
        statusManager.handleFriendOffline(validated.friend_id)
      }

      // 继续发送给前端处理其他消息
      win.webContents.send('ws:message', validated)
    } catch (err) {
      console.error('[WebSocket] 收到无效消息:', err)
    }
  }

  ws.onerror = (err) => {
    console.error('WebSocket 错误', err)
  }

  ws.onclose = async () => {
    console.warn('WebSocket 已断开，检测网络和会话...')
    const check = await checkNetworkAndSession(win)
    if (check === 'ok') {
      win.webContents.send('ws:status', 'reconnecting')
      reconnectTimeout = setTimeout(() => setupWebSocket(win), 3000)
    }
    // network-error/session-invalid 时不自动重连，等待前端操作
    // 前端可通过 ws:manual-reconnect 主动请求重连
    else {
      // 断开通知已在 checkNetworkAndSession 内部完成
    }
  }

  // 支持渲染进程发消息
  // 限制发送数据必须是 ClientMessage
  ipcMain.handle('ws:send', async (_, message: unknown): Promise<boolean> => {
    try {
      const validated: ClientMessage = ClientMessageSchema.parse(message)
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(validated))
        return true
      }
      return false
    } catch (err) {
      console.error('[WebSocket] 尝试发送非法消息:', err)
      return false
    }
  })

  // 新增：支持前端手动重连
  ipcMain.handle('ws:manual-reconnect', async () => {
    if (ws) ws.close()
    setupWebSocket(win)
    return true
  })
}

export function closeWebSocket(): void {
  if (reconnectTimeout) clearTimeout(reconnectTimeout)
  ws?.close()
  statusManager = null
  ipcMain.removeHandler('ws:send')
}
