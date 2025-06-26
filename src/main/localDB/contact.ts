import {
  GroupSimpleInfo,
  UpdateTimestamps,
  UserSimpleInfo,
  UserSimpleInfoWithStatus
} from '../../types/HttpRespond'
import { myID } from '../api/anthentication'
import { getDB } from './db'
import { UserStatus } from '../../types/Model'

export function dumpAccountsTable(): void {
  const db = getDB()
  const rows = db.prepare('SELECT * FROM accounts').all()
  console.log('accounts 表当前内容:')
  for (const row of rows) {
    console.log(row)
  }
}

export function getLocalUpdateTimestamps(accountId: number): UpdateTimestamps {
  const db = getDB()
  const row = db
    .prepare(
      `
    SELECT friends_updated_at, groups_updated_at FROM accounts WHERE id = ?
  `
    )
    .get(accountId)
  let result: UpdateTimestamps = {
    friends_updated_at: 0,
    groups_updated_at: 0
  }
  if (row) {
    result = {
      friends_updated_at: Number(row.friends_updated_at ?? 0),
      groups_updated_at: Number(row.groups_updated_at ?? 0)
    }
    console.log('[getLocalUpdateTimestamps] 读取结果:', row)
  } else {
    console.warn(`[getLocalUpdateTimestamps] 没找到 id=${accountId} 的记录`)
  }
  return result
}

export function updateLocalTimestamps(
  accountId: number,
  updated: { friends_updated_at: number; groups_updated_at: number }
): void {
  const db = getDB()
  db.prepare(
    `
    UPDATE accounts
    SET friends_updated_at = ?, groups_updated_at = ?
    WHERE id = ?
  `
  ).run(updated.friends_updated_at, updated.groups_updated_at, accountId)
}

