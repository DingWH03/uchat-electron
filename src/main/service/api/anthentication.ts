// main/api/anthentication.ts
import { RegisterRequest, LoginRequest, PasswordRequest } from '@apiType/HttpRequest'
import { RequestResponse } from '@apiType/HttpRespond'
import { HttpMethod, request } from '@main/utils/httpRequest'

export async function performLogout(): Promise<RequestResponse<void>> {
  return request<void>('/auth/logout', {
    method: HttpMethod.POST,
    auth: true
  })
}

export async function performRegister(
  registerData: RegisterRequest
): Promise<RequestResponse<number>> {
  return request<number>('/auth/register', {
    method: HttpMethod.POST,
    data: registerData
  })
}

export async function performLogin(loginData: LoginRequest): Promise<RequestResponse<string>> {
  return request<string>('/auth/login', {
    method: HttpMethod.POST,
    data: loginData
  })
}

export async function performPassword(
  requestData: PasswordRequest
): Promise<RequestResponse<void>> {
  return request<void>('/auth/password', {
    method: HttpMethod.POST,
    data: requestData
  })
}
