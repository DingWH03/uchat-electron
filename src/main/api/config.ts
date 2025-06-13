// main/api/config.ts

import { ipcMain } from 'electron'

let apiBaseUrl = 'http://ssh.cxhap.top:25597'

export function setApiBaseUrl(newUrl: string): void {
  apiBaseUrl = newUrl
}

export function getApiBaseUrl(): string {
  return apiBaseUrl
}

export function BaseUrlApi(): void {
  ipcMain.handle('api:setBaseUrl', (_, newUrl: string) => {
    setApiBaseUrl(newUrl)
    console.log('API base URL updated to:', newUrl)
    return true
  })
}
