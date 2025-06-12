// main/api/message.ts
import { ipcMain } from 'electron'
import { getApiBaseUrl } from './config'
import { MessageRequest } from '../../types/HttpRequest'
import { getSessionId } from '../session'
import { ServerResponse } from '../../types/HttpRespond'

export function registerMessageApi(): void {
  // 获取群聊聊天记录的后端http api
  ipcMain.handle('api:message/group', async (_, Data: MessageRequest): Promise<ServerResponse> => {
    const sessionId = getSessionId()
    const baseUrl = getApiBaseUrl()
    const res = await fetch(`${baseUrl}/message/group`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `session_id=${sessionId}`
      },
      body: JSON.stringify(Data)
    })
    return res.json()
  })
  // 获取私聊聊天记录的后端http api
  ipcMain.handle('api:message/user', async (_, Data: MessageRequest): Promise<ServerResponse> => {
    const sessionId = getSessionId()
    const baseUrl = getApiBaseUrl()
    const res = await fetch(`${baseUrl}/message/user`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `session_id=${sessionId}`
      },
      body: JSON.stringify(Data)
    })
    return res.json()
  })
}
