import { ipcMain, IpcMainInvokeEvent } from 'electron'
import * as localDB from './index'
import type { Account, DBResult } from '../../types/localDBModel'
import { GroupSimpleInfo, UserSimpleInfo } from '../../types/HttpRespond'

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
  ipcMain.handle('localdb:getFriends', (): DBResult<UserSimpleInfo[]> => {
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
  ipcMain.handle('localdb:getGroups', (): DBResult<GroupSimpleInfo[]> => {
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
  ipcMain.handle('localdb:refreshContact', async (): Promise<DBResult<void>> => {
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
}
