// main/api/message.ts
import { ipcMain } from 'electron'
import { getApiBaseUrl } from '../config/url'
import { AfterTimestampQuery, MessageRequest } from '../../types/HttpRequest'
import { getSessionId } from '../config/session'
import {
  GroupSessionMessage,
  IdMessagePair,
  RequestResponse,
  SessionMessage
} from '../../types/HttpRespond'

// 1. 获取群聊聊天记录
export async function group_message(
  Data: MessageRequest
): Promise<RequestResponse<GroupSessionMessage[]>> {
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

// 2. 获取某群聊最新一条消息时间戳
export async function getLatestTimestampOfGroup(
  groupId: number
): Promise<RequestResponse<number | null>> {
  const sessionId = getSessionId()
  const baseUrl = getApiBaseUrl()
  const res = await fetch(`${baseUrl}/message/group/${groupId}/latest`, {
    method: 'GET',
    headers: { Cookie: `session_id=${sessionId}` }
  })
  return res.json()
}

// 3. 获取用户所有群聊的最新一条消息时间戳
export async function getLatestTimestampsOfAllGroups(): Promise<
  RequestResponse<Record<number, number>>
> {
  const sessionId = getSessionId()
  const baseUrl = getApiBaseUrl()
  try {
    const res = await fetch(`${baseUrl}/message/group/latest`, {
      method: 'GET',
      headers: { Cookie: `session_id=${sessionId}` }
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error(
        `[API] getLatestTimestampsOfAllGroups HTTP错误: ${res.status} ${res.statusText}, body: ${errorText}`
      )
      return {
        status: false,
        code: res.status,
        message: `HTTP ${res.status}: ${res.statusText} - ${errorText}`,
        data: undefined
      }
    }

    return await res.json()
  } catch (error) {
    console.error('[API] getLatestTimestampsOfAllGroups 请求失败:', error)
    return {
      status: false,
      code: 500,
      message: error instanceof Error ? error.message : '请求失败',
      data: undefined
    }
  }
}

// 4. 获取所有群聊中最新一条消息的全局最大时间戳
export async function getMaxTimestampOfAllGroupMessages(): Promise<RequestResponse<number | null>> {
  const sessionId = getSessionId()
  const baseUrl = getApiBaseUrl()
  const res = await fetch(`${baseUrl}/message/group/max`, {
    method: 'GET',
    headers: { Cookie: `session_id=${sessionId}` }
  })
  return res.json()
}

// 5. 获取某个群某时间之后的消息
export async function getGroupMessagesAfterTimestamp(
  data: AfterTimestampQuery
): Promise<RequestResponse<SessionMessage[]>> {
  const sessionId = getSessionId()
  const baseUrl = getApiBaseUrl()
  const query = new URLSearchParams({ after: data.after.toString() })
  const res = await fetch(`${baseUrl}/message/group/${data.id}/after?${query.toString()}`, {
    method: 'GET',
    headers: { Cookie: `session_id=${sessionId}` }
  })
  return res.json()
}

// 6. 获取所有群某时间之后的消息（带群 ID）
export async function getAllGroupMessagesAfterTimestamp(
  after: number
): Promise<RequestResponse<IdMessagePair[]>> {
  const sessionId = getSessionId()
  const baseUrl = getApiBaseUrl()
  const query = new URLSearchParams({ after: after.toString() })
  const res = await fetch(`${baseUrl}/message/group/after?${query.toString()}`, {
    method: 'GET',
    headers: { Cookie: `session_id=${sessionId}` }
  })
  return res.json()
}

// 7. 获取与某用户的聊天记录
export async function getPrivateMessages(
  data: MessageRequest
): Promise<RequestResponse<SessionMessage[]>> {
  const sessionId = getSessionId()
  const baseUrl = getApiBaseUrl()
  const query = new URLSearchParams({ id: data.id.toString(), offset: data.offset.toString() })
  const res = await fetch(`${baseUrl}/message/user?${query.toString()}`, {
    method: 'GET',
    headers: { Cookie: `session_id=${sessionId}` }
  })
  return res.json()
}

// 8. 获取与某用户最后一条消息时间戳
export async function getLatestTimestampWithUser(
  friendId: number
): Promise<RequestResponse<number | null>> {
  const sessionId = getSessionId()
  const baseUrl = getApiBaseUrl()
  const res = await fetch(`${baseUrl}/message/user/${friendId}/latest`, {
    method: 'GET',
    headers: { Cookie: `session_id=${sessionId}` }
  })
  return res.json()
}

// 9. 获取所有私聊对话最新消息时间戳（映射）
export async function getLatestTimestampsOfAllPrivateChats(): Promise<
  RequestResponse<Record<number, number>>
> {
  const sessionId = getSessionId()
  const baseUrl = getApiBaseUrl()
  try {
    const res = await fetch(`${baseUrl}/message/user/latest`, {
      method: 'GET',
      headers: { Cookie: `session_id=${sessionId}` }
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error(
        `[API] getLatestTimestampsOfAllPrivateChats HTTP错误: ${res.status} ${res.statusText}, body: ${errorText}`
      )
      return {
        status: false,
        code: res.status,
        message: `HTTP ${res.status}: ${res.statusText} - ${errorText}`,
        data: undefined
      }
    }

    return await res.json()
  } catch (error) {
    console.error('[API] getLatestTimestampsOfAllPrivateChats 请求失败:', error)
    return {
      status: false,
      code: 500,
      message: error instanceof Error ? error.message : '请求失败',
      data: undefined
    }
  }
}

// 10. 获取某时间之后所有私聊消息（带对方 ID）
export async function getAllPrivateMessagesAfterTimestamp(
  after: number
): Promise<RequestResponse<IdMessagePair[]>> {
  const sessionId = getSessionId()
  const baseUrl = getApiBaseUrl()
  const query = new URLSearchParams({ after: after.toString() })
  const res = await fetch(`${baseUrl}/message/user/after?${query.toString()}`, {
    method: 'GET',
    headers: { Cookie: `session_id=${sessionId}` }
  })
  return res.json()
}

// 11. 获取当前用户所有私聊中最新的一条消息时间戳（全局最大）
export async function getMaxTimestampOfAllPrivateMessages(): Promise<
  RequestResponse<number | null>
> {
  const sessionId = getSessionId()
  const baseUrl = getApiBaseUrl()
  const res = await fetch(`${baseUrl}/message/user/max`, {
    method: 'GET',
    headers: {
      Cookie: `session_id=${sessionId}`
    }
  })
  return res.json()
}

// 12. 获取与某个用户某时间之后的聊天记录（时间递增）
export async function getPrivateMessagesAfterTimestamp(
  data: AfterTimestampQuery
): Promise<RequestResponse<SessionMessage[]>> {
  const sessionId = getSessionId()
  const baseUrl = getApiBaseUrl()
  const query = new URLSearchParams({ timestamp: data.after.toString() })
  const url = `${baseUrl}/message/user/${data.id}/after?${query.toString()}`
  try {
    console.log('[API] getPrivateMessagesAfterTimestamp 请求:', url)
    const res = await fetch(url, {
      method: 'GET',
      headers: { Cookie: `session_id=${sessionId}` }
    })
    const text = await res.text()
    console.log('[API] getPrivateMessagesAfterTimestamp 响应状态:', res.status, res.statusText)
    console.log('[API] getPrivateMessagesAfterTimestamp 响应体:', text)
    if (!res.ok) {
      return {
        status: false,
        code: res.status,
        message: `HTTP ${res.status}: ${res.statusText} - ${text}`,
        data: undefined
      }
    }
    return JSON.parse(text)
  } catch (error) {
    console.error('[API] getPrivateMessagesAfterTimestamp 请求失败:', error)
    return {
      status: false,
      code: 500,
      message: error instanceof Error ? error.message : '请求失败',
      data: undefined
    }
  }
}

export function registerMessageApi(): void {
  // 获取群聊聊天记录的后端http api
  ipcMain.handle(
    'api:message/group',
    async (_, Data: MessageRequest): Promise<RequestResponse<SessionMessage[]>> => {
      return await group_message(Data)
    }
  )
  // 获取私聊聊天记录的后端http api
  ipcMain.handle(
    'api:message/user',
    async (_, Data: MessageRequest): Promise<RequestResponse<SessionMessage[]>> => {
      return await getPrivateMessages(Data)
    }
  )
}
