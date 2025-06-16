// utils/notification.ts

export function showNotification(title: string, body?: string, icon?: string): void {
  // 检查浏览器是否支持通知
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop notification')
    return
  }

  // 请求通知权限（如果还没有请求过）
  if (Notification.permission === 'default') {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        createNotification(title, body, icon)
      }
    })
  } else if (Notification.permission === 'granted') {
    createNotification(title, body, icon)
  } else {
    console.warn('Notification permission denied.')
  }

  function createNotification(title: string, body?: string, icon?: string): void {
    new Notification(title, {
      body,
      icon
    })
  }
}
