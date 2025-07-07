import { chatInfo } from '@apiType/Model'
import { ipcMain } from 'electron'
import { setChatId, getChatId, getApiBaseUrl, setApiBaseUrl } from '../config'
import { getMyID } from '../config/myID'

function registerChatIDManagerHandler(): void {
  ipcMain.handle('config:setChatId', (_, info: chatInfo) => {
    setChatId(info)
  })
  ipcMain.handle('config:getChatId', (): chatInfo => {
    return getChatId()
  })
}

function registerBaseURLManagerHandler(): void {
  ipcMain.handle('config:setBaseUrl', (_, newUrl: string) => {
    setApiBaseUrl(newUrl)
    console.log('API base URL updated to:', newUrl)
    return true
  })
  ipcMain.handle('config:getBaseUrl', (): string => {
    return getApiBaseUrl()
  })
}

function registerMyIDHandler(): void {
  // 获取登陆用户id的后端api
  ipcMain.handle('config:myid', (): number => {
    return getMyID()
  })
}

/// 集中注册所有config api
export function registerConfigHandler(): void {
  registerBaseURLManagerHandler()
  registerChatIDManagerHandler()
  registerMyIDHandler()
}
