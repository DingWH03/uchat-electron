import { getDB, persistDB } from './db'
import type { Account, DBResult } from '../../types/localDBModel'

export async function addOrUpdateAccount(
  id: number,
  username: string,
  password: string
): Promise<DBResult<void>> {
  try {
    const db = getDB()

    const checkStmt = db.prepare(`SELECT 1 FROM accounts WHERE id = ? LIMIT 1`)
    const exists = checkStmt.get([id]) !== null
    checkStmt.free()

    if (exists) {
      const updateStmt = db.prepare(`UPDATE accounts SET username = ?, password = ? WHERE id = ?`)
      updateStmt.run([username, password, id])
      updateStmt.free()
    } else {
      const insertStmt = db.prepare(
        `INSERT INTO accounts (id, username, password) VALUES (?, ?, ?)`
      )
      insertStmt.run([id, username, password])
      insertStmt.free()
    }

    await persistDB()

    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

export function getAccounts(): Account[] {
  const db = getDB()
  const stmt = db.prepare(`SELECT id, username, password FROM accounts`)
  const rows: Account[] = []
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as Account)
  }
  stmt.free()
  return rows
}
