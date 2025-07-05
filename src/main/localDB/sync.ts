import { contact_list, contact_timestamps } from '../api/contact'
import {
  getLocalUpdateTimestamps,
  saveFriendList,
  saveGroupList,
  updateLocalTimestamps,
  getAllFriendsLastMessageTimestamps,
  getAllGroupsLastMessageTimestamps,
  updateFriendLastMessageTimestamp,
  updateGroupLastMessageTimestamp
} from './contact'
import { ContactList, UpdateTimestamps } from '../../types/HttpRespond'
import { myID } from '../api/anthentication'
import { ensureAccountExistsWithoutPassword } from './account'
import { saveMessageToDB } from './db'
import {
  getLatestTimestampsOfAllGroups,
  getLatestTimestampsOfAllPrivateChats,
  getGroupMessagesAfterTimestamp,
  getPrivateMessagesAfterTimestamp
} from '../api/message'
import type { SessionMessage } from '../../types/HttpRespond'

export async function syncContacts(): Promise<void> {
  const accountId = myID()
  console.log('[syncContacts] 开始同步联系人，获取到的 accountId:', accountId)
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

/**
 * 聊天记录同步：每次建立WebSocket前调用
 * 步骤：
 * 1. 读取本地所有好友/群的last_message_timestamp
 * 2. 获取服务器所有会话的最新时间戳
 * 3. 对比后拉取增量消息，保存到本地并更新本地last_message_timestamp
 */
export async function syncAllMessagesBeforeWS(): Promise<void> {
  const accountId = myID()
  console.log('[Sync] 开始同步消息，accountId:', accountId)
  console.log('[Sync] 调用 myID() 的详细日志:')
  console.log('[Sync] - loginUser 变量值:', accountId)
  console.log('[Sync] - 是否为 0:', accountId === 0)
  
  if (accountId === 0) {
    console.error('[Sync] 错误：accountId 为 0，无法进行消息同步')
    return
  }
  
  // 1. 本地所有好友/群的last_message_timestamp
  const localFriendTs = getAllFriendsLastMessageTimestamps(accountId)
  const localGroupTs = getAllGroupsLastMessageTimestamps(accountId)
  console.log('[Sync] 本地时间戳 - 好友:', localFriendTs, '群聊:', localGroupTs)

  // 2. 服务器所有会话的最新时间戳
  console.log('[Sync] 开始获取服务器时间戳...')
  let serverGroupRes, serverFriendRes
  try {
    [serverGroupRes, serverFriendRes] = await Promise.all([
      getLatestTimestampsOfAllGroups(),
      getLatestTimestampsOfAllPrivateChats()
    ])
    console.log('[Sync] 服务器响应 - 群聊:', serverGroupRes, '私聊:', serverFriendRes)
  } catch (error) {
    console.error('[Sync] 获取服务器时间戳失败:', error)
    return
  }
  
  if (!serverGroupRes.status || !serverGroupRes.data || !serverFriendRes.status || !serverFriendRes.data) {
    console.warn('[Sync] 服务器时间戳响应无效:', { 
      groupStatus: serverGroupRes?.status, 
      groupData: serverGroupRes?.data,
      friendStatus: serverFriendRes?.status, 
      friendData: serverFriendRes?.data 
    })
    return
  }
  
  const serverGroupTs = serverGroupRes.data as Record<number, number>
  const serverFriendTs = serverFriendRes.data as Record<number, number>
  console.log('[Sync] 服务器时间戳 - 群聊:', serverGroupTs, '私聊:', serverFriendTs)

  // 3. 群聊增量同步
  console.log('[Sync] 开始群聊同步...')
  for (const groupIdStr in serverGroupTs) {
    const groupId = Number(groupIdStr)
    const serverTs = serverGroupTs[groupId]
    const localTs = localGroupTs[groupId] || 0
    console.log(`[Sync] 群聊 ${groupId}: 服务器=${serverTs}, 本地=${localTs}`)
    
    if (serverTs > localTs) {
      console.log(`[Sync] 群聊 ${groupId} 需要同步，拉取增量消息...`)
      try {
        const res = await getGroupMessagesAfterTimestamp({ id: groupId, after: localTs })
        console.log(`[Sync] 群聊 ${groupId} 增量消息响应:`, res)
        
        if (res.status && res.data) {
          console.log(`[Sync] 群聊 ${groupId} 保存 ${res.data.length} 条消息到本地`)
          for (const msg of res.data as SessionMessage[]) {
            const saveResult = saveMessageToDB({
              account_id: accountId,
              message_id: msg.message_id,
              sender_id: msg.sender_id,
              receiver_id: null,
              group_id: groupId,
              message_type: msg.message_type || 'text',
              content: msg.message,
              timestamp: msg.timestamp
            })
            if (!saveResult) {
              console.error(`[Sync] 群聊 ${groupId} 消息保存失败:`, msg)
            }
          }
          // 更新本地last_message_timestamp
          updateGroupLastMessageTimestamp(accountId, groupId, serverTs)
          console.log(`[Sync] 群聊 ${groupId} 同步完成`)
        } else {
          console.warn(`[Sync] 群聊 ${groupId} 获取增量消息失败:`, res)
        }
      } catch (error) {
        console.error(`[Sync] 群聊 ${groupId} 同步异常:`, error)
      }
    }
  }
  
  // 4. 私聊增量同步
  console.log('[Sync] 开始私聊同步...')
  for (const userIdStr in serverFriendTs) {
    const userId = Number(userIdStr)
    const serverTs = serverFriendTs[userId]
    const localTs = localFriendTs[userId] || 0
    console.log(`[Sync] 私聊 ${userId}: 服务器=${serverTs}, 本地=${localTs}`)
    console.log(`[Sync] 私聊 ${userId}: 时间差=${serverTs - localTs}ms`)
    console.log(`[Sync] 私聊 ${userId}: 服务器时间=${new Date(serverTs).toLocaleString()}, 本地时间=${new Date(localTs).toLocaleString()}`)
    
    if (serverTs > localTs) {
      console.log(`[Sync] 私聊 ${userId} 需要同步，拉取增量消息...`)
      try {
        const res = await getPrivateMessagesAfterTimestamp({ id: userId, after: localTs })
        console.log(`[Sync] 私聊 ${userId} 增量消息响应:`, res)
        
        if (res.status && res.data) {
          console.log(`[Sync] 私聊 ${userId} 保存 ${res.data.length} 条消息到本地`)
          console.log(accountId)
          for (const msg of res.data as SessionMessage[]) {
            console.log(`[Sync] 私聊 ${userId} 处理消息:`, {
              sender_id: msg.sender_id,
              content: msg.message,
              timestamp: msg.timestamp,
              timestamp_time: new Date(msg.timestamp).toLocaleString()
            })
            const saveResult = saveMessageToDB({
              account_id: accountId,
              message_id: msg.message_id,
              sender_id: msg.sender_id,
              receiver_id: msg.sender_id === accountId ? userId : accountId,
              group_id: null,
              message_type: msg.message_type || 'text',
              content: msg.message,
              timestamp: msg.timestamp
            })
            if (!saveResult) {
              console.error(`[Sync] 私聊 ${userId} 消息保存失败:`, msg)
            }
          }
          // 更新本地last_message_timestamp
          updateFriendLastMessageTimestamp(accountId, userId, serverTs)
          console.log(`[Sync] 私聊 ${userId} 同步完成，更新时间戳为: ${serverTs}`)
        } else {
          console.warn(`[Sync] 私聊 ${userId} 获取增量消息失败:`, res)
        }
      } catch (error) {
        console.error(`[Sync] 私聊 ${userId} 同步异常:`, error)
      }
    } else {
      console.log(`[Sync] 私聊 ${userId} 无需同步，本地时间戳已是最新`)
    }
  }
  console.log('[Sync] 聊天记录同步完成')
}
