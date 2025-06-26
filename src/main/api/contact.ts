// main/api/friend.ts
import { getApiBaseUrl } from '../config/url'
import { getSessionId } from '../config/session'
import { ContactList, RequestResponse, UpdateTimestamps } from '../../types/HttpRespond'

/// 获取群组和好友的时间戳
export async function contact_timestamps(): Promise<RequestResponse<UpdateTimestamps>> {
  const sessionId = getSessionId()
  const baseUrl = getApiBaseUrl()
  const res = await fetch(`${baseUrl}/user/contact/timestamps`, {
    method: 'GET',
    headers: {
      Cookie: `session_id=${sessionId}`
    }
  })
  // console.log('获取联系人时间戳:', res)
  return res.json()
}

/// 获取群组和好友的列表
export async function contact_list(): Promise<RequestResponse<ContactList>> {
  const sessionId = getSessionId()
  const baseUrl = getApiBaseUrl()
  const res = await fetch(`${baseUrl}/user/contact/list`, {
    method: 'GET',
    headers: {
      Cookie: `session_id=${sessionId}`
    }
  })
  return res.json()
}
