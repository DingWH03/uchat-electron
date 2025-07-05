// 通知功能测试文件
// 这个文件用于测试通知管理器的各种功能

import { notificationManager, showMessageNotification, showSystemNotification } from './notification'

// 模拟测试环境
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
}

// 测试通知管理器基本功能
describe('NotificationManager', () => {
  beforeEach(() => {
    // 重置通知管理器状态
    notificationManager.setCurrentUserId(0)
    notificationManager.setEnabled(true)
    notificationManager.setShowOwnMessages(false)
    notificationManager.setShowSystemNotifications(true)
  })

  test('应该正确设置当前用户ID', () => {
    const userId = 12345
    notificationManager.setCurrentUserId(userId)
    expect(notificationManager.getCurrentUserId()).toBe(userId)
  })

  test('应该正确识别自己发送的消息', () => {
    const userId = 12345
    notificationManager.setCurrentUserId(userId)
    
    expect(notificationManager.isOwnMessage(userId)).toBe(true)
    expect(notificationManager.isOwnMessage(99999)).toBe(false)
  })

  test('应该正确启用/禁用通知', () => {
    notificationManager.setEnabled(false)
    expect(notificationManager.isNotificationEnabled()).toBe(false)
    
    notificationManager.setEnabled(true)
    expect(notificationManager.isNotificationEnabled()).toBe(true)
  })

  test('应该正确控制自己消息通知', () => {
    notificationManager.setShowOwnMessages(true)
    // 这里可以添加更多测试逻辑
    
    notificationManager.setShowOwnMessages(false)
    // 这里可以添加更多测试逻辑
  })

  test('应该正确控制系统通知', () => {
    notificationManager.setShowSystemNotifications(false)
    // 这里可以添加更多测试逻辑
    
    notificationManager.setShowSystemNotifications(true)
    // 这里可以添加更多测试逻辑
  })
})

// 测试消息通知功能
describe('Message Notification', () => {
  beforeEach(() => {
    notificationManager.setCurrentUserId(12345)
    notificationManager.setEnabled(true)
    notificationManager.setShowOwnMessages(false)
  })

  test('应该跳过自己发送的消息通知', () => {
    const messageData = {
      senderId: 12345, // 当前用户ID
      senderName: '自己',
      message: '测试消息',
      chatType: 'private' as const
    }
    
    // 这里应该不会显示通知
    showMessageNotification(messageData)
    // 可以通过检查控制台日志来验证
  })

  test('应该显示他人发送的消息通知', () => {
    const messageData = {
      senderId: 99999, // 其他用户ID
      senderName: '其他用户',
      message: '测试消息',
      chatType: 'private' as const
    }
    
    // 这里应该显示通知
    showMessageNotification(messageData)
    // 可以通过检查控制台日志来验证
  })

  test('应该显示群聊消息通知', () => {
    const messageData = {
      senderId: 99999,
      senderName: '群成员',
      message: '群聊测试消息',
      chatType: 'group' as const,
      groupName: '测试群组'
    }
    
    // 这里应该显示通知
    showMessageNotification(messageData)
    // 可以通过检查控制台日志来验证
  })
})

// 测试系统通知功能
describe('System Notification', () => {
  beforeEach(() => {
    notificationManager.setShowSystemNotifications(true)
  })

  test('应该显示系统通知', () => {
    showSystemNotification('系统状态', '连接成功')
    // 可以通过检查控制台日志来验证
  })

  test('应该在禁用系统通知时不显示', () => {
    notificationManager.setShowSystemNotifications(false)
    showSystemNotification('系统状态', '连接成功')
    // 应该不会显示通知
  })
})

// 导出测试函数供手动测试使用
export function runNotificationTests() {
  console.log('开始运行通知功能测试...')
  
  // 测试基本功能
  notificationManager.setCurrentUserId(12345)
  console.log('当前用户ID:', notificationManager.getCurrentUserId())
  
  // 测试自己消息识别
  console.log('消息来自自己:', notificationManager.isOwnMessage(12345))
  console.log('消息来自他人:', notificationManager.isOwnMessage(99999))
  
  // 测试消息通知
  showMessageNotification({
    senderId: 12345,
    senderName: '自己',
    message: '这是自己发送的消息',
    chatType: 'private'
  })
  
  showMessageNotification({
    senderId: 99999,
    senderName: '其他用户',
    message: '这是他人发送的消息',
    chatType: 'private'
  })
  
  // 测试系统通知
  showSystemNotification('测试', '这是一个系统通知')
  
  console.log('通知功能测试完成')
} 