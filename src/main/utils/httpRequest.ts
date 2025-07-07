import { RequestResponse } from '@apiType/HttpRespond'
import { getApiBaseUrl } from '@main/service/config'
import { getSessionId } from '@main/service/config'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

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
  const { method = 'GET', data, query, auth = false, headers = {} } = options

  let url = `${getApiBaseUrl()}${endpoint}`

  // 拼接 query 参数
  if (query && Object.keys(query).length > 0) {
    const queryString = new URLSearchParams(
      Object.entries(query)
        .filter(([, value]) => value !== undefined) // 忽略 undefined
        .map(([key, value]) => [key, String(value)])
    ).toString()
    url += `?${queryString}`
  }

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers
  }

  if (auth) {
    const sessionId = getSessionId()
    requestHeaders['Cookie'] = `session_id=${sessionId}`
  }

  const res = await fetch(url, {
    method,
    headers: requestHeaders,
    body: method !== 'GET' && data ? JSON.stringify(data) : undefined
  })

  return res.json()
}
