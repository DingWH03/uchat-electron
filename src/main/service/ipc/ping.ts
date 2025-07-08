import { ipcMain } from 'electron'
import { ping } from '../api/ping'

export function registerPingHandler(): void {
  ipcMain.handle('api:ping', async () => {
    return ping()
  })
}
