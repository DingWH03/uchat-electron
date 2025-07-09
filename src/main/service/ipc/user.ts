import { UpdateUserRequest, PatchUserRequest } from '@apiType/HttpRequest'
import { UserDetailedInfo } from '@apiType/HttpRespond'
import { ApiResponse } from '@apiType/Model'
import { ipcMain } from 'electron'
import { upload_avatar, get_me, update_me, patch_me, delete_me } from '../api/user'

export function registerUserHandler(): void {
  // 上传头像（file: {name, type, buffer}）
  ipcMain.handle(
    'api:user/upload-avatar',
    async (
      _,
      file: { name: string; type: string; buffer: number[] }
    ): Promise<ApiResponse<string>> => {
      // 还原 Buffer
      const buffer = Buffer.from(file.buffer)
      // 构造一个类似 File 的对象传递给 upload_avatar
      const fakeFile: { name: string; type: string; arrayBuffer: () => Promise<Buffer> } = {
        name: file.name,
        type: file.type,
        arrayBuffer: async () => buffer
      }
      return (await upload_avatar(fakeFile)).toApiResponse()
    }
  )

  // 获取当前用户信息
  ipcMain.handle('api:user/get-me', async (): Promise<ApiResponse<UserDetailedInfo>> => {
    return (await get_me()).toApiResponse()
  })

  // 完整更新用户资料
  ipcMain.handle(
    'api:user/update-me',
    async (_, data: UpdateUserRequest): Promise<ApiResponse<void>> => {
      return (await update_me(data)).toApiResponse()
    }
  )

  // 部分更新用户资料
  ipcMain.handle(
    'api:user/patch-me',
    async (_, data: PatchUserRequest): Promise<ApiResponse<void>> => {
      return (await patch_me(data)).toApiResponse()
    }
  )

  // 删除当前账号
  ipcMain.handle('api:user/delete-me', async (): Promise<ApiResponse<void>> => {
    return (await delete_me()).toApiResponse()
  })
}
