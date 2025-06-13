// main/api/friend.ts
import { ipcMain } from 'electron'
import { getApiBaseUrl } from './config'
import { FriendRequest } from '../../types/HttpRequest'
import { getSessionId } from '../session'
import { ServerResponse } from '../../types/HttpRespond'

export function registerFriendApi(): void {
  // 添加好友的后端http api
  ipcMain.handle('api:friend/add', async (_, Data: FriendRequest): Promise<ServerResponse> => {
    const sessionId = getSessionId()
    const baseUrl = getApiBaseUrl()
    const res = await fetch(`${baseUrl}/friend/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `session_id=${sessionId}`
      },
      body: JSON.stringify(Data)
    })
    return res.json()
  })
  // 获取好友列表的后端http api
  ipcMain.handle('api:friend/list', async (): Promise<ServerResponse> => {
    const sessionId = getSessionId()
    const baseUrl = getApiBaseUrl()
    const res = await fetch(`${baseUrl}/friend/list`, {
      method: 'GET',
      headers: {
        Cookie: `session_id=${sessionId}`
      }
    })
    return res.json()
  })
  // 获取好友列表的后端http apiv2
  ipcMain.handle('api:friend/listv2', async (): Promise<ServerResponse> => {
    const sessionId = getSessionId()
    const baseUrl = getApiBaseUrl()
    const res = await fetch(`${baseUrl}/friend/listv2`, {
      method: 'GET',
      headers: {
        Cookie: `session_id=${sessionId}`
      }
    })
    return res.json()
  })
  // 获取好友详细信息的后端http api
  ipcMain.handle('api:friend/info', async (_, Data: FriendRequest): Promise<ServerResponse> => {
    const sessionId = getSessionId()
    const baseUrl = getApiBaseUrl()
    const query = new URLSearchParams({
      request_type: Data.request_type,
      user_id: Data.id.toString()
    })
    const res = await fetch(`${baseUrl}/friend/info?${query.toString()}`, {
      method: 'GET',
      headers: {
        Cookie: `session_id=${sessionId}`
      },
    })
    return res.json()
  })
}
