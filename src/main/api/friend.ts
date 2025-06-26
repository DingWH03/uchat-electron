// main/api/friend.ts
import { ipcMain } from 'electron'
import { getApiBaseUrl } from '../config/url'
import { FriendRequest } from '../../types/HttpRequest'
import { getSessionId } from '../config/session'
import {
  RequestResponse,
  UserDetailedInfo,
  UserSimpleInfoWithStatus
} from '../../types/HttpRespond'
import { UserStatus } from '../../types/Model'
import { friend_list as localFriendList } from '../localDB/contact'

/// 根据用户id数组查询在线情况（使用 POST + JSON body）
export async function user_status(userIds: number[]): Promise<RequestResponse<UserStatus[]>> {
  try {
    const sessionId = getSessionId()
    const baseUrl = getApiBaseUrl()

    const url = `${baseUrl}/friend/status`
    console.log('[user_status] 请求URL:', url)
    console.log('[user_status] 请求体:', { user_ids: userIds })

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `session_id=${sessionId}`
      },
      body: JSON.stringify({
        user_ids: userIds
      })
    })

    console.log('[user_status] 响应状态:', res.status, res.statusText)

    if (!res.ok) {
      let errorMessage = `HTTP ${res.status}: ${res.statusText}`
      try {
        const errorText = await res.text()
        if (errorText) {
          errorMessage += ` - ${errorText}`
        }
      } catch {
        // 如果获取错误文本失败，保持原有错误信息
        console.error('[user_status] 获取错误文本失败')
      }
      return {
        status: false,
        code: res.status,
        message: errorMessage,
        data: undefined
      }
    }

    const text = await res.text()
    if (!text || text.trim() === '') {
      return {
        status: false,
        code: res.status,
        message: '服务器返回空响应',
        data: undefined
      }
    }

    const data = JSON.parse(text)
    return data
  } catch (error) {
    console.error('[user_status] 请求失败:', error)
    return {
      status: false,
      code: 500,
      message: error instanceof Error ? error.message : '查询用户状态失败',
      data: undefined
    }
  }
}

export function registerFriendApi(): void {
  // 添加好友的后端http api
  ipcMain.handle(
    'api:friend/add',
    async (_, Data: FriendRequest): Promise<RequestResponse<void>> => {
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
    }
  )
  // 获取好友列表的后端http api
  ipcMain.handle(
    'api:friend/list',
    async (): Promise<RequestResponse<UserSimpleInfoWithStatus[]>> => {
      try {
        const friends = localFriendList()
        return {
          status: true,
          code: 200,
          message: '获取好友列表成功',
          data: friends
        }
      } catch (error) {
        return {
          status: false,
          code: 500,
          message: error instanceof Error ? error.message : '获取好友列表失败',
          data: undefined
        }
      }
    }
  )
  // 获取好友列表的后端http apiv2
  ipcMain.handle(
    'api:friend/listv2',
    async (): Promise<RequestResponse<UserSimpleInfoWithStatus[]>> => {
      const sessionId = getSessionId()
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/friend/listv2`, {
        method: 'GET',
        headers: {
          Cookie: `session_id=${sessionId}`
        }
      })
      return res.json()
    }
  )
  // 获取好友详细信息的后端http api
  ipcMain.handle(
    'api:friend/info',
    async (_, Data: FriendRequest): Promise<RequestResponse<UserDetailedInfo>> => {
      const sessionId = getSessionId()
      const baseUrl = getApiBaseUrl()
      const query = new URLSearchParams({
        user_id: Data.id.toString()
      })
      const res = await fetch(`${baseUrl}/friend/info?${query.toString()}`, {
        method: 'GET',
        headers: {
          Cookie: `session_id=${sessionId}`
        }
      })
      return res.json()
    }
  )
}
