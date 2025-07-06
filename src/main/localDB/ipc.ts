import { ipcMain, IpcMainInvokeEvent } from 'electron'
import * as localDB from './index'
import type { Account, DBResult } from '../../types/localDBModel'
import { GroupSimpleInfo, UserSimpleInfoWithStatus } from '../../types/HttpRespond'
import { myID } from '../api/anthentication'
import { getFriendsWithStatus, getFriendStatus } from './contact'
import * as db from './db'

export function registerLocalDBIpcHandlers(): void {
  ipcMain.handle(
    'localdb:addOrUpdateAccount',
    (_event: IpcMainInvokeEvent, data: Account): DBResult<void> => {
      try {
        const result = localDB.addOrUpdateAccount(data)
        return result
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        }
      }
    }
  )

  ipcMain.handle('localdb:getAccounts', (): DBResult<Account[]> => {
    try {
      const accounts = localDB.getAccounts()
      return accounts
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  })

  ipcMain.handle('localdb:deleteAccount', (_event, accountId: number): DBResult<void> => {
    const result = localDB.deleteAccount(accountId)
    return result
  })

  // 获取本地好友列表
  ipcMain.handle('localdb:friend/list', (): DBResult<UserSimpleInfoWithStatus[]> => {
    try {
      const data = localDB.friend_list()
      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  })

  // 获取本地群组列表
  ipcMain.handle('localdb:group/list', (): DBResult<GroupSimpleInfo[]> => {
    try {
      const data = localDB.group_list()
      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  })
  ipcMain.handle('localdb:contact/refresh', async (): Promise<DBResult<void>> => {
    try {
      await localDB.syncContacts()
      return { success: true, data: void 0 }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  })

  // 获取所有好友及其状态
  ipcMain.handle('localdb:friends/with-status', async () => {
    const accountId = myID()
    if (!accountId) return []
    return getFriendsWithStatus(accountId)
  })

  // 获取指定好友的状态
  ipcMain.handle('localdb:friend/status', async (_, userId: number) => {
    const accountId = myID()
    if (!accountId) return null
    return getFriendStatus(accountId, userId)
  })

  // 获取本地群聊聊天记录（分页）
  ipcMain.handle(
    'localdb:message/group',
    (_event, groupId: number, offset: number, limit: number) => {
      const accountId = myID()
      // console.log('[IPC] 查询群聊消息:', { accountId, groupId, offset, limit })
      if (!accountId) {
        console.error('[IPC] 未找到accountId，无法查询群聊消息')
        return []
      }
      const result = localDB.getLocalGroupMessages(accountId, groupId, offset, limit)
      // console.log('[IPC] 群聊消息查询结果:', result)
      return result
    }
  )

  // 获取本地私聊聊天记录（分页）
  ipcMain.handle(
    'localdb:message/user',
    (_event, userId: number, offset: number, limit: number) => {
      const accountId = myID()
      // console.log('[IPC] 查询私聊消息:', { accountId, userId, offset, limit })
      if (!accountId) {
        console.error('[IPC] 未找到accountId，无法查询私聊消息')
        return []
      }
      const result = localDB.getLocalPrivateMessages(accountId, userId, offset, limit)
      // console.log('[IPC] 私聊消息查询结果:', result)
      return result
    }
  )

  // 获取本地群聊某时间戳后的消息
  ipcMain.handle('localdb:message/group/after', (_event, groupId: number, after: number) => {
    const accountId = myID()
    if (!accountId) return []
    return localDB.getLocalGroupMessagesAfterTimestamp(accountId, groupId, after)
  })

  // 获取本地私聊某时间戳后的消息
  ipcMain.handle('localdb:message/user/after', (_event, userId: number, after: number) => {
    const accountId = myID()
    if (!accountId) return []
    return localDB.getLocalPrivateMessagesAfterTimestamp(accountId, userId, after)
  })

  // 新增：写入本地消息
  ipcMain.handle('localdb:saveMessageToDB', (_event, params) => {
    const accountId = myID()
    // console.log('[IPC] 当前accountId:', accountId)
    if (!accountId) {
      console.error('[IPC] 未找到accountId，无法保存消息')
      return false
    }
    const { type, receiver_id, group_id, message, sender_id, timestamp, message_id } = params
    // console.log('[IPC] 解析参数:', {
    //   type,
    //   receiver_id,
    //   group_id,
    //   message,
    //   sender_id,
    //   timestamp,
    //   message_id
    // })

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
      const result = db.saveMessageToDB(dbParams)
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
      const result = db.saveMessageToDB(dbParams)
      // console.log('[IPC] 群聊数据库保存结果:', result)
      return result
    }
    console.error('[IPC] 未知的消息类型:', type)
    return false
  })
}
