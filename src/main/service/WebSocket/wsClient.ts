import { BrowserWindow } from 'electron'
import WebSocket from 'ws'
import { getSessionId } from '@main/service/config/session'
import { getApiBaseUrl } from '@main/service/config/url'
import { ServerMessage, ServerMessageSchema } from '@apiType/WebsocketRespond'
import { WebSocketStatusManager } from './wsStatusManager'
import { syncAllMessagesBeforeWS } from '@main/service/localDB/sync'
import { setAppStatus, isOnline, isOffline, isLoggedIn } from '../appStatus'
import { handleGroupMessage, handlePrivateMessage } from './wsHandler'

let ws: WebSocket | null = null
export { ws }
let reconnectTimeout: NodeJS.Timeout | null = null
let statusManager: WebSocketStatusManager | null = null
let mainWindow: BrowserWindow | null = null
let isInitialized = false
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 10

// 初始化，只注入窗口和注册 handler，不自动连接
export function initWebSocket(win: BrowserWindow): void {
  mainWindow = win
  if (isInitialized) return
  isInitialized = true
}

// 连接 WebSocket，由外部调用
export function connectWebSocket(): void {
  if (!mainWindow) {
    console.warn('WebSocket 未初始化，无法连接')
    return
  }
  if (ws && ws.readyState === WebSocket.OPEN) {
    console.log('WebSocket 已连接，无需重复连接')
    return
  }

  // 只有已登录且状态为online时才允许连接
  if (!isLoggedIn() || isOffline()) {
    console.warn('未登录或处于离线状态，WebSocket 不连接')
    return
  }

  const sessionId = getSessionId()
  if (!sessionId) {
    console.warn('未找到 SessionId，WebSocket 未连接')
    return
  }

  statusManager = new WebSocketStatusManager(mainWindow)

  // 在WebSocket连接前同步消息
  syncAllMessagesBeforeWS()
    .then(() => {
      console.log('[WebSocket] 消息同步完成，开始建立连接')
    })
    .catch((err) => {
      console.error('[WebSocket] 消息同步失败:', err)
    })

  const baseUrl = getApiBaseUrl()
  const wsUrl = `${baseUrl}/auth/ws`
  ws = new WebSocket(wsUrl, {
    headers: {
      Cookie: `session_id=${sessionId}`
    }
  })

  ws.onopen = async () => {
    console.log('WebSocket 已连接')
    setAppStatus('online')
    reconnectAttempts = 0
    safeSend('ws:status', 'connected')
    if (statusManager) {
      await statusManager.queryAllFriendsStatus()
    }
  }

  ws.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data)
      const validated: ServerMessage = ServerMessageSchema.parse(parsed)
      if (validated.type === 'OnlineMessage' && statusManager) {
        statusManager.handleFriendOnline(validated.friend_id)
      } else if (validated.type === 'OfflineMessage' && statusManager) {
        statusManager.handleFriendOffline(validated.friend_id)
      } else if (validated.type === 'SendMessage') {
        handlePrivateMessage(mainWindow!, validated)
      } else if (validated.type === 'SendGroupMessage') {
        handleGroupMessage(mainWindow!, validated)
      } else {
        console.warn('[WebSocket] 未处理的消息类型:', validated.type)
      }
      safeSend('ws:message', validated)
    } catch (err) {
      console.error('[WebSocket] 收到无效消息:', err)
    }
  }

  ws.onerror = (err) => {
    console.error('WebSocket 错误', err)
  }

  ws.onclose = async () => {
    console.warn('WebSocket 已断开，检测网络和会话...')
    if (isOnline()) {
      // 在线状态下自动重连
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++
        safeSend('ws:status', 'reconnecting')
        reconnectTimeout = setTimeout(() => connectWebSocket(), 3000)
      } else {
        setAppStatus('offline')
        safeSend('ws:status', 'offline')
      }
    } else {
      // 离线或未登录状态不重连
      disconnectWebSocket()
      setAppStatus(isLoggedIn() ? 'offline' : 'unlogin')
      safeSend('ws:status', isLoggedIn() ? 'offline' : 'unlogin')
    }
  }
}

// 断开 WebSocket，由外部调用
export function disconnectWebSocket(): void {
  if (reconnectTimeout) clearTimeout(reconnectTimeout)
  if (ws) {
    ws.close()
    ws = null
  }
  statusManager = null
  reconnectAttempts = 0
}

// 预留：手动设置状态的函数
export function setOnlineStatus(): void {
  setAppStatus('online')
  connectWebSocket()
}

export function setOfflineStatus(): void {
  setAppStatus('offline')
  disconnectWebSocket()
}

export function setUnloginStatus(): void {
  setAppStatus('unlogin')
  disconnectWebSocket()
}

function safeSend(channel: string, ...args: unknown[]): void {
  if (
    mainWindow &&
    !mainWindow.isDestroyed() &&
    mainWindow.webContents &&
    !mainWindow.webContents.isDestroyed()
  ) {
    mainWindow.webContents.send(channel, ...args)
  }
}
