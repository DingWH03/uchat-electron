# 通知系统功能说明

## 概述

本应用的通知系统已经进行了重构和优化，现在支持更智能的消息通知管理，包括：

- 自动过滤自己发送的消息通知
- 可配置的通知设置
- 分类通知（消息通知、系统通知、错误通知、成功通知）
- 本地设置持久化

## 主要功能

### 1. 智能消息过滤

- **自动过滤自己发送的消息**：当检测到消息的发送者ID与当前用户ID相同时，不会显示通知
- **支持手动开启**：用户可以在设置中选择是否显示自己发送的消息通知

### 2. 通知分类

- **消息通知**：来自其他用户或群聊的新消息
- **系统通知**：连接状态、网络状态等系统信息
- **错误通知**：发送失败、网络错误等错误信息
- **成功通知**：登录成功、操作成功等成功信息

### 3. 可配置设置

- **启用/禁用通知**：完全控制通知功能的开启和关闭
- **自己消息通知**：选择是否显示自己发送的消息通知
- **系统通知**：选择是否显示系统状态通知
- **设置持久化**：所有设置都会保存到本地存储

## 技术实现

### 通知管理器 (NotificationManager)

```typescript
// 核心功能
- setCurrentUserId(userId: number): 设置当前用户ID
- setEnabled(enabled: boolean): 启用/禁用通知
- setShowOwnMessages(show: boolean): 控制自己消息通知
- setShowSystemNotifications(show: boolean): 控制系统通知
- loadSettings(): 从本地存储加载设置
- showMessageNotification(data): 显示消息通知
- showSystemNotification(title, body): 显示系统通知
- showErrorNotification(title, body): 显示错误通知
- showSuccessNotification(title, body): 显示成功通知
```

### 使用示例

```typescript
// 在组件中使用
import { notificationManager, showMessageNotification } from '@/utils/notification'

// 设置当前用户ID
notificationManager.setCurrentUserId(userId)

// 显示消息通知（会自动过滤自己发送的消息）
showMessageNotification({
  senderId: message.sender,
  senderName: sender.username,
  message: message.content,
  chatType: 'private'
})

// 显示系统通知
showSystemNotification('连接状态', 'WebSocket已连接')
```

### 设置组件

`NotificationSettings.vue` 组件提供了用户界面来管理通知设置：

- 启用/禁用桌面通知
- 控制自己消息通知的显示
- 控制系统通知的显示
- 设置自动保存到本地存储

## 文件结构

```
src/renderer/src/utils/
├── notification.ts          # 通知管理器核心实现
└── components/
    └── NotificationSettings.vue  # 通知设置组件
```

## 配置说明

### 默认设置

- 通知功能：启用
- 自己消息通知：禁用（默认不显示自己发送的消息）
- 系统通知：启用

### 本地存储

设置保存在 `localStorage` 中的 `notificationSettings` 键下：

```json
{
  "isEnabled": true,
  "showOwnMessages": false,
  "showSystemNotifications": true
}
```

## 使用建议

1. **在应用启动时**：调用 `notificationManager.loadSettings()` 加载用户设置
2. **在用户登录后**：调用 `notificationManager.setCurrentUserId(userId)` 设置用户ID
3. **显示消息通知时**：使用 `showMessageNotification()` 而不是直接调用 `showNotification()`
4. **系统状态通知**：使用 `showSystemNotification()` 显示连接状态等信息
5. **错误处理**：使用 `showErrorNotification()` 显示错误信息

## 注意事项

1. 通知权限需要用户手动授权
2. 在Electron环境中，通知会显示为系统级通知
3. 设置更改会立即生效，无需重启应用
4. 自己消息的过滤逻辑在多个层级都有实现，确保不会出现重复通知 