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
  timestamp: string // ISO 格式字符串
}

export type UserSimpleInfo = {
  user_id: number
  username: string
}

export type UserSimpleInfoWithStatus = {
  base: UserSimpleInfo
  online: boolean
}

export type GroupSimpleInfo = {
  group_id: number
  title: string
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
