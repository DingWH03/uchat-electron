import { FriendRequest } from '@apiType/HttpRequest'
import { UserDetailedInfo, UserSimpleInfo, UserSimpleInfoWithStatus } from '@apiType/HttpRespond'
import { ApiResponse } from '@apiType/Model'
import { add_friend, friend_list_v2, friend_info } from '@main/service/api/friend'
import { getMyID } from '@main/service/config/myID'
import { friend_list, getFriendsWithStatus, getFriendStatus } from '@main/service/localDB'
import { ipcMain } from 'electron'

export function registerFriendHandler(): void {
  // 获取本地好友列表
  ipcMain.handle('api:friend/list', (): ApiResponse<UserSimpleInfoWithStatus[]> => {
    try {
      const data = friend_list()
      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  })

  // 获取所有好友及其状态
  ipcMain.handle(
    'api:friends/with-status',
    async (): Promise<
      ApiResponse<Array<UserSimpleInfo & { online: boolean; lastOnlineTime: number }>>
    > => {
      const accountId = getMyID()
      if (!accountId) {
        return {
          success: false,
          error: 'Account ID not found'
        }
      }
      return {
        success: true,
        data: getFriendsWithStatus(accountId)
      }
    }
  )

  // 获取指定好友的状态
  ipcMain.handle(
    'api:friend/status',
    async (
      _,
      userId: number
    ): Promise<ApiResponse<{ online: boolean; lastOnlineTime: number } | null>> => {
      const accountId = getMyID()
      if (!accountId) {
        return {
          success: false,
          error: 'Account ID not found'
        }
      }
      return {
        success: true,
        data: getFriendStatus(accountId, userId)
      }
    }
  )
  // 添加好友的后端http api
  ipcMain.handle('api:friend/add', async (_, Data: FriendRequest): Promise<ApiResponse<void>> => {
    return (await add_friend(Data)).toApiResponse()
  })
  // 获取好友列表的后端http apiv2
  ipcMain.handle(
    'api:friend/listv2',
    async (): Promise<ApiResponse<UserSimpleInfoWithStatus[]>> => {
      return (await friend_list_v2()).toApiResponse()
    }
  )
  // 获取好友详细信息的后端http api
  ipcMain.handle(
    'api:friend/info',
    async (_, Data: FriendRequest): Promise<ApiResponse<UserDetailedInfo>> => {
      return (await friend_info(Data)).toApiResponse()
    }
  )
}
