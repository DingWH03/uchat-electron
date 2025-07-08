import { GroupRequest, CreateGroupRequest } from '@apiType/HttpRequest'
import {
  GroupDetailedInfo,
  GroupSimpleInfo,
  RequestResponse,
  UserSimpleInfo
} from '@apiType/HttpRespond'
import { ApiResponse } from '@apiType/Model'
import {
  group_info,
  group_members,
  group_new,
  join_group,
  leave_group
} from '@main/service/api/group'
import { group_list } from '@main/service/localDB'
import { ipcMain } from 'electron'

export function registerGroupHandler(): void {
  // 获取本地群组列表
  ipcMain.handle('api:group/list', (): ApiResponse<GroupSimpleInfo[]> => {
    try {
      const data = group_list()
      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  })
  // 获取群聊信息的后端http api
  ipcMain.handle(
    'api:group/info',
    async (_, Data: GroupRequest): Promise<RequestResponse<GroupDetailedInfo>> => {
      return group_info(Data)
    }
  )
  // 获取群组成员的后端http api
  ipcMain.handle(
    'api:group/members',
    async (_, Data: GroupRequest): Promise<RequestResponse<UserSimpleInfo[]>> => {
      return group_members(Data)
    }
  )
  // 创建群聊的后端http api
  ipcMain.handle(
    'api:group/new',
    async (_, Data: CreateGroupRequest): Promise<RequestResponse<number>> => {
      return group_new(Data)
    }
  )
  // 加入群聊的后端http api
  ipcMain.handle(
    'api:group/join',
    async (_, Data: GroupRequest): Promise<RequestResponse<void>> => {
      return join_group(Data)
    }
  )
  // 退出群聊的后端http api
  ipcMain.handle(
    'api:group/leave',
    async (_, Data: GroupRequest): Promise<RequestResponse<void>> => {
      return leave_group(Data)
    }
  )
}
