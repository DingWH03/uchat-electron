import { PatchUserRequest, UpdateUserRequest } from '@apiType/HttpRequest'
import { RequestResponse, UserDetailedInfo } from '@apiType/HttpRespond'
import { HttpMethod, request } from '@main/utils/httpRequest'

// 1. 上传头像（multipart/form-data）
export async function upload_avatar(file: File): Promise<RequestResponse<string>> {
  const formData = new FormData()
  formData.append('file', file)

  return request<string>('/user/avatar', {
    method: HttpMethod.POST,
    data: formData,
    auth: true
  })
}

// 2. 获取当前用户个人信息
export async function get_me(): Promise<RequestResponse<UserDetailedInfo>> {
  return request<UserDetailedInfo>('/user/me', {
    method: HttpMethod.GET,
    auth: true
  })
}

// 3. 完整更新个人资料（PUT）
export async function update_me(data: UpdateUserRequest): Promise<RequestResponse<void>> {
  return request<void>('/user/me', {
    method: HttpMethod.PUT,
    data,
    auth: true
  })
}

// 4. 删除自己的账号
export async function delete_me(): Promise<RequestResponse<void>> {
  return request<void>('/user/me', {
    method: HttpMethod.DELETE,
    auth: true
  })
}

// 5. 部分修改个人资料（PATCH）
export async function patch_me(data: PatchUserRequest): Promise<RequestResponse<void>> {
  return request<void>('/user/me', {
    method: HttpMethod.PATCH,
    data,
    auth: true
  })
}
