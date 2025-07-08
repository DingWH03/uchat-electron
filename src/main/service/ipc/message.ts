import { ipcMain } from 'electron'
import { getMyID } from '../config/myID'
import {
  getLocalGroupMessages,
  getLocalPrivateMessages,
  getLocalGroupMessagesAfterTimestamp,
  getLocalPrivateMessagesAfterTimestamp,
  saveMessageToDB
} from '../localDB'

export function registerMessageHandler(): void {
  // 获取本地群聊聊天记录（分页）
  ipcMain.handle('api:message/group', (_event, groupId: number, offset: number, limit: number) => {
    const accountId = getMyID()
    // console.log('[IPC] 查询群聊消息:', { accountId, groupId, offset, limit })
    if (!accountId) {
      console.error('[IPC] 未找到accountId，无法查询群聊消息')
      return []
    }
    const result = getLocalGroupMessages(accountId, groupId, offset, limit)
    // console.log('[IPC] 群聊消息查询结果:', result)
    return result
  })

  // 获取本地私聊聊天记录（分页）
  ipcMain.handle('api:message/user', (_event, userId: number, offset: number, limit: number) => {
    const accountId = getMyID()
    // console.log('[IPC] 查询私聊消息:', { accountId, userId, offset, limit })
    if (!accountId) {
      console.error('[IPC] 未找到accountId，无法查询私聊消息')
      return []
    }
    const result = getLocalPrivateMessages(accountId, userId, offset, limit)
    // console.log('[IPC] 私聊消息查询结果:', result)
    return result
  })

  // 获取本地群聊某时间戳后的消息
  ipcMain.handle('api:message/group/after', (_event, groupId: number, after: number) => {
    const accountId = getMyID()
    if (!accountId) return []
    return getLocalGroupMessagesAfterTimestamp(accountId, groupId, after)
  })

  // 获取本地私聊某时间戳后的消息
  ipcMain.handle('api:message/user/after', (_event, userId: number, after: number) => {
    const accountId = getMyID()
    if (!accountId) return []
    return getLocalPrivateMessagesAfterTimestamp(accountId, userId, after)
  })

  // 新增：写入本地消息
  ipcMain.handle('api:saveMessageToDB', (_event, params) => {
    const accountId = getMyID()
    // console.log('[IPC] 当前accountId:', accountId)
    if (!accountId) {
      console.error('[IPC] 未找到accountId，无法保存消息')
      return false
    }
    const { type, receiver_id, group_id, message, sender_id, timestamp, message_id } = params

    if (type === 'private') {
      const dbParams = {
        account_id: accountId,
        message_id: message_id || 0, // 如果没有message_id，使用0作为默认值
        sender_id,
        receiver_id,
        group_id: null,
        message_type: 'text',
        content: message,
        timestamp
      }
      // console.log('[IPC] 私聊数据库参数:', dbParams)
      const result = saveMessageToDB(dbParams)
      // console.log('[IPC] 私聊数据库保存结果:', result)
      return result
    } else if (type === 'group') {
      const dbParams = {
        account_id: accountId,
        message_id: message_id || 0, // 如果没有message_id，使用0作为默认值
        sender_id,
        receiver_id: null,
        group_id,
        message_type: 'text',
        content: message,
        timestamp
      }
      // console.log('[IPC] 群聊数据库参数:', dbParams)
      const result = saveMessageToDB(dbParams)
      // console.log('[IPC] 群聊数据库保存结果:', result)
      return result
    }
    console.error('[IPC] 未知的消息类型:', type)
    return false
  })
}
