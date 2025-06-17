import { ipcMain, IpcMainInvokeEvent } from 'electron'
import * as localDB from './index'
import type { Account, DBResult } from '../../types/localDBModel'

export function registerLocalDBIpcHandlers(): void {
  ipcMain.handle(
    'localdb:addOrUpdateAccount',
    async (_event: IpcMainInvokeEvent, data: Account): Promise<DBResult<void>> => {
      try {
        // 这里调用本地db的异步方法
        const result = await localDB.addOrUpdateAccount(data.id, data.username, data.password)
        return result
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        }
      }
    }
  )

  ipcMain.handle('localdb:getAccounts', async (): Promise<DBResult<Account[]>> => {
    try {
      const accounts = localDB.getAccounts()
      return { success: true, data: accounts }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  })
}
