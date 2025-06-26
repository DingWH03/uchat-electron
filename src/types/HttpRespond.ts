// HttpRespond.ts

import { RoleType } from './Model'

export interface RequestResponse<T> {
  status: boolean // 请求是否成功
  code: number // HTTP 状态码
  message: string // 提示信息
  data?: T // 成功时返回的数据（可选）
}

// 通用结构体定义
export type SessionMessage = {
  sender_id: number
  message: string
  timestamp: number // ISO 格式字符串
}

export type UserSimpleInfo = {
  user_id: number
  username: string
  avatar_url: string | null // 头像URL，可能为null
}

export type UserSimpleInfoWithStatus = {
  base: UserSimpleInfo
  online: boolean
}

export type GroupSimpleInfo = {
  group_id: number
  title: string
  description: string | null // 群组描述，可能为null
  avatar_url: string | null // 群组头像URL，可能为null
}

export type UserDetailedInfo = {
  user_id: number
  username: string
  role: RoleType
}

export type GroupDetailedInfo = {
  group_id: number
  group_name: string
}

/// 好友与群组更新时间戳
export type UpdateTimestamps = {
  friends_updated_at: number // 好友列表更新时间戳
  groups_updated_at: number // 群组列表更新时间戳
}

/// 好友和群组共同返回值，用于存入数据库
export type ContactList = {
  friends: UserSimpleInfo[] // 好友列表
  groups: GroupSimpleInfo[] // 群组列表
}

export interface IdMessagePair {
  id: number
  message: SessionMessage
}