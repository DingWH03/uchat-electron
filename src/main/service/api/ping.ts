// main/api/ping.ts
import { HttpMethod, request } from '@main/utils/httpRequest'
import { RequestResponse } from '@apiType/HttpRespond'

export async function ping(): Promise<RequestResponse<void>> {
  return request<void>('/ping', {
    method: HttpMethod.GET,
    auth: false
  })
}
