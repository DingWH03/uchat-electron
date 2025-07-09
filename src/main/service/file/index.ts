import { app, protocol } from 'electron'
import path from 'path'
import fs from 'fs/promises'
import { createReadStream } from 'fs'

// 文件缓存映射
const fileCache = new Map<string, string>()

export async function cacheRemoteFile(url: string, subFolder = 'files'): Promise<string> {
  const fileName = path.basename(new URL(url).pathname)
  const saveDir = path.join(app.getPath('userData'), subFolder)
  const filePath = path.join(saveDir, fileName)

  try {
    // 如果本地已有文件，直接返回
    await fs.access(filePath)
    const appUrl = `app://files/${fileName}`
    fileCache.set(appUrl, filePath)
    return appUrl
  } catch {
    // 否则 fetch 下载
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Failed to download file: ${res.statusText}`)
    const arrayBuffer = await res.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    await fs.mkdir(saveDir, { recursive: true })
    await fs.writeFile(filePath, buffer)

    const appUrl = `app://files/${fileName}`
    fileCache.set(appUrl, filePath)
    return appUrl
  }
}

// 注册自定义协议
export function registerCustomProtocol(): void {
  protocol.handle('app', async (request) => {
    const filePath = fileCache.get(request.url)

    if (!filePath) {
      return new Response('File not found', { status: 404 })
    }

    try {
      // 检查文件是否存在
      await fs.access(filePath)

      // 获取文件信息
      const stats = await fs.stat(filePath)

      // 创建文件流
      const fileStream = createReadStream(filePath)

      // 根据文件扩展名设置正确的 MIME 类型
      const ext = path.extname(filePath).toLowerCase()
      const mimeTypes: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.pdf': 'application/pdf',
        '.txt': 'text/plain',
        '.json': 'application/json',
        '.mp3': 'audio/mpeg',
        '.mp4': 'video/mp4',
        '.webm': 'video/webm'
      }

      const contentType = mimeTypes[ext] || 'application/octet-stream'

      // 创建响应
      const response = new Response(fileStream as any, {
        headers: {
          'Content-Type': contentType,
          'Content-Length': stats.size.toString(),
          'Cache-Control': 'public, max-age=31536000' // 缓存1年
        }
      })

      return response
    } catch (error) {
      console.error('Error serving file:', error)
      return new Response('Internal Server Error', { status: 500 })
    }
  })
}

// 清理文件缓存
export function clearFileCache(): void {
  fileCache.clear()
}

// 获取缓存的文件路径
export function getCachedFilePath(appUrl: string): string | undefined {
  return fileCache.get(appUrl)
}
