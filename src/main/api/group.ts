// main/api/group.ts
import { ipcMain } from 'electron'
import { getApiBaseUrl } from './config'
import { CreateGroupRequest, GroupRequest } from '../../types/HttpRequest'
import { getSessionId } from '../session'
import { ServerResponse } from '../../types/HttpRespond'

export function registerGroupApi(): void {
  // 获取群聊列表的后端http api
  ipcMain.handle('api:group/list', async (): Promise<ServerResponse> => {
    const sessionId = getSessionId()
    const baseUrl = getApiBaseUrl()
    const res = await fetch(`${baseUrl}/group/list`, {
      method: 'GET',
      headers: {
        Cookie: `session_id=${sessionId}`
      },
    })
    return res.json()
  })
  // 获取群聊信息的后端http api
  ipcMain.handle('api:group/info', async (_, Data: GroupRequest): Promise<ServerResponse> => {
    const sessionId = getSessionId()
    const baseUrl = getApiBaseUrl()
    const res = await fetch(`${baseUrl}/group/info`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `session_id=${sessionId}`
      },
      body: JSON.stringify(Data)
    })
    return res.json()
  })
  // 创建群聊的后端http api
  ipcMain.handle('api:group/new', async (_, Data: CreateGroupRequest): Promise<ServerResponse> => {
    const sessionId = getSessionId()
    const baseUrl = getApiBaseUrl()
    const res = await fetch(`${baseUrl}/group/new`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `session_id=${sessionId}`
      },
      body: JSON.stringify(Data)
    })
    return res.json()
  })
  // 加入群聊的后端http api
  ipcMain.handle('api:group/join', async (_, Data: GroupRequest): Promise<ServerResponse> => {
    const sessionId = getSessionId()
    const baseUrl = getApiBaseUrl()
    const res = await fetch(`${baseUrl}/group/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `session_id=${sessionId}`
      },
      body: JSON.stringify(Data)
    })
    return res.json()
  })
  // 退出群聊的后端http api
  ipcMain.handle('api:group/leave', async (_, Data: GroupRequest): Promise<ServerResponse> => {
    const sessionId = getSessionId()
    const baseUrl = getApiBaseUrl()
    const res = await fetch(`${baseUrl}/group/leave`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `session_id=${sessionId}`
      },
      body: JSON.stringify(Data)
    })
    return res.json()
  })
}
