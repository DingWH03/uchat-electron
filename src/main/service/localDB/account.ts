import { getDB } from './db'
import type { Account, ApiResponse } from '@apiType/Model'

export function addOrUpdateAccount(data: Account): ApiResponse<void> {
  const db = getDB()
  try {
    const updateResult = db
      .prepare(
        // 避雷 INSERT OR REPLACE，会导致原记录被删除重建
        `
      UPDATE accounts
      SET username = ?, password = ?, updated_at = ?
      WHERE id = ?
    `
      )
      .run(data.username, data.password, Date.now(), data.id)

    if (updateResult.changes === 0) {
      // 若不存在，则插入新账号
      db.prepare(
        `
        INSERT INTO accounts (id, username, password, updated_at)
        VALUES (?, ?, ?, ?)
      `
      ).run(data.id, data.username, data.password, Date.now())
    }

    return { success: true, data: undefined }
  } catch (error) {
    console.error('localDB Err:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

export function ensureAccountExistsWithoutPassword(accountId: number): ApiResponse<void> {
  const db = getDB()
  try {
    const row = db.prepare(`SELECT 1 FROM accounts WHERE id = ?`).get(accountId)
    if (!row) {
      db.prepare(
        `
        INSERT INTO accounts (id, username, password, updated_at)
        VALUES (?, ?, ?, ?)
      `
      ).run(accountId, '', '', Date.now())
      // console.log(`[ensureAccountExistsWithoutPassword] 插入新账号 id=${accountId}`)
    } else {
      // console.log(`[ensureAccountExistsWithoutPassword] 账号 id=${accountId} 已存在`)
    }
    return { success: true, data: undefined }
  } catch (error) {
    console.error('localDB Err:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

export function getAccounts(): ApiResponse<Account[]> {
  const db = getDB()
  try {
    const rows = db
      .prepare(
        `
      SELECT id, username, password FROM accounts
      ORDER BY updated_at DESC
    `
      )
      .all() as Account[]
    return { success: true, data: rows }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

export function deleteAccount(accountId: number): ApiResponse<void> {
  const db = getDB()
  try {
    db.pragma('foreign_keys = ON')
    db.prepare(`DELETE FROM accounts WHERE id = ?`).run(accountId)
    // console.log(`已删除账号及其关联数据：account_id=${accountId}`)
    return { success: true, data: undefined }
  } catch (error) {
    console.error('localDB Err:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}
