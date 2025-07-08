import { Account, ApiResponse } from '@apiType/Model'
import { ipcMain, IpcMainInvokeEvent } from 'electron'
import { addOrUpdateAccount, getAccounts, deleteAccount } from '../localDB'

export function registerAccountManageHandler(): void {
  ipcMain.handle(
    'api:account/addOrUpdateAccount',
    (_event: IpcMainInvokeEvent, data: Account): ApiResponse<void> => {
      try {
        const result = addOrUpdateAccount(data)
        return result
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        }
      }
    }
  )

  ipcMain.handle('api:account/getAccounts', (): ApiResponse<Account[]> => {
    try {
      const accounts = getAccounts()
      return accounts
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  })

  ipcMain.handle('api:account/deleteAccount', (_event, accountId: number): ApiResponse<void> => {
    const result = deleteAccount(accountId)
    return result
  })
}
