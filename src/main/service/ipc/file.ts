import { ipcMain } from 'electron'
import { cacheRemoteFile, getCachedFilePath } from '../file'
import { ApiResponse } from '@apiType/Model'

export function registerFileHandler(): void {
  // 注册 IPC handler
  ipcMain.handle(
    'api:file/get-local-file',
    async (_event, url: string, folder?: string): Promise<ApiResponse<string>> => {
      try {
        const localUrl = await cacheRemoteFile(url, folder)
        return {
          success: true,
          data: localUrl
        }
      } catch (e) {
        console.error('下载文件失败:', e)
        return {
          success: false,
          error: e instanceof Error ? e.message : String(e)
        }
      }
    }
  )

  // 获取文件的安全 URL
  ipcMain.handle(
    'api:file/get-secure-url',
    async (_event, appUrl: string): Promise<ApiResponse<string>> => {
      try {
        const filePath = getCachedFilePath(appUrl)
        if (!filePath) {
          return {
            success: false,
            error: 'File not found in cache'
          }
        }
        return {
          success: true,
          data: appUrl
        }
      } catch (e) {
        console.error('获取安全URL失败:', e)
        return {
          success: false,
          error: e instanceof Error ? e.message : String(e)
        }
      }
    }
  )
}
