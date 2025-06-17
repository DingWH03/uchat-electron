import { Account, DBResult } from '@/types/localDBModel'

export { addOrUpdateAccount, getAccounts }

/// 插入登录账号到本地数据库
const addOrUpdateAccount = async (Data: Account): Promise<DBResult<void>> => {
  return window.localDB.addOrUpdateAccount(Data)
}

/// 从本地数据库读取登陆账户
const getAccounts = async (): Promise<DBResult<Account[]>> => {
  return window.localDB.getAccounts()
}
