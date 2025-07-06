import { BrowserWindow, ipcMain } from 'electron'
import WebSocket from 'ws'
import { getSessionId } from '../config/session'
import { getApiBaseUrl } from '../config/url'
import { ClientMessage, ClientMessageSchema } from '../../types/WebsocketRequest'
import { ServerMessage, ServerMessageSchema } from '../../types/WebsocketRespond'
import { WebSocketStatusManager } from './wsStatusManager'
import { checkNetworkAndSession } from '../api/anthentication'
import { syncAllMessagesBeforeWS } from '../localDB/sync'
import { saveMessageToDB } from '../localDB/db'
import { myID } from '../api/anthentication'

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
    win.webContents.send('ws:status', 'connected')

    // 连接成功后查询所有好友状态
    if (statusManager) {
      await statusManager.queryAllFriendsStatus()
    }
  }

  ws.onmessage = (event) => {
    try {
      // console.log('[WebSocket] 收到消息:', event.data)
      const parsed = JSON.parse(event.data)
      const validated: ServerMessage = ServerMessageSchema.parse(parsed)
      // console.log('[WebSocket] 解析后的消息类型:', validated.type)

      // 处理上线/下线消息
      if (validated.type === 'OnlineMessage' && statusManager) {
        // console.log('[WebSocket] 处理好友上线消息:', validated.friend_id)
        statusManager.handleFriendOnline(validated.friend_id)
      } else if (validated.type === 'OfflineMessage' && statusManager) {
        // console.log('[WebSocket] 处理好友下线消息:', validated.friend_id)
        statusManager.handleFriendOffline(validated.friend_id)
      }
      // 处理私聊消息
      else if (validated.type === 'SendMessage') {
        // console.log('[WebSocket] 收到私聊消息，准备处理:', validated)
        handlePrivateMessage(win, validated)
      }
      // 处理群聊消息
      else if (validated.type === 'SendGroupMessage') {
        // console.log('[WebSocket] 收到群聊消息，准备处理:', validated)
        handleGroupMessage(win, validated)
      } else {
        console.warn('[WebSocket] 未处理的消息类型:', validated.type)
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

// 处理私聊消息
function handlePrivateMessage(
  win: BrowserWindow,
  message: ServerMessage & { type: 'SendMessage' }
): void {
  const accountId = myID()
  // console.log('[WebSocket] 处理私聊消息，当前用户ID:', accountId, '消息发送者:', message.sender)

  if (!accountId) {
    console.error('[WebSocket] 无法获取当前用户ID，跳过消息处理')
    return
  }

  // 保存消息到数据库（包括自己发送的消息）
  const saveResult = saveMessageToDB({
    account_id: accountId,
    message_id: message.message_id,
    sender_id: message.sender,
    receiver_id: message.receiver, // 使用消息中的接收者ID
    group_id: null,
    message_type: 'text',
    content: message.message,
    timestamp: message.timestamp
  })

  if (saveResult) {
    // console.log('[WebSocket] 私聊消息已保存到数据库，message_id:', message.message_id)
    // 触发器会自动更新last_message_timestamp

    // 检查是否为当前用户发送的消息，如果不是则发送通知
    if (message.sender !== accountId) {
      // console.log('[WebSocket] 发送私聊消息通知')
      win.webContents.send('new-message', {
        type: 'private',
        sender_id: message.sender,
        content: message.message,
        timestamp: message.timestamp,
        message_id: message.message_id
      })
    } else {
      // console.log('[WebSocket] 跳过自己发送的私聊消息通知')
    }
  } else {
    console.error('[WebSocket] 私聊消息保存到数据库失败')
  }
}

// 处理群聊消息
function handleGroupMessage(
  win: BrowserWindow,
  message: ServerMessage & { type: 'SendGroupMessage' }
): void {
  const accountId = myID()
  // console.log(
  //   '[WebSocket] 处理群聊消息，当前用户ID:',
  //   accountId,
  //   '消息发送者:',
  //   message.sender,
  //   '群ID:',
  //   message.group_id
  // )

  if (!accountId) {
    console.error('[WebSocket] 无法获取当前用户ID，跳过消息处理')
    return
  }

  // 保存消息到数据库（包括自己发送的消息）
  const saveResult = saveMessageToDB({
    account_id: accountId,
    message_id: message.message_id,
    sender_id: message.sender,
    receiver_id: null,
    group_id: message.group_id,
    message_type: 'text',
    content: message.message,
    timestamp: message.timestamp
  })

  if (saveResult) {
    // console.log('[WebSocket] 群聊消息已保存到数据库，message_id:', message.message_id)
    // 触发器会自动更新last_message_timestamp

    // 检查是否为当前用户发送的消息，如果不是则发送通知
    if (message.sender !== accountId) {
      // console.log('[WebSocket] 发送群聊消息通知')
      win.webContents.send('new-message', {
        type: 'group',
        sender_id: message.sender,
        group_id: message.group_id,
        content: message.message,
        timestamp: message.timestamp,
        message_id: message.message_id
      })
    } else {
      // console.log('[WebSocket] 跳过自己发送的群聊消息通知')
    }
  } else {
    console.error('[WebSocket] 群聊消息保存到数据库失败')
  }
}
