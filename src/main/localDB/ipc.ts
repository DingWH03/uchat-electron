import { ipcMain, IpcMainInvokeEvent } from 'electron'
import * as localDB from './index'
import type { Account, DBResult } from '../../types/localDBModel'
import { GroupSimpleInfo, UserSimpleInfoWithStatus } from '../../types/HttpRespond'
import { myID } from '../api/anthentication'
import { getFriendsWithStatus, getFriendStatus } from './contact'

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
}