export function saveFriendList(accountId: number, friends: UserSimpleInfo[]): void {
  const db = getDB()

  // 先获取现有的好友状态信息
  const existingFriends = db
    .prepare(
      `
    SELECT user_id, online, last_online_time FROM friends WHERE account_id = ?
  `
    )
    .all(accountId)

  const statusMap = new Map<number, { online: number; lastOnlineTime: number }>()
  for (const friend of existingFriends) {
    statusMap.set(friend.user_id, {
      online: friend.online,
      lastOnlineTime: friend.last_online_time
    })
  }

  const deleteStmt = db.prepare(`DELETE FROM friends WHERE account_id = ?`)
  const insertStmt = db.prepare(`
    INSERT INTO friends (account_id, user_id, username, avatar, online, last_online_time)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const saveFriends = db.transaction((list: UserSimpleInfo[]) => {
    deleteStmt.run(accountId)
    for (const friend of list) {
      const existingStatus = statusMap.get(friend.user_id)
      const online = existingStatus ? existingStatus.online : 0
      const lastOnlineTime = existingStatus ? existingStatus.lastOnlineTime : null

      insertStmt.run(
        accountId,
        friend.user_id,
        friend.username ?? '',
        friend.avatar_url ?? '',
        online,
        lastOnlineTime
      )
    }
  })

  saveFriends(friends)
  console.log(`[saveFriendList] 保存了 ${friends.length} 个好友到账户 ${accountId}`)
}

export function saveGroupList(accountId: number, groups: GroupSimpleInfo[]): void {
  const db = getDB()
  const deleteStmt = db.prepare(`DELETE FROM groups WHERE account_id = ?`)
  const insertStmt = db.prepare(`
    INSERT INTO groups (account_id, group_id, name, description, avatar)
    VALUES (?, ?, ?, ?, ?)
  `)

  const saveGroups = db.transaction((list: GroupSimpleInfo[]) => {
    deleteStmt.run(accountId)
    for (const group of list) {
      insertStmt.run(
        accountId,
        group.group_id,
        group.title ?? '',
        group.description ?? '',
        group.avatar_url ?? ''
      )
    }
  })

  saveGroups(groups)
  console.log(`[saveGroupList] 保存了 ${groups.length} 个群组到账户 ${accountId}`)
}

export function friend_list(): UserSimpleInfoWithStatus[] {
  const db = getDB()
  const accountId = myID()
  const rows = db
    .prepare(
      `
    SELECT user_id, username, avatar, online FROM friends
    WHERE account_id = ?
    ORDER BY username
  `
    )
    .all(accountId)
  return rows.map((row) => ({
    base: {
      user_id: row.user_id,
      username: row.username,
      avatar_url: row.avatar
    },
    online: Boolean(row.online)
  }))
}

export function group_list(): GroupSimpleInfo[] {
  const db = getDB()
  const accountId = myID()
  const rows = db
    .prepare(
      `
    SELECT group_id, name, description, avatar FROM groups
    WHERE account_id = ?
    ORDER BY name
  `
    )
    .all(accountId)
  return rows.map((row) => ({
    group_id: row.group_id,
    title: row.name,
    description: row.description,
    avatar_url: row.avatar
  }))
}

// 好友状态管理函数
export function updateFriendStatus(accountId: number, userId: number, online: boolean): void {
  const db = getDB()
  const currentTime = Date.now()

  db.prepare(
    `
    UPDATE friends 
    SET online = ?, last_online_time = ?
    WHERE account_id = ? AND user_id = ?
  `
  ).run(online ? 1 : 0, currentTime, accountId, userId)

  console.log(`[updateFriendStatus] 更新好友 ${userId} 状态为 ${online ? '在线' : '离线'}`)
}

export function updateFriendsStatus(accountId: number, userStatuses: UserStatus[]): void {
  const db = getDB()
  const currentTime = Date.now()

  const updateStmt = db.prepare(`
    UPDATE friends 
    SET online = ?, last_online_time = ?
    WHERE account_id = ? AND user_id = ?
  `)

  const updateStatuses = db.transaction((statuses: UserStatus[]) => {
    for (const status of statuses) {
      updateStmt.run(status.online ? 1 : 0, currentTime, accountId, status.user_id)
    }
  })

  updateStatuses(userStatuses)
  console.log(`[updateFriendsStatus] 批量更新了 ${userStatuses.length} 个好友的状态`)
}

export function getFriendStatus(
  accountId: number,
  userId: number
): { online: boolean; lastOnlineTime: number } | null {
  const db = getDB()
  const row = db
    .prepare(
      `
    SELECT online, last_online_time FROM friends
    WHERE account_id = ? AND user_id = ?
  `
    )
    .get(accountId, userId)

  if (row) {
    return {
      online: Boolean(row.online),
      lastOnlineTime: Number(row.last_online_time || 0)
    }
  }
  return null
}

export function getAllFriendIds(accountId: number): number[] {
  const db = getDB()
  const rows = db
    .prepare(
      `
    SELECT user_id FROM friends WHERE account_id = ?
  `
    )
    .all(accountId)

  return rows.map((row) => row.user_id)
}

export function getFriendsWithStatus(
  accountId: number
): Array<UserSimpleInfo & { online: boolean; lastOnlineTime: number }> {
  const db = getDB()
  const rows = db
    .prepare(
      `
    SELECT user_id, username, avatar, online, last_online_time 
    FROM friends 
    WHERE account_id = ?
    ORDER BY username
  `
    )
    .all(accountId)

  return rows.map((row) => ({
    user_id: row.user_id,
    username: row.username,
    avatar_url: row.avatar,
    online: Boolean(row.online),
    lastOnlineTime: Number(row.last_online_time || 0)
  }))
}

// 获取所有好友的last_message_timestamp
export function getAllFriendsLastMessageTimestamps(accountId: number): Record<number, number> {
  const db = getDB()
  const rows = db.prepare('SELECT user_id, last_message_timestamp FROM friends WHERE account_id = ?').all(accountId)
  const result: Record<number, number> = {}
  for (const row of rows) {
    result[row.user_id] = Number(row.last_message_timestamp ?? 0)
  }
  return result
}

// 获取所有群的last_message_timestamp
export function getAllGroupsLastMessageTimestamps(accountId: number): Record<number, number> {
  const db = getDB()
  const rows = db.prepare('SELECT group_id, last_message_timestamp FROM groups WHERE account_id = ?').all(accountId)
  const result: Record<number, number> = {}
  for (const row of rows) {
    result[row.group_id] = Number(row.last_message_timestamp ?? 0)
  }
  return result
}

// 更新单个好友的last_message_timestamp
export function updateFriendLastMessageTimestamp(accountId: number, userId: number, timestamp: number): void {
  const db = getDB()
  console.log(`[updateFriendLastMessageTimestamp] 更新好友 ${userId} 的时间戳: ${timestamp} (${new Date(timestamp).toLocaleString()})`)
  const result = db.prepare('UPDATE friends SET last_message_timestamp = ? WHERE account_id = ? AND user_id = ?')
    .run(timestamp, accountId, userId)
  console.log(`[updateFriendLastMessageTimestamp] 更新结果: ${result.changes} 行受影响`)
}

// 更新单个群的last_message_timestamp
export function updateGroupLastMessageTimestamp(accountId: number, groupId: number, timestamp: number): void {
  const db = getDB()
  console.log(`[updateGroupLastMessageTimestamp] 更新群 ${groupId} 的时间戳: ${timestamp} (${new Date(timestamp).toLocaleString()})`)
  const result = db.prepare('UPDATE groups SET last_message_timestamp = ? WHERE account_id = ? AND group_id = ?')
    .run(timestamp, accountId, groupId)
  console.log(`[updateGroupLastMessageTimestamp] 更新结果: ${result.changes} 行受影响`)
}

// 批量更新好友的last_message_timestamp
export function batchUpdateFriendsLastMessageTimestamp(accountId: number, data: Record<number, number>): void {
  const db = getDB()
  const stmt = db.prepare('UPDATE friends SET last_message_timestamp = ? WHERE account_id = ? AND user_id = ?')
  const update = db.transaction((map: Record<number, number>) => {
    for (const userId in map) {
      stmt.run(map[userId], accountId, Number(userId))
    }
  })
  update(data)
}

// 批量更新群的last_message_timestamp
export function batchUpdateGroupsLastMessageTimestamp(accountId: number, data: Record<number, number>): void {
  const db = getDB()
  const stmt = db.prepare('UPDATE groups SET last_message_timestamp = ? WHERE account_id = ? AND group_id = ?')
  const update = db.transaction((map: Record<number, number>) => {
    for (const groupId in map) {
      stmt.run(map[groupId], accountId, Number(groupId))
    }
  })
  update(data)
}
