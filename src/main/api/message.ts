// main/api/message.ts
import { ipcMain } from 'electron'
import { getApiBaseUrl } from '../config/url'
import { MessageRequest } from '../../types/HttpRequest'
import { getSessionId } from '../config/session'
import { RequestResponse, SessionMessage } from '../../types/HttpRespond'

export function registerMessageApi(): void {
  // 获取群聊聊天记录的后端http api
  ipcMain.handle(
    'api:message/group',
    async (_, Data: MessageRequest): Promise<RequestResponse<SessionMessage>> => {
      const sessionId = getSessionId()
      const baseUrl = getApiBaseUrl()
      const query = new URLSearchParams({
        id: Data.id.toString(),
        offset: Data.offset.toString()
      })
      const res = await fetch(`${baseUrl}/message/group?${query.toString()}`, {
        method: 'GET',
        headers: {
          Cookie: `session_id=${sessionId}`
        }
      })
      return res.json()
    }
  )
  // 获取私聊聊天记录的后端http api
  ipcMain.handle(
    'api:message/user',
    async (_, Data: MessageRequest): Promise<RequestResponse<SessionMessage>> => {
      const sessionId = getSessionId()
      const baseUrl = getApiBaseUrl()
      const query = new URLSearchParams({
        id: Data.id.toString(),
        offset: Data.offset.toString()
      })
      const res = await fetch(`${baseUrl}/message/user?${query.toString()}`, {
        method: 'GET',
        headers: {
          Cookie: `session_id=${sessionId}`
        }
      })
      return res.json()
    }
  )
}
