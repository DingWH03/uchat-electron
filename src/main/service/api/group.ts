// main/api/group.ts
import { CreateGroupRequest, GroupRequest } from '../../../types/HttpRequest'
import {
  GroupDetailedInfo,
  GroupSimpleInfo,
  RequestResponse,
  UserSimpleInfo
} from '../../../types/HttpRespond'
import { HttpMethod, request } from '@main/utils/httpRequest'

// 服务器端的群组列表
export async function group_list(): Promise<RequestResponse<GroupSimpleInfo[]>> {
  return request<GroupSimpleInfo[]>('/group/list', {
    method: HttpMethod.GET,
    auth: true
  })
}

// 服务器端的群组信息
export async function group_info(data: GroupRequest): Promise<RequestResponse<GroupDetailedInfo>> {
  return request<GroupDetailedInfo>('/group/info', {
    method: HttpMethod.GET,
    query: {
      user_id: data.id
    },
    auth: true
  })
}

// 服务端的查询群组成员
export async function group_members(
  data: GroupRequest
): Promise<RequestResponse<UserSimpleInfo[]>> {
  return request<UserSimpleInfo[]>('/group/members', {
    method: HttpMethod.GET,
    query: {
      user_id: data.id
    },
    auth: true
  })
}

// 创建群聊，返回新群 ID
export async function group_new(data: CreateGroupRequest): Promise<RequestResponse<number>> {
  return request<number>('/group/new', {
    method: HttpMethod.POST,
    data,
    auth: true
  })
}

// 加入群聊
export async function join_group(data: GroupRequest): Promise<RequestResponse<void>> {
  return request<void>('/group/join', {
    method: HttpMethod.POST,
    data,
    auth: true
  })
}

// 退出群聊
export async function leave_group(data: GroupRequest): Promise<RequestResponse<void>> {
  return request<void>('/group/leave', {
    method: HttpMethod.POST,
    data,
    auth: true
  })
}
