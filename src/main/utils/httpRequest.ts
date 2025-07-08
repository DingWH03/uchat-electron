import { RequestResponse } from '@apiType/HttpRespond'
import { getApiBaseUrl, getSessionId } from '@main/service/config'

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH'
}

interface RequestOptions {
  method?: HttpMethod
  data?: unknown
  query?: Record<string, string | number | boolean | undefined>
  auth?: boolean
  headers?: Record<string, string>
}

export async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<RequestResponse<T>> {
  const { method = HttpMethod.GET, data, query, auth = false, headers = {} } = options

  let url = `${getApiBaseUrl()}${endpoint}`

  // 拼接 query 参数
  if (query && Object.keys(query).length > 0) {
    const queryString = new URLSearchParams(
      Object.entries(query)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)])
    ).toString()
    url += `?${queryString}`
  }

  const isFormData = data instanceof FormData

  const requestHeaders: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }), // 自动处理 multipart
    ...headers
  }

  if (auth) {
    const sessionId = getSessionId()
    requestHeaders['Cookie'] = `session_id=${sessionId}`
  }

  const res = await fetch(url, {
    method,
    headers: requestHeaders,
    body:
      method !== 'GET' && data
        ? isFormData
          ? (data as FormData)
          : JSON.stringify(data)
        : undefined
  })

  const raw = await res.json()
  return RequestResponse.from<T>(raw)
}
