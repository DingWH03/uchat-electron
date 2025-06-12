// main/session.ts
let sessionId: string | null = null

export function setSessionId(id: string | null): void {
  console.log('Set SessionId to ', id)
  sessionId = id
}

export function getSessionId(): string | null {
  // console.log('获取sessionid', sessionId)
  return sessionId
}
