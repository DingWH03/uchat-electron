import { GroupSimpleInfo, UpdateTimestamps, UserSimpleInfo } from '../../types/HttpRespond'
import { myID } from '../api/anthentication'
import { getDB } from './db'

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
  const deleteStmt = db.prepare(`DELETE FROM friends WHERE account_id = ?`)
  const insertStmt = db.prepare(`
    INSERT INTO friends (account_id, user_id, username, avatar)
    VALUES (?, ?, ?, ?)
  `)
  
  const saveFriends = db.transaction((list: UserSimpleInfo[]) => {
    deleteStmt.run(accountId)
    for (const friend of list) {
      insertStmt.run(accountId, friend.user_id, friend.username ?? '', friend.avatar_url ?? '')
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

export function friend_list(): UserSimpleInfo[] {
  const db = getDB()
  const accountId = myID()
  const rows = db
    .prepare(
      `
    SELECT user_id, username, avatar FROM friends
    WHERE account_id = ?
    ORDER BY username
  `
    )
    .all(accountId)
  return rows.map((row) => ({
    user_id: row.user_id,
    username: row.username,
    avatar_url: row.avatar
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
