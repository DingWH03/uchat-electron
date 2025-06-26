import { contact_list, contact_timestamps } from '../api/contact'
import {
  getLocalUpdateTimestamps,
  saveFriendList,
  saveGroupList,
  updateLocalTimestamps
} from './contact'
import { ContactList, UpdateTimestamps } from '../../types/HttpRespond'
import { myID } from '../api/anthentication'
import { ensureAccountExistsWithoutPassword } from './account'

export async function syncContacts(): Promise<void> {
  const accountId = myID()
  ensureAccountExistsWithoutPassword(accountId)
  // 获取服务端更新时间
  const remoteRes = await contact_timestamps()
  if (!remoteRes.status || !remoteRes.data) {
    console.warn('获取远程更新时间失败:', remoteRes.message)
    return
  }
  const remoteTimestamps = remoteRes.data as UpdateTimestamps
  const localTimestamps = getLocalUpdateTimestamps(accountId)
  console.log(localTimestamps)
  console.log(remoteTimestamps)

  const needUpdateFriends = remoteTimestamps.friends_updated_at > localTimestamps.friends_updated_at
  const needUpdateGroups = remoteTimestamps.groups_updated_at > localTimestamps.groups_updated_at

  // 如果都不需要更新，直接返回
  if (!needUpdateFriends && !needUpdateGroups) {
    console.log('联系人数据已是最新，无需同步')
    return
  }

  // 拉取联系人列表
  const listRes = await contact_list()
  if (!listRes.status || !listRes.data) {
    console.warn('获取联系人列表失败:', listRes.message)
    return
  }
  const list = listRes.data as ContactList

  if (needUpdateFriends) {
    saveFriendList(accountId, list.friends)
  }
  if (needUpdateGroups) {
    saveGroupList(accountId, list.groups)
  }

  // 最后统一更新时间
  updateLocalTimestamps(accountId, {
    friends_updated_at: remoteTimestamps.friends_updated_at,
    groups_updated_at: remoteTimestamps.groups_updated_at
  })

  console.log('联系人同步完成')
}
