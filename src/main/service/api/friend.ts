// main/api/friend.ts
import { FriendRequest } from '../../../types/HttpRequest'
import {
  RequestResponse,
  UserDetailedInfo,
  UserSimpleInfoWithStatus
} from '../../../types/HttpRespond'
import { UserStatus } from '../../../types/Model'
import { HttpMethod, request } from '@main/utils/httpRequest'

/// 根据用户id数组查询在线情况（使用 POST + JSON body）
export async function user_status(userIds: number[]): Promise<RequestResponse<UserStatus[]>> {
  return request<UserStatus[]>('/friend/status', {
    method: HttpMethod.POST,
    data: {
      user_ids: userIds
    },
    auth: true
  })
}

// 添加好友
export async function add_friend(data: FriendRequest): Promise<RequestResponse<void>> {
  return request<void>('/friend/add', {
    method: HttpMethod.POST,
    data,
    auth: true
  })
}

// 好友列表（含状态）
export async function friend_list_v2(): Promise<RequestResponse<UserSimpleInfoWithStatus[]>> {
  return request<UserSimpleInfoWithStatus[]>('/friend/listv2', {
    method: HttpMethod.GET,
    auth: true
  })
}

// 查询好友信息
export async function friend_info(data: FriendRequest): Promise<RequestResponse<UserDetailedInfo>> {
  return request<UserDetailedInfo>('/friend/info', {
    method: HttpMethod.GET,
    query: {
      user_id: data.id
    },
    auth: true
  })
}
