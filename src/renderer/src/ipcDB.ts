import { Account, DBResult } from '@/types/localDBModel'

export { addOrUpdateAccount, getAccounts, deleteAccount }

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
