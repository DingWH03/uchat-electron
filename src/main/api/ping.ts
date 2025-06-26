// main/api/ping.ts
import { ipcMain } from 'electron'
import { getApiBaseUrl } from '../config/url'

export function registerPingApi(): void {
  ipcMain.handle('api:ping', async () => {
    const baseUrl = getApiBaseUrl()
    const res = await fetch(`${baseUrl}/ping`)
    return res.json()
  })
}
