// utils/notification.ts

// 通知类型枚举
export enum NotificationType {
  MESSAGE = 'message',
  SYSTEM = 'system',
  ERROR = 'error',
  SUCCESS = 'success'
}

// 通知配置接口
export interface NotificationConfig {
  title: string
  body?: string
  icon?: string
  type?: NotificationType
  silent?: boolean
}

// 消息通知数据接口
export interface MessageNotificationData {
  senderId: number
  senderName: string
  message: string
  chatType: 'private' | 'group'
  groupName?: string
}

class NotificationManager {
  private currentUserId: number = 0
  private isEnabled: boolean = true
  private showOwnMessages: boolean = false
  private showSystemNotifications: boolean = true

  /**
   * 设置当前用户ID
   */
  setCurrentUserId(userId: number): void {
    this.currentUserId = userId
    console.log('[NotificationManager] 设置当前用户ID:', userId)
  }

  /**
   * 获取当前用户ID
   */
  getCurrentUserId(): number {
    return this.currentUserId
  }

  /**
   * 启用/禁用通知
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
    console.log('[NotificationManager] 通知功能:', enabled ? '已启用' : '已禁用')
  }

  /**
   * 检查通知是否启用
   */
  isNotificationEnabled(): boolean {
    return this.isEnabled
  }

  /**
   * 检查是否为当前用户发送的消息
   */
  isOwnMessage(senderId: number): boolean {
    return senderId === this.currentUserId
  }

  /**
   * 设置是否显示自己发送的消息通知
   */
  setShowOwnMessages(show: boolean): void {
    this.showOwnMessages = show
    console.log('[NotificationManager] 显示自己消息通知:', show)
  }

  /**
   * 设置是否显示系统通知
   */
  setShowSystemNotifications(show: boolean): void {
    this.showSystemNotifications = show
    console.log('[NotificationManager] 显示系统通知:', show)
  }

  /**
   * 从本地存储加载设置
   */
  loadSettings(): void {
    try {
      const settings = localStorage.getItem('notificationSettings')
      if (settings) {
        const parsed = JSON.parse(settings)
        this.isEnabled = parsed.isEnabled ?? true
        this.showOwnMessages = parsed.showOwnMessages ?? false
        this.showSystemNotifications = parsed.showSystemNotifications ?? true
        console.log('[NotificationManager] 从本地存储加载设置:', parsed)
      }
    } catch (error) {
      console.error('[NotificationManager] 加载设置失败:', error)
    }
  }

  /**
   * 显示基础通知
   */
  showNotification(config: NotificationConfig): void {
    if (!this.isEnabled) {
      console.log('[NotificationManager] 通知功能已禁用，跳过显示')
      return
    }

    // 检查浏览器是否支持通知
    if (!('Notification' in window)) {
      console.warn('[NotificationManager] 此浏览器不支持桌面通知')
      return
    }

    // 请求通知权限（如果还没有请求过）
    if (Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          this.createNotification(config)
        }
      })
    } else if (Notification.permission === 'granted') {
      this.createNotification(config)
    } else {
      console.warn('[NotificationManager] 通知权限被拒绝')
    }
  }

  /**
   * 创建通知实例
   */
  private createNotification(config: NotificationConfig): void {
    const { title, body, icon, silent = false } = config
    
    new Notification(title, {
      body,
      icon,
      silent
    })
  }

  /**
   * 显示消息通知
   */
  showMessageNotification(data: MessageNotificationData): void {
    // 检查是否为当前用户发送的消息
    if (this.isOwnMessage(data.senderId) && !this.showOwnMessages) {
      console.log('[NotificationManager] 跳过自己发送的消息通知')
      return
    }

    const title = data.chatType === 'private' 
      ? `来自 ${data.senderName} 的消息`
      : `群聊 ${data.groupName || '未知群组'} 的新消息`

    const body = `${data.senderName}: ${data.message}`

    this.showNotification({
      title,
      body,
      type: NotificationType.MESSAGE,
      silent: false
    })
  }

  /**
   * 显示系统通知
   */
  showSystemNotification(title: string, body?: string): void {
    if (!this.showSystemNotifications) {
      console.log('[NotificationManager] 系统通知已禁用，跳过显示')
      return
    }
    
    this.showNotification({
      title,
      body,
      type: NotificationType.SYSTEM,
      silent: true
    })
  }

  /**
   * 显示错误通知
   */
  showErrorNotification(title: string, body?: string): void {
    this.showNotification({
      title,
      body,
      type: NotificationType.ERROR,
      silent: false
    })
  }

  /**
   * 显示成功通知
   */
  showSuccessNotification(title: string, body?: string): void {
    this.showNotification({
      title,
      body,
      type: NotificationType.SUCCESS,
      silent: true
    })
  }
}

// 创建全局通知管理器实例
export const notificationManager = new NotificationManager()

// 导出便捷函数，保持向后兼容
export function showNotification(title: string, body?: string, icon?: string): void {
  notificationManager.showNotification({ title, body, icon })
}

// 导出消息通知便捷函数
export function showMessageNotification(data: MessageNotificationData): void {
  notificationManager.showMessageNotification(data)
}

// 导出系统通知便捷函数
export function showSystemNotification(title: string, body?: string): void {
  notificationManager.showSystemNotification(title, body)
}

// 导出错误通知便捷函数
export function showErrorNotification(title: string, body?: string): void {
  notificationManager.showErrorNotification(title, body)
}

// 导出成功通知便捷函数
export function showSuccessNotification(title: string, body?: string): void {
  notificationManager.showSuccessNotification(title, body)
}
