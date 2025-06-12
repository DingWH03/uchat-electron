// main/api/anthentication.ts
import { BrowserWindow, ipcMain } from 'electron'
import { getApiBaseUrl } from './config'
import { getSessionId, setSessionId } from '../session'
import { RegisterRequest, LoginRequest, PasswordRequest } from '../../types/HttpRequest'
import { closeWebSocket, setupWebSocket } from '../WebSocket/wsClient'
import { ServerResponse } from '../../types/HttpRespond'

export function registerAnthenticationApi(win: BrowserWindow): void {
  // 注册账号的后端接口调用
  ipcMain.handle(
    'api:auth/register',
    async (_, registerData: RegisterRequest): Promise<ServerResponse> => {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData)
      })
      return res.json()
    }
  )
  // 登陆的后端接口调用
  ipcMain.handle('api:auth/login', async (_, loginData: LoginRequest): Promise<boolean> => {
    const baseUrl = getApiBaseUrl()
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData)
    })
    const data = await res.json()
    if (data.status) {
      setSessionId(data.message)
      setupWebSocket(win)
    }
    return data.status
  })
  // 注销的后端接口调用
  ipcMain.handle('api:auth/logout', async (): Promise<ServerResponse> => {
    closeWebSocket() // 彻底关闭websocket连接
    const baseUrl = getApiBaseUrl()
    const sessionId = getSessionId()
    // console.log('注销时sessionid为', sessionId)
    const res = await fetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
      headers: {
        Cookie: `session_id=${sessionId}`
      }
    })
    setSessionId(null)
    return res.json()
  })
  // 修改密码的后端接口调用
  ipcMain.handle(
    'api:auth/password',
    async (_, requestData: PasswordRequest): Promise<ServerResponse> => {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/auth/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })
      return res.json()
    }
  )
}
