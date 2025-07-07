// main/api/friend.ts
import { ContactList, RequestResponse, UpdateTimestamps } from '../../../types/HttpRespond'
import { request } from '@main/utils/httpRequest'

/// 获取群组和好友的时间戳
export async function contact_timestamps(): Promise<RequestResponse<UpdateTimestamps>> {
  return request<UpdateTimestamps>('/user/contact/timestamps', {
    method: 'GET',
    auth: true
  })
}

/// 获取群组和好友的列表
export async function contact_list(): Promise<RequestResponse<ContactList>> {
  return request<ContactList>('/user/contact/list', {
    method: 'GET',
    auth: true
  })
}
