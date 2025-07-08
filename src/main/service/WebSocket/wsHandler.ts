import { ServerMessage } from '@apiType/WebsocketRespond'
import { BrowserWindow } from 'electron'
import { saveMessageToDB } from '../localDB/message'
import { getMyID } from '../config/myID'

// 处理私聊消息
export function handlePrivateMessage(
  win: BrowserWindow,
  message: ServerMessage & { type: 'SendMessage' }
): void {
  const accountId = getMyID()
  if (!accountId) {
    console.error('[WebSocket] 无法获取当前用户ID，跳过消息处理')
    return
  }
  const saveResult = saveMessageToDB({
    account_id: accountId,
    message_id: message.message_id,
    sender_id: message.sender,
    receiver_id: message.receiver,
    group_id: null,
    message_type: 'text',
    content: message.message,
    timestamp: message.timestamp
  })
  if (saveResult) {
    if (message.sender !== accountId) {
      win.webContents.send('new-message', {
        type: 'private',
        sender_id: message.sender,
        content: message.message,
        timestamp: message.timestamp,
        message_id: message.message_id
      })
    }
  } else {
    console.error('[WebSocket] 私聊消息保存到数据库失败')
  }
}

// 处理群聊消息
export function handleGroupMessage(
  win: BrowserWindow,
  message: ServerMessage & { type: 'SendGroupMessage' }
): void {
  const accountId = getMyID()
  if (!accountId) {
    console.error('[WebSocket] 无法获取当前用户ID，跳过消息处理')
    return
  }
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
    if (message.sender !== accountId) {
      win.webContents.send('new-message', {
        type: 'group',
        sender_id: message.sender,
        group_id: message.group_id,
        content: message.message,
        timestamp: message.timestamp,
        message_id: message.message_id
      })
    }
  } else {
    console.error('[WebSocket] 群聊消息保存到数据库失败')
  }
}
