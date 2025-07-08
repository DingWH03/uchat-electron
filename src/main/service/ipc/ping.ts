import { ipcMain } from 'electron'
import { ping } from '../api/ping'
import { ApiResponse } from '@apiType/Model'

export function registerPingHandler(): void {
  ipcMain.handle('api:ping', async (): Promise<ApiResponse<void>> => {
    return (await ping()).toApiResponse()
  })
}
