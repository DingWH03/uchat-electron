import { ipcMain } from 'electron'
import { chatInfo } from '../../types/Model'

// 记录正在聊天的会话ID
let currentChatId: number | null = null
// 设置群聊还是私聊的会话ID
let currentChatType: 'group' | 'user' | null = null
export function setChatId(chatInfo: chatInfo): void {
  currentChatId = chatInfo.id
  currentChatType = chatInfo.type
}
export function getChatId(): chatInfo {
  return {
    id: currentChatId,
    type: currentChatType
  } as chatInfo
}

export function BaseUrlApi(): void {
  ipcMain.handle('config:setChatId', (_, info: chatInfo) => {
    setChatId(info)
    return true
  })
  ipcMain.handle('config:getChatId', (): chatInfo => {
    return getChatId()
  })
}
