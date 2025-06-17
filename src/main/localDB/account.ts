import { getDB, persistDB } from './db'
import type { Account, DBResult } from '../../types/localDBModel'

export async function addOrUpdateAccount(data: Account): Promise<DBResult<void>> {
  const db = getDB()

  try {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO accounts (id, username, password, updated_at)
      VALUES (?, ?, ?, ?)
    `)

    stmt.run([data.id, data.username, data.password, Date.now()])
    stmt.free()

    await persistDB()
    return { success: true, data: undefined }
  } catch (error) {
    console.error('localDB Err:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}


export function getAccounts(): Account[] {
  const db = getDB()
  const stmt = db.prepare(`
    SELECT id, username, password FROM accounts
    ORDER BY updated_at DESC
  `)
  const rows: Account[] = []
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as Account)
  }
  stmt.free()
  return rows
}

