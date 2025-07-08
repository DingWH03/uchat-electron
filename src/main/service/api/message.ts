// main/api/message.ts
// import { ipcMain } from 'electron'
import { AfterTimestampQuery, MessageRequest } from '../../../types/HttpRequest'
import {
  GroupSessionMessage,
  IdMessagePair,
  RequestResponse,
  SessionMessage
} from '../../../types/HttpRespond'
import { HttpMethod, request } from '@main/utils/httpRequest'

// 1. 获取群聊聊天记录
export async function group_message(
  data: MessageRequest
): Promise<RequestResponse<GroupSessionMessage[]>> {
  return request<GroupSessionMessage[]>('/message/group', {
    method: HttpMethod.GET,
    query: {
      id: data.id,
      offset: data.offset
    },
    auth: true
  })
}

// 2. 获取某群聊最新一条消息时间戳
export async function getLatestTimestampOfGroup(
  groupId: number
): Promise<RequestResponse<number | null>> {
  return request<number | null>(`/message/group/${groupId}/latest`, {
    method: HttpMethod.GET,
    auth: true
  })
}

// 3. 获取用户所有群聊的最新一条消息时间戳
export async function getLatestTimestampsOfAllGroups(): Promise<
  RequestResponse<Record<number, number>>
> {
  return request<Record<number, number>>('/message/group/latest', {
    method: HttpMethod.GET,
    auth: true
  })
}

// 4. 获取所有群聊中最新一条消息的全局最大时间戳
export async function getMaxTimestampOfAllGroupMessages(): Promise<RequestResponse<number | null>> {
  return request<number | null>('/message/group/max', {
    method: HttpMethod.GET,
    auth: true
  })
}

// 5. 获取某个群某时间之后的消息
export async function getGroupMessagesAfterTimestamp(
  data: AfterTimestampQuery
): Promise<RequestResponse<SessionMessage[]>> {
  return request<SessionMessage[]>(`/message/group/${data.id}/after`, {
    method: HttpMethod.GET,
    query: { timestamp: data.after },
    auth: true
  })
}

// 6. 获取所有群某时间之后的消息（带群 ID）
export async function getAllGroupMessagesAfterTimestamp(
  after: number
): Promise<RequestResponse<IdMessagePair[]>> {
  return request<IdMessagePair[]>('/message/group/after', {
    method: HttpMethod.GET,
    query: { timestamp: after },
    auth: true
  })
}

// 7. 获取与某用户的聊天记录
export async function getPrivateMessages(
  data: MessageRequest
): Promise<RequestResponse<SessionMessage[]>> {
  return request<SessionMessage[]>('/message/user', {
    method: HttpMethod.GET,
    query: {
      id: data.id,
      offset: data.offset
    },
    auth: true
  })
}

// 8. 获取与某用户最后一条消息时间戳
export async function getLatestTimestampWithUser(
  friendId: number
): Promise<RequestResponse<number | null>> {
  return request<number | null>(`/message/user/${friendId}/latest`, {
    method: HttpMethod.GET,
    auth: true
  })
}

// 9. 获取所有私聊对话的最新消息时间戳（映射）
export async function getLatestTimestampsOfAllPrivateChats(): Promise<
  RequestResponse<Record<number, number>>
> {
  return request<Record<number, number>>('/message/user/latest', {
    method: HttpMethod.GET,
    auth: true
  })
}

// 10. 获取某时间之后所有私聊消息（带对方 ID）
export async function getAllPrivateMessagesAfterTimestamp(
  after: number
): Promise<RequestResponse<IdMessagePair[]>> {
  return request<IdMessagePair[]>('/message/user/after', {
    method: HttpMethod.GET,
    query: { timestamp: after },
    auth: true
  })
}

// 11. 获取当前用户所有私聊中最新一条消息的全局最大时间戳
export async function getMaxTimestampOfAllPrivateMessages(): Promise<
  RequestResponse<number | null>
> {
  return request<number | null>('/message/user/max', {
    method: HttpMethod.GET,
    auth: true
  })
}

// 12. 获取与某个用户某时间之后的聊天记录（时间递增）
export async function getPrivateMessagesAfterTimestamp(
  data: AfterTimestampQuery
): Promise<RequestResponse<SessionMessage[]>> {
  return request<SessionMessage[]>(`/message/user/${data.id}/after`, {
    method: HttpMethod.GET,
    query: { timestamp: data.after },
    auth: true
  })
}
