import { PatchUserRequest, UpdateUserRequest } from '@apiType/HttpRequest'
import { RequestResponse, UserDetailedInfo } from '@apiType/HttpRespond'
import { HttpMethod, request } from '@main/utils/httpRequest'

// 1. 上传头像（multipart/form-data）
export async function upload_avatar(file: {
  name: string
  type: string
  arrayBuffer: () => Promise<Buffer>
}): Promise<RequestResponse<string>> {
  const formData = new FormData()
  // 手动构造 Blob 并设置 MIME 类型
  const buffer = await file.arrayBuffer()
  const blob = new Blob([buffer], { type: file.type })
  // 用 filename + blob 设置字段，会强制生成正确 Content-Type
  formData.append('file', blob, file.name)
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
