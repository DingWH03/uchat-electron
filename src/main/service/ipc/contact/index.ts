import { ApiResponse } from '@apiType/Model'
import { ipcMain } from 'electron'
import { syncContacts } from '../../localDB'
import { registerFriendHandler } from './friend'
import { registerGroupHandler } from './group'

export function registerContactHandler(): void {
  registerFriendHandler()
  registerGroupHandler()
  ipcMain.handle('api:contact/refresh', async (): Promise<ApiResponse<void>> => {
    try {
      await syncContacts()
      return { success: true, data: void 0 }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  })
}
