// main/api/config.ts

let apiBaseUrl = 'http://ssh.cxhap.top:25597'

export function setApiBaseUrl(newUrl: string): void {
  apiBaseUrl = newUrl
}

export function getApiBaseUrl(): string {
  return apiBaseUrl
}
