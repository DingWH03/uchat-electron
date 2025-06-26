import { GroupSimpleInfo, UserSimpleInfo, UserSimpleInfoWithStatus } from '@/types/HttpRespond'
import { Account, DBResult } from '@/types/localDBModel'

export {
  addOrUpdateAccount,
  getAccounts,
  deleteAccount,
  friend_list,
  group_list,
  getFriendsWithStatus,
  getFriendStatus
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
