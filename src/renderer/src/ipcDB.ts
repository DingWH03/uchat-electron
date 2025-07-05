import { GroupSimpleInfo, UserSimpleInfo, UserSimpleInfoWithStatus } from '@/types/HttpRespond'
import { Account, DBResult } from '@/types/localDBModel'

// 本地数据库返回的消息结构
interface LocalSessionMessage {
  sender_id: number
  message_type: string
  content: string
  timestamp: number
}

export {
  addOrUpdateAccount,
  getAccounts,
  deleteAccount,
  friend_list,
  group_list,
  getFriendsWithStatus,
  getFriendStatus,
  getLocalGroupMessages,
  getLocalPrivateMessages,
  getLocalGroupMessagesAfterTimestamp,
  getLocalPrivateMessagesAfterTimestamp,
  saveMessageToDB
}

/// 插入登录账号到本地数据库
const addOrUpdateAccount = async (Data: Account): Promise<DBResult<void>> => {
  return window.localDB.addOrUpdateAccount(Data)
}

/// 从本地数据库读取登陆账户
const getAccounts = async (): Promise<DBResult<Account[]>> => {
  return window.localDB.getAccounts()
}

/// 从本地数据库删除登录账号
const deleteAccount = async (accountId: number): Promise<DBResult<void>> => {
  return window.localDB.deleteAccount(accountId)
}

/// 群组列表的api
const group_list = async (): Promise<DBResult<GroupSimpleInfo[]>> => {
  return window.localDB.group_list()
}

/// 好友列表的api
const friend_list = async (): Promise<DBResult<UserSimpleInfoWithStatus[]>> => {
  return window.localDB.friend_list()
}

/// 获取所有好友及其状态
const getFriendsWithStatus = async (): Promise<
  DBResult<Array<UserSimpleInfo & { online: boolean; lastOnlineTime: number }>>
> => {
  return window.localDB.getFriendsWithStatus()
}

/// 获取指定好友的状态
const getFriendStatus = async (
  userId: number
): Promise<DBResult<{ online: boolean; lastOnlineTime: number } | null>> => {
  return window.localDB.getFriendStatus(userId)
}

/// 本地群聊聊天记录（分页）
const getLocalGroupMessages = async (groupId: number, offset: number, limit: number): Promise<LocalSessionMessage[]> => {
  return window.localDB.getLocalGroupMessages(groupId, offset, limit)
}

/// 本地私聊聊天记录（分页）
const getLocalPrivateMessages = async (userId: number, offset: number, limit: number): Promise<LocalSessionMessage[]> => {
  return window.localDB.getLocalPrivateMessages(userId, offset, limit)
}

/// 本地群聊某时间戳后的消息
const getLocalGroupMessagesAfterTimestamp = async (groupId: number, after: number): Promise<LocalSessionMessage[]> => {
  return window.localDB.getLocalGroupMessagesAfterTimestamp(groupId, after)
}

/// 本地私聊某时间戳后的消息
const getLocalPrivateMessagesAfterTimestamp = async (userId: number, after: number): Promise<LocalSessionMessage[]> => {
  return window.localDB.getLocalPrivateMessagesAfterTimestamp(userId, after)
}

/// 写入本地消息
const saveMessageToDB = async (params: {
  type: 'private' | 'group',
  receiver_id?: number,
  group_id?: number,
  message: string,
  sender_id: number,
  timestamp: number,
  message_id?: number
}): Promise<boolean> => {
  return window.localDB.saveMessageToDB(params)
}
